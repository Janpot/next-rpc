/**
 * @param {import('next').NextApiResponse} res
 * @param {number} status
 * @param {string} message
 */
function sendError(res, status, message) {
  res.status(status).json({ error: { message } });
}

/**
 * @param {[string, (...params: any[]) => Promise<any>][]} methodsInit
 */
function createRpcHandler(methodsInit) {
  const methods = new Map(methodsInit);
  return /** @type {import('next').NextApiHandler} */ (
    async (req, res) => {
      if (req.method !== 'POST') {
        sendError(res, 405, `method "${req.method}" is not allowed`);
        return;
      }

      const { method, params } = req.body;
      const requestedFn = methods.get(method);

      if (typeof requestedFn !== 'function') {
        sendError(res, 400, `"${method}" is not a function`);
        return;
      }

      try {
        const result = await requestedFn(...params);
        return res.json({ result });
      } catch (error) {
        const {
          name = 'NextRpcError',
          message = `Invalid value thrown in "${method}", must be instance of Error`,
          stack = undefined,
        } = error instanceof Error ? error : {};
        return res.status(500).json({
          error: {
            name,
            message,
            stack: process.env.NODE_ENV === 'production' ? undefined : stack,
          },
        });
      }
    }
  );
}

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.createRpcHandler = createRpcHandler;
