const pathUtil = require('path');

const PURE_ANNOTATION = '#__PURE__';

/**
 * @param {import('@babel/core')} param1
 * @param {{ isServer: boolean, pagesDir: string }} param2
 * @returns {import('@babel/core').PluginObj}
 */
module.exports = function ({ types: t, ...babel }, { isServer, pagesDir }) {
  const annotateAsPure = (node) => {
    t.addComment(node, 'leading', PURE_ANNOTATION);
    return node;
  };

  return {
    pre(state) {
      this.isRpc = false;
      this.exports = [];
      this.errors = [];
    },
    visitor: {
      ExportNamedDeclaration(path) {
        const { declaration } = path.node;
        if (t.isFunctionDeclaration(declaration)) {
          if (!declaration.async) {
            this.errors.push(
              path.buildCodeFrameError('rpc exports must be declared "async"')
            );
          }
          this.exports.push(declaration.id.name);
        } else if (
          t.isVariableDeclaration(declaration) &&
          declaration.kind === 'const'
        ) {
          for (const varDeclaration of declaration.declarations) {
            if (
              varDeclaration.id.name === 'config' &&
              t.isObjectExpression(varDeclaration.init) &&
              varDeclaration.init.properties.some((property) => {
                return (
                  property.key.name === 'rpc' &&
                  t.isBooleanLiteral(property.value, { value: true })
                );
              })
            ) {
              this.isRpc = true;
            } else if (
              t.isFunctionExpression(varDeclaration.init) ||
              t.isArrowFunctionExpression(varDeclaration.init)
            ) {
              if (!varDeclaration.init.async) {
                this.errors.push(
                  path.buildCodeFrameError(
                    'rpc exports must be declared "async"'
                  )
                );
              }
              this.exports.push(varDeclaration.id.name);
            } else {
              this.errors.push(
                path.buildCodeFrameError('rpc exports must be static functions')
              );
            }
          }
        } else {
          this.errors.push(
            path.buildCodeFrameError('rpc exports must be static functions')
          );
        }
      },
      ExportDefaultDeclaration(path) {
        this.errors.push(
          path.buildCodeFrameError(
            'default exports are not allowed in rpc routes'
          )
        );
      },
      Program: {
        exit(path) {
          if (!this.isRpc) {
            return;
          }
          if (this.errors.length > 0) {
            throw this.errors[0];
          }
          if (isServer) {
            const createRpcHandlerIdentifier = path.scope.generateUidIdentifier(
              'createRpcHandler'
            );

            path.node.body = [
              t.importDeclaration(
                [t.importDefaultSpecifier(createRpcHandlerIdentifier)],
                t.stringLiteral('next-rpc/createRpcHandler')
              ),
              ...path.node.body,
              t.exportDefaultDeclaration(
                annotateAsPure(
                  t.callExpression(createRpcHandlerIdentifier, [
                    t.objectExpression(
                      this.exports.map((name) => {
                        return t.objectProperty(
                          t.identifier(name),
                          t.identifier(name),
                          false,
                          true
                        );
                      })
                    ),
                  ])
                )
              ),
            ];
          } else {
            if (!this.file.opts.filename.startsWith(pagesDir)) {
              throw new Error(`unexpected file ${this.file.opts.filename}`);
            }

            const rpcPath = this.file.opts.filename
              .slice(pagesDir.length)
              .replace(/\.[j|t]sx?$/, '')
              .replace(/\/index$/, '');

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
                  this.exports.map((name) =>
                    t.variableDeclarator(
                      t.identifier(name),
                      annotateAsPure(
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
        },
      },
    },
  };
};
