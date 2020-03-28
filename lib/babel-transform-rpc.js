const pathUtil = require('path');

/**
 * @param {import('@babel/core')} param1
 * @param {{ isServer: boolean, pagesDir: string }} param2
 * @returns {import('@babel/core').PluginObj}
 */
module.exports = function({ types: t, ...babel }, { isServer, pagesDir }) {
  return {
    pre (state) {
      this.isRpc = false;
      this.defaultExportPath = null;
      this.exports = [];
    },
    visitor: {
      ExportNamedDeclaration (path) {
        const { declaration } = path.node;
        if (t.isFunctionDeclaration(declaration)) {
          if (!declaration.async) {
            throw path.buildCodeFrameError(
              'rpc exports must be declared "async"'
            );
          }
          this.exports.push(declaration.id.name);
          return;
        } else if (
          t.isVariableDeclaration(declaration) &&
          declaration.kind === 'const' &&
          declaration.declarations.length === 1 &&
          declaration.declarations[0].id.name === 'config' &&
          t.isObjectExpression(declaration.declarations[0].init) &&
          declaration.declarations[0].init.properties.some(property => {
            return (
              property.key.name === 'rpc' &&
              t.isBooleanLiteral(property.value, { value: true })
            );
          })
        ) {
          this.isRpc = true;
          return;
        }
        throw path.buildCodeFrameError(
          'only exports of the form "export async function X () {"  are allowed in rpc files'
        )
      },
      ExportDefaultDeclaration (path) {
        this.defaultExportPath = path
      },
      Program: {
        exit (path) {
          if (!this.isRpc) {
            return;
          }
          if (this.defaultExportPath) {
            throw defaultExportPath.buildCodeFrameError(
              'default exports are not allowed in rpc files'
            )
          }
          if (isServer) {
            path.node.body.push(
              babel.template.statement(`
                export default async (req, res) => {
                  const { id, params } = req.body;
                  const method = %%exports%%[id];

                  if (typeof method !== 'function') {
                    res.json({
                      error: {
                        message: '"' + id + '" is not a function'
                      }
                    });
                  }

                  try {
                    const result = await method(...params);
                    return res.json({ result });
                  } catch (err) {
                    return res.json({
                      error: {
                        message: err.message
                      }
                    });
                  }
                }
              `)({
                exports: t.objectExpression(this.exports.map(name => {
                  return t.objectProperty(t.identifier(name), t.identifier(name), false, true)
                }))
              })
            )
          } else {
            if (!this.file.opts.filename.startsWith(pagesDir)) {
              throw new Error(`unexpected file ${this.file.opts.filename}`)
            }

            const rpcPath = this.file.opts.filename
              .slice(pagesDir.length)
              .replace(/\.[j|t]sx?$/, '')
              .replace(/\/index$/, '');

            path.node.body = this.exports.map(name => {
              return babel.template.statement(`
                export async function %%name%% (...params) {
                  const res = await fetch(%%rpcPath%%, {
                    method: 'POST',
                    body: JSON.stringify({ id: %%rpcId%%, params }),
                    headers: {
                      'content-type': 'application/json'
                    }
                  });

                  if (!res.ok) {
                    throw new Error('Unexpected HTTP status ' + res.status);
                  }

                  const { result, error } = await res.json();
                  if (error) {
                    throw new Error(error.message);
                  }
                  return result;
                }
              `)({
                name: t.identifier(name),
                rpcId: t.stringLiteral(name),
                rpcPath: t.stringLiteral(rpcPath)
              })
            });
          }
        }
      }
    }
  }
}
