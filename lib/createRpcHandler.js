export default function createRpcHandler(methods) {
  return async (req, res) => {
    const { method, params } = req.body;
    const methodFn = methods[method];

    if (typeof methodFn !== 'function') {
      res.json({
        error: {
          message: '"' + method + '" is not a function',
        },
      });
    }

    try {
      const result = await methodFn(...params);
      return res.json({ result });
    } catch (error) {
      const { message, code } = error;
      return res.json({
        error: { message, code },
      });
    }
  };
}
