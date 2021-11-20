module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  transformIgnorePatterns: [
    // Something not compiling correctly with puppeteer
    '/node_modules/puppeteer/.+\\.js$',
  ],
};
