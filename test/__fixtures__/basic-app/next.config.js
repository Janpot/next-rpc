const withRpc = require('../../..')();
module.exports = withRpc({
  experimental: { jsconfigPaths: true },
});
