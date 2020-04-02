const { findPagesDir } = require('next/dist/lib/find-pages-dir');
const path = require('path');

/**
 * @typedef {{
 *   experimentalContext?: boolean
 * }} WithRpcConfig
 *
 * @typedef {{
 *   webpack?: any
 * }} NextConfig
 *
 * @typedef {{
 *   isServer: boolean
 *   dev: boolean
 *   dir: string
 *   defaultLoaders: {
 *     babel: import('webpack').Loader
 *   }
 * }} NextWebpackOptions
 */

/**
 * @param {WithRpcConfig} withRpcConfig
 */
module.exports = (withRpcConfig = {}) => {
  return (nextConfig = /** @type {NextConfig} */ ({})) => {
    return {
      ...nextConfig,

      /**
       * @param {import('webpack').Configuration} config
       * @param {NextWebpackOptions} options
       */
      webpack(config, options) {
        const { experimentalContext = false } = withRpcConfig;
        const { isServer, dev, dir } = options;
        const pagesDir = findPagesDir(dir);
        const apiDir = path.resolve(pagesDir, './api');

        /** @type {import('webpack').Module} */ (config.module).rules.push({
          test: /\.(tsx|ts|js|mjs|jsx)$/,
          include: [pagesDir],
          use: [
            options.defaultLoaders.babel,
            {
              loader: 'babel-loader',
              options: {
                sourceMaps: dev,
                plugins: [
                  ...(experimentalContext
                    ? [
                        [
                          require.resolve('./babelTransformContext'),
                          { apiDir, isServer },
                        ],
                      ]
                    : []),
                  [
                    require.resolve('./babelTransformRpc'),
                    { isServer, pagesDir, dev, apiDir },
                  ],
                  require.resolve('@babel/plugin-syntax-jsx'),
                  [
                    require.resolve('@babel/plugin-syntax-typescript'),
                    { isTSX: true },
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
};
