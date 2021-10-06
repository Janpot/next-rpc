const path = require('path');
const withRpc = require('../../..')();
module.exports = withRpc({
  basePath: '/hello/world',
  webpack(config) {
    config.resolve.alias['next-rpc'] = path.resolve(__dirname, '../../..');
    return config;
  },
});
