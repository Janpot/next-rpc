module.exports = function withRpc(nextConfig = {}) {
  return {
    webpack(config, options) {
      const { isServer } = options;

      config.resolve.alias['next-rpc/createRpcFetcher'] = require.resolve(
        './createRpcFetcher'
      );
      config.resolve.alias['next-rpc/createRpcHandler'] = require.resolve(
        './createRpcHandler'
      );

      config.module.rules.push({
        test: /pages\/api\/.*\.(js|jsx|ts|tsx)$/,
        use: [
          options.defaultLoaders.babel,
          {
            loader: 'babel-loader',
            options: {
              plugins: [
                [
                  require.resolve('./babelTransformRpc'),
                  { isServer, pagesDir: options.dir + '/pages' },
                ],
              ],
            },
          },
        ],
      });
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      } else {
        return config;
      }
    },
  };
};
