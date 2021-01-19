const path = require('path');
const withRpc = require('../../../lib')();
module.exports = withRpc({
  webpack(config) {
    config.resolve.alias['next-rpc'] = path.resolve(__dirname, '../../..');
    return config;
  },
});
