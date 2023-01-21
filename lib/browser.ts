import { JsonRpcRequest, JsonRpcResponse } from './jsonRpc';
import { isPlainObject, hasOwnProperty } from './validation';

function isJsonRpc(result: unknown): result is JsonRpcResponse {
  return (
    isPlainObject(result) &&
    hasOwnProperty(result, 'jsonrpc') &&
    result.jsonrpc === '2.0' &&
    hasOwnProperty(result, 'id') &&
    (result.id === null ||
      typeof result.id === 'string' ||
      typeof result.id === 'number') &&
    (!hasOwnProperty(result, 'error') ||
      (hasOwnProperty(result, 'error') &&
        isPlainObject(result.error) &&
        hasOwnProperty(result.error, 'code') &&
        typeof result.error.code === 'number' &&
        hasOwnProperty(result.error, 'message') &&
        typeof result.error.message === 'string'))
  );
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Workaround for https://github.com/facebook/create-react-app/issues/4760
 * See https://github.com/zeit/next.js/blob/b88f20c90bf4659b8ad5cb2a27956005eac2c7e8/packages/next/client/dev/error-overlay/hot-dev-client.js#L105
 */
function rewriteStacktrace(error: Error): Error {
  const toReplaceRegex = new RegExp(
    escapeRegExp(process.env.__NEXT_DIST_DIR as string),
    'g'
  );
  error.stack =
    error.stack && error.stack.replace(toReplaceRegex, '/_next/development');
  return error;
}

function getJsonRpcErrorMessage(code: number): string {
  switch (code) {
    case -32700:
      return 'Parse error';
    case -32600:
      return 'Invalid Request';
    case -32601:
      return 'Method not found';
    case -32602:
      return 'Invalid params';
    case -32603:
      return 'Internal error';
    default:
      return 'Server error';
  }
}

type NextRpcCall = (...params: any[]) => any;

let nextId = 1;

function createRpcFetcher(url: string, method: string): NextRpcCall {
  return function rpcFetch() {
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: nextId++,
        method,
        params: Array.prototype.slice.call(arguments),
      } satisfies JsonRpcRequest),
      headers: {
        'content-type': 'application/json',
      },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        if (!isJsonRpc(json)) {
          throw new Error('Invalid Response');
        }

        if (json.error) {
          if (json.error.code >= -32768 && json.error.code <= -32000) {
            throw new Error(getJsonRpcErrorMessage(json.error.code));
          }

          let err: Error = Object.assign(
            new Error(json.error.message),
            json.error.data
          );

          if (process.env.NODE_ENV !== 'production') {
            err = rewriteStacktrace(err);
          }

          throw err;
        }

        return json.result;
      });
  };
}

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.createRpcFetcher = createRpcFetcher;
