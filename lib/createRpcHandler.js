/**
 * @param {{ [key: string]: (...params: any[]) => Promise<any>}} methods
 */
export default function createRpcHandler(methods) {
  return /** @type {import('next').NextApiHandler} */ (async (req, res) => {
    const { method, params } = req.body;
    const requestedFn = methods[method];

    if (typeof requestedFn !== 'function') {
      res.json({
        error: {
          message: '"' + method + '" is not a function',
        },
      });
    }

    try {
      const result = await requestedFn(...params);
      return res.json({ result });
    } catch (error) {
      const { name, message, stack } = error;
      return res.json({
        error: {
          name,
          message,
          stack: process.env.NODE_ENV === 'production' ? undefined : stack,
        },
      });
    }
  });
}
