const { findPagesDir } = require('next/dist/lib/find-pages-dir');
const path = require('path');

module.exports = (rpcConfig) => (nextConfig = {}) => {
  return {
    webpack(config, options) {
      const { isServer, dev, dir } = options;
      const pagesDir = findPagesDir(dir);

      config.resolve.alias['next-rpc/createRpcFetcher'] = require.resolve(
        './createRpcFetcher'
      );

      config.resolve.alias['next-rpc/createRpcHandler'] = require.resolve(
        './createRpcHandler'
      );

      config.module.rules.push({
        test: /\.(tsx|ts|js|mjs|jsx)$/,
        include: [path.resolve(pagesDir, './api')],
        use: [
          options.defaultLoaders.babel,
          {
            loader: 'babel-loader',
            options: {
              sourceMaps: dev,
              plugins: [
                [
                  require.resolve('./babelTransformRpc'),
                  { isServer, pagesDir, dev },
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
