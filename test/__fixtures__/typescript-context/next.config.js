const path = require('path');
const withRpc = require('../../..')({
  experimentalContext: true,
});
module.exports = withRpc({
  webpack(config) {
    config.resolve.alias['next-rpc'] = path.resolve(__dirname, '../../..');
    return config;
  },
});
