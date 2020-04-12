const path = require('path');
const puppeteer = require('puppeteer');
const { promises: fs } = require('fs');
const { buildNext, startNext, cleanup } = require('./utils');
const { default: fetch } = require('node-fetch');

const FIXTURE_PATH = path.resolve(__dirname, './__fixtures__/typescript');

afterAll(() => cleanup(FIXTURE_PATH));

describe('typescript', () => {
  test('should build without errors', async () => {
    await buildNext(FIXTURE_PATH);
  }, 30000);
});
