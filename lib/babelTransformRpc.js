const { annotateAsPure } = require('./astUtils');

/**
 * @param {typeof import('@babel/core').types} t
 * @param {import('@babel/core').types.Identifier} createRpcHandlerIdentifier
 * @param {string[]} rpcMethodNames
 * @returns {import('@babel/core').types.Expression}
 */
function buildRpcApiHandler(t, createRpcHandlerIdentifier, rpcMethodNames) {
  return annotateAsPure(
    t,
    t.callExpression(createRpcHandlerIdentifier, [
      t.arrayExpression(
        rpcMethodNames.map((name) =>
          t.arrayExpression([t.stringLiteral(name), t.identifier(name)])
        )
      ),
    ])
  );
}

/**
 * @typedef {{ isServer: boolean, pagesDir: string, dev: boolean, apiDir: string }} PluginOptions
 */

/**
 * @param {import('@babel/core')} param1
 * @param {import('@babel/core').NodePath<import('@babel/core').types.Program>} path
 * @param {PluginOptions & { rpcPath: string }} param2
 */
function visitApiHandler(
  { types: t, ...babel },
  path,
  { isServer, pagesDir, dev, apiDir, rpcPath }
) {
  /** @type {Error[]} */
  const errors = [];
  /** @type {string[]} */
  const rpcMethodNames = [];
  let isRpc = false;
  /** @type {import('@babel/core').NodePath<import('@babel/core').types.ExportDefaultDeclaration> | undefined} */
  let defaultExportPath;

  path.traverse({
    ExportNamedDeclaration(path) {
      const { declaration } = path.node;
      if (t.isFunctionDeclaration(declaration)) {
        if (!declaration.async) {
          errors.push(
            path.buildCodeFrameError('rpc exports must be declared "async"')
          );
        }
        if (declaration.id) {
          rpcMethodNames.push(declaration.id.name);
        }
      } else if (
        t.isVariableDeclaration(declaration) &&
        declaration.kind === 'const'
      ) {
        for (const varDeclaration of declaration.declarations) {
          if (
            t.isIdentifier(varDeclaration.id) &&
            varDeclaration.id.name === 'config' &&
            t.isObjectExpression(varDeclaration.init) &&
            varDeclaration.init.properties.some((property) => {
              return (
                t.isObjectProperty(property) &&
                property.key.name === 'rpc' &&
                t.isBooleanLiteral(property.value, { value: true })
              );
            })
          ) {
            isRpc = true;
          } else if (
            t.isFunctionExpression(varDeclaration.init) ||
            t.isArrowFunctionExpression(varDeclaration.init)
          ) {
            if (!varDeclaration.init.async) {
              errors.push(
                path.buildCodeFrameError('rpc exports must be declared "async"')
              );
            }
            const { id } = varDeclaration;
            if (t.isIdentifier(id)) {
              rpcMethodNames.push(id.name);
            }
          } else {
            errors.push(
              path.buildCodeFrameError('rpc exports must be static functions')
            );
          }
        }
      } else {
        errors.push(
          path.buildCodeFrameError('rpc exports must be static functions')
        );
      }
    },
    ExportDefaultDeclaration(path) {
      defaultExportPath = path;
    },
  });

  if (!isRpc) {
    return;
  }

  if (errors.length > 0) {
    throw errors[0];
  }

  if (defaultExportPath) {
    throw path.buildCodeFrameError(
      'default exports are not allowed in rpc routes'
    );
  }

  if (isServer) {
    const createRpcHandlerIdentifier = path.scope.generateUidIdentifier(
      'createRpcHandler'
    );

    let apiHandlerExpression = buildRpcApiHandler(
      t,
      createRpcHandlerIdentifier,
      rpcMethodNames
    );

    path.node.body = [
      t.importDeclaration(
        [t.importDefaultSpecifier(createRpcHandlerIdentifier)],
        t.stringLiteral('next-rpc/createRpcHandler')
      ),
      ...path.node.body,
      t.exportDefaultDeclaration(apiHandlerExpression),
    ];
  } else {
    const createRpcFetcherIdentifier = path.scope.generateUidIdentifier(
      'createRpcFetcher'
    );

    path.node.body = [
      t.importDeclaration(
        [t.importDefaultSpecifier(createRpcFetcherIdentifier)],
        t.stringLiteral('next-rpc/createRpcFetcher')
      ),
      t.exportNamedDeclaration(
        t.variableDeclaration(
          'const',
          rpcMethodNames.map((name) =>
            t.variableDeclarator(
              t.identifier(name),
              annotateAsPure(
                t,
                t.callExpression(createRpcFetcherIdentifier, [
                  t.stringLiteral(rpcPath),
                  t.stringLiteral(name),
                ])
              )
            )
          )
        )
      ),
    ];
  }
}

/**
 * @param {import('@babel/core')} param1
 * @param {import('@babel/core').NodePath<import('@babel/core').types.Program>} path
 * @param {PluginOptions} param2
 */
function visitPage({ types: t }, path, { isServer, pagesDir, dev, apiDir }) {
  if (!isServer) {
    return;
  }

  const wrapGetServerSidePropsIdentifier = path.scope.generateUidIdentifier(
    'wrapGetServerSideProps'
  );

  path.node.body.unshift(
    t.importDeclaration(
      [
        t.importSpecifier(
          wrapGetServerSidePropsIdentifier,
          t.identifier('wrapGetServerSideProps')
        ),
      ],
      t.stringLiteral('next-rpc/context')
    )
  );

  path.traverse({
    ExportNamedDeclaration(path) {
      const { declaration } = path.node;
      if (
        t.isFunctionDeclaration(declaration) &&
        t.isIdentifier(declaration.id, { name: 'getServerSideProps' })
      ) {
        /** @type {import('@babel/core').types.Expression} */
        const exportAsExpression = t.isDeclaration(declaration)
          ? t.toExpression(declaration)
          : declaration;

        path.node.declaration = t.variableDeclaration('const', [
          t.variableDeclarator(
            /** @type {import('@babel/core').types.Identifier} */ (declaration.id),
            annotateAsPure(
              t,
              t.callExpression(wrapGetServerSidePropsIdentifier, [
                exportAsExpression,
              ])
            )
          ),
        ]);
      }
    },
  });
}

/**
 * @param {import('@babel/core')} babel
 * @param {PluginOptions} options
 * @returns {import('@babel/core').PluginObj}
 */
module.exports = function (babel, options) {
  const { apiDir, pagesDir } = options;

  return {
    visitor: {
      Program(path) {
        const rpcPath = this.file.opts.filename
          .slice(pagesDir.length)
          .replace(/\.[j|t]sx?$/, '')
          .replace(/\/index$/, '');

        const isApiRoute = this.file.opts.filename.startsWith(apiDir);

        if (isApiRoute) {
          visitApiHandler(babel, path, { ...options, rpcPath });
        } else {
          visitPage(babel, path, options);
        }
      },
    },
  };
};
