import { annotateAsPure } from './astUtils';
import * as babel from '@babel/core';

type Babel = typeof babel;
type BabelTypes = typeof babel.types;

const IMPORT_PATH_SERVER = 'next-rpc/dist/server';
const IMPORT_PATH_BROWSER = 'next-rpc/dist/browser';

function buildRpcApiHandler(
  t: BabelTypes,
  createRpcHandlerIdentifier: babel.types.Identifier,
  rpcMethodNames: string[]
): babel.types.Expression {
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

function isAllowedTsExportDeclaration(
  t: BabelTypes,
  declaration: any
): boolean {
  return (
    t.isTSTypeAliasDeclaration(declaration) ||
    t.isTSInterfaceDeclaration(declaration)
  );
}

function getConfigObjectExpression(
  t: BabelTypes,
  varDeclaration: babel.types.VariableDeclarator
): babel.types.ObjectExpression | null {
  if (
    t.isIdentifier(varDeclaration.id) &&
    varDeclaration.id.name === 'config' &&
    t.isObjectExpression(varDeclaration.init)
  ) {
    return varDeclaration.init;
  } else {
    return null;
  }
}

function isRpcProgram(
  t: BabelTypes,
  path: babel.NodePath<babel.types.Program>
): boolean {
  for (const node of path.node.body) {
    if (t.isExportNamedDeclaration(node)) {
      const { declaration } = node;
      if (
        t.isVariableDeclaration(declaration) &&
        declaration.kind === 'const'
      ) {
        for (const varDeclaration of declaration.declarations) {
          const configObject = getConfigObjectExpression(t, varDeclaration);
          if (configObject) {
            for (const property of configObject.properties) {
              if (
                t.isObjectProperty(property) &&
                t.isIdentifier(property.key) &&
                property.key.name === 'rpc' &&
                t.isBooleanLiteral(property.value, { value: true })
              ) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
}

export interface PluginOptions {
  isServer: boolean;
  pagesDir: string;
  dev: boolean;
  apiDir: string;
  basePath: string;
}

export default function (
  { types: t }: Babel,
  { apiDir, pagesDir, isServer, basePath }: PluginOptions
): babel.PluginObj {
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

        if (!isRpcProgram(t, path)) {
          return;
        }

        const rpcRelativePath = filename
          .slice(pagesDir.length)
          .replace(/\.[j|t]sx?$/, '')
          .replace(/\/index$/, '');

        const rpcPath =
          basePath === '/' ? rpcRelativePath : `${basePath}/${rpcRelativePath}`;

        const rpcMethodNames: string[] = [];

        path.traverse({
          ExportNamedDeclaration(path) {
            const { declaration } = path.node;
            if (isAllowedTsExportDeclaration(t, declaration)) {
              return;
            } else if (t.isFunctionDeclaration(declaration)) {
              if (!declaration.async) {
                throw path.buildCodeFrameError(
                  'rpc exports must be declared "async"'
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
                if (getConfigObjectExpression(t, varDeclaration)) {
                  // ignore
                } else if (
                  t.isFunctionExpression(varDeclaration.init) ||
                  t.isArrowFunctionExpression(varDeclaration.init)
                ) {
                  if (!varDeclaration.init.async) {
                    throw path.buildCodeFrameError(
                      'rpc exports must be declared "async"'
                    );
                  }
                  const { id } = varDeclaration;
                  if (t.isIdentifier(id)) {
                    rpcMethodNames.push(id.name);
                  }
                } else {
                  throw path.buildCodeFrameError(
                    'rpc exports must be static functions'
                  );
                }
              }
            } else {
              throw path.buildCodeFrameError(
                'rpc exports must be static functions'
              );
            }
          },
          ExportDefaultDeclaration(path) {
            throw path.buildCodeFrameError(
              'default exports are not allowed in rpc routes'
            );
          },
        });

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
              t.stringLiteral(IMPORT_PATH_SERVER)
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
              t.stringLiteral(IMPORT_PATH_BROWSER)
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
}
