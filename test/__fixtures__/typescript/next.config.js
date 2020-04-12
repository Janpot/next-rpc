const withRpc = require('../../../lib')();
module.exports = withRpc({
  experimental: { jsconfigPaths: true },
});
