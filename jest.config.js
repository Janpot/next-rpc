module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?:puppeteer|web-streams-polyfill)/.+\\.js$',
  ],
};
