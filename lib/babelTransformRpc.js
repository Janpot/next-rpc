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
 * @param {typeof import('@babel/core').types} t
 * @param {any} declaration
 * @returns {boolean}
 */
function isAllowedTsExportDeclaration(t, declaration) {
  return (
    t.isTSTypeAliasDeclaration(declaration) ||
    t.isTSInterfaceDeclaration(declaration)
  );
}

/**
 * @typedef {{ isServer: boolean, pagesDir: string, dev: boolean, apiDir: string }} PluginOptions
 */

/**
 * @param {import('@babel/core')} babel
 * @param {PluginOptions} options
 * @returns {import('@babel/core').PluginObj}
 */
module.exports = function (
  { types: t, ...babel },
  { apiDir, pagesDir, isServer, dev }
) {
  return {
    visitor: {
      Program(path) {
        const { filename } = this.file.opts;

        if (!filename) {
          return;
        }

        const isApiRoute = filename && filename.startsWith(apiDir);

        if (!isApiRoute) {
          return;
        }

        const rpcPath = filename
          .slice(pagesDir.length)
          .replace(/\.[j|t]sx?$/, '')
          .replace(/\/index$/, '');

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
            if (isAllowedTsExportDeclaration(t, declaration)) {
              return;
            } else if (t.isFunctionDeclaration(declaration)) {
              if (!declaration.async) {
                errors.push(
                  path.buildCodeFrameError(
                    'rpc exports must be declared "async"'
                  )
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
                      t.isIdentifier(property.key) &&
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
                      path.buildCodeFrameError(
                        'rpc exports must be declared "async"'
                      )
                    );
                  }
                  const { id } = varDeclaration;
                  if (t.isIdentifier(id)) {
                    rpcMethodNames.push(id.name);
                  }
                } else {
                  errors.push(
                    path.buildCodeFrameError(
                      'rpc exports must be static functions'
                    )
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
          const createRpcHandlerIdentifier =
            path.scope.generateUidIdentifier('createRpcHandler');

          let apiHandlerExpression = buildRpcApiHandler(
            t,
            createRpcHandlerIdentifier,
            rpcMethodNames
          );

          path.node.body = [
            t.importDeclaration(
              [
                t.importSpecifier(
                  createRpcHandlerIdentifier,
                  t.identifier('createRpcHandler')
                ),
              ],
              t.stringLiteral('next-rpc/lib/server')
            ),
            ...path.node.body,
            t.exportDefaultDeclaration(apiHandlerExpression),
          ];
        } else {
          const createRpcFetcherIdentifier =
            path.scope.generateUidIdentifier('createRpcFetcher');

          path.node.body = [
            t.importDeclaration(
              [
                t.importSpecifier(
                  createRpcFetcherIdentifier,
                  t.identifier('createRpcFetcher')
                ),
              ],
              t.stringLiteral('next-rpc/lib/browser')
            ),
            ...rpcMethodNames.map((name) =>
              t.exportNamedDeclaration(
                t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier(name),
                    annotateAsPure(
                      t,
                      t.callExpression(createRpcFetcherIdentifier, [
                        t.stringLiteral(rpcPath),
                        t.stringLiteral(name),
                      ])
                    )
                  ),
                ])
              )
            ),
          ];
        }
      },
    },
  };
};
