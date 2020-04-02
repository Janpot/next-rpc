/**
 * @param {[string, (...params: any[]) => Promise<any>][]} methodsInit
 */
export default function createRpcHandler(methodsInit) {
  const methods = new Map(methodsInit);
  return /** @type {import('next').NextApiHandler} */ (async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({
        error: {
          message: `method "${req.method}" is not allowed`,
        },
      });
      return;
    }

    const { method, params } = req.body;
    const requestedFn = methods.get(method);

    if (typeof requestedFn !== 'function') {
      res.status(400).json({
        error: {
          message: `"${method}" is not a function`,
        },
      });
      return;
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
