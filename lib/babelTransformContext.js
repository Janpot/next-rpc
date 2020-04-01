const { annotateAsPure } = require('./astUtils');

/**
 * @typedef {{ apiDir: string, isServer: boolean }} PluginOptions
 */

/**
 * @param {import('@babel/core')} param1
 * @param {import('@babel/core').NodePath<import('@babel/core').types.Program>} path
 */
function visitApiHandler({ types: t, ...babel }, path) {
  /** @type {import('@babel/core').NodePath<import('@babel/core').types.ExportDefaultDeclaration> | undefined} */
  let defaultExportPath;

  path.traverse({
    ExportDefaultDeclaration(path) {
      defaultExportPath = path;
    },
  });

  if (defaultExportPath) {
    const { declaration } = defaultExportPath.node;
    if (t.isTSDeclareFunction(declaration)) {
      return;
    }

    const wrapApiHandlerIdentifier = path.scope.generateUidIdentifier(
      'wrapApiHandler'
    );

    path.node.body.unshift(
      t.importDeclaration(
        [
          t.importSpecifier(
            wrapApiHandlerIdentifier,
            t.identifier('wrapApiHandler')
          ),
        ],
        t.stringLiteral('next-rpc/context')
      )
    );

    /** @type {import('@babel/core').types.Expression} */
    const exportAsExpression = t.isDeclaration(declaration)
      ? t.toExpression(declaration)
      : declaration;

    defaultExportPath.replaceWith(
      t.exportDefaultDeclaration(
        annotateAsPure(
          t,
          t.callExpression(wrapApiHandlerIdentifier, [exportAsExpression])
        )
      )
    );
  }
}

/**
 * @param {import('@babel/core')} param1
 * @param {import('@babel/core').NodePath<import('@babel/core').types.Program>} path
 */
function visitPage({ types: t }, path) {
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
  const { apiDir, isServer } = options;
  console.log('hello');

  return {
    visitor: {
      Program(path) {
        if (!isServer) {
          return;
        }

        const isApiRoute = this.file.opts.filename.startsWith(apiDir);

        if (isApiRoute) {
          visitApiHandler(babel, path);
        } else {
          visitPage(babel, path);
        }
      },
    },
  };
};
