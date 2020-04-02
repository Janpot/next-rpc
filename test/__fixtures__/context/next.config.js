const withRpc = require('../../..')({
  experimentalContext: true,
});
module.exports = withRpc({
  experimental: { jsconfigPaths: true },
});
