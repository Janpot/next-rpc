const path = require('path');
const { buildNext, cleanup } = require('./utils');

const FIXTURE_PATH = path.resolve(__dirname, './__fixtures__/typescript');

afterAll(() => cleanup(FIXTURE_PATH));

describe('typescript', () => {
  test('should build without errors', async () => {
    await buildNext(FIXTURE_PATH);
  }, 30000);
});
