const { findPagesDir } = require('next/dist/lib/find-pages-dir');
const path = require('path');

function addAlias(alias, filePath) {
  alias[`next-rpc/${filePath}`] = path.resolve(__dirname, filePath);
}

module.exports = (rpcConfig) => (nextConfig = {}) => {
  return {
    ...nextConfig,
    webpack(config, options) {
      const { isServer, dev, dir } = options;
      const pagesDir = findPagesDir(dir);
      const apiDir = path.resolve(pagesDir, './api');

      addAlias(config.resolve.alias, 'createRpcFetcher');
      addAlias(config.resolve.alias, 'createRpcHandler');

      config.module.rules.push({
        test: /\.(tsx|ts|js|mjs|jsx)$/,
        include: [apiDir],
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
