/**
 * @param {string} string
 * @returns {string}
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Workaround for https://github.com/facebook/create-react-app/issues/4760
 * See https://github.com/zeit/next.js/blob/b88f20c90bf4659b8ad5cb2a27956005eac2c7e8/packages/next/client/dev/error-overlay/hot-dev-client.js#L105
 * @param {Error} error
 * @returns {Error}
 */
function rewriteStacktrace(error) {
  if (process.env.NODE_ENV === 'production') {
    return error;
  }
  const toReplaceRegex = new RegExp(
    escapeRegExp(/** @type {string} */ (process.env.__NEXT_DIST_DIR)),
    'g'
  );
  error.stack =
    error.stack && error.stack.replace(toReplaceRegex, '/_next/development');
  return error;
}

/**
 * @typedef {(...params: any[]) => any} NextRpcCall
 * @param {string} url
 * @param {string} method
 * @returns {NextRpcCall}
 */
function createRpcFetcher(url, method) {
  return async (...params) => {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ method, params }),
      headers: {
        'content-type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Unexpected HTTP status ' + res.status);
    }

    const { result, error } = await res.json();
    if (error) {
      const { message, ...props } = error;
      throw rewriteStacktrace(Object.assign(new Error(message), props));
    }
    return result;
  };
}

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.createRpcFetcher = createRpcFetcher;
