const { findPagesDir } = require('next/dist/lib/find-pages-dir');
const path = require('path');

module.exports = (withRpcConfig = {}) => (nextConfig = {}) => {
  return {
    ...nextConfig,
    webpack(config, options) {
      const { enableContext = false } = withRpcConfig;
      const { isServer, dev, dir } = options;
      const pagesDir = findPagesDir(dir);
      const apiDir = path.resolve(pagesDir, './api');

      config.resolve.alias = {
        ...config.resolve.alias,
        'next-rpc': path.resolve(__dirname),
      };

      config.module.rules.push({
        test: /\.(tsx|ts|js|mjs|jsx)$/,
        include: [pagesDir],
        use: [
          options.defaultLoaders.babel,
          {
            loader: 'babel-loader',
            options: {
              sourceMaps: dev,
              plugins: [
                [
                  require.resolve('./babelTransformRpc'),
                  { isServer, pagesDir, dev, apiDir, enableContext },
                ],
                '@babel/plugin-syntax-jsx',
                ['@babel/plugin-syntax-typescript', { isTSX: true }],
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
