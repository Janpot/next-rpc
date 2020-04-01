const path = require('path');
const puppeteer = require('puppeteer');
const { buildNext, startNext, cleanup } = require('./utils');
const { default: fetch } = require('node-fetch');

const FIXTURE_PATH = path.resolve(__dirname, './__fixtures__/context');

afterAll(() => cleanup(FIXTURE_PATH));

describe('basic-app', () => {
  /**
   * @type {import('puppeteer').Browser}
   */
  let browser;
  /**
   * @type {import('./utils').RunningNextApp}
   */
  let app;

  beforeAll(async () => {
    await Promise.all([
      buildNext(FIXTURE_PATH),
      puppeteer.launch().then((b) => (browser = b)),
    ]);
    app = await startNext(FIXTURE_PATH);
  }, 30000);

  afterAll(async () => {
    await Promise.all([browser && browser.close(), app && app.kill()]);
  });

  test('should call provide context when called through getServerSidProps', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(new URL('/getServerSideProps', app.url).toString());
      const ssrData = await page.$eval('#result', (el) => el.textContent);
      expect(ssrData).toBe('success');
    } finally {
      await page.close();
    }
  });

  test('should have context in api routes', async () => {
    const response = await fetch(
      new URL('/api/classicApi', app.url).toString()
    );
    expect(response).toHaveProperty('ok', true);
    const result = await response.json();
    expect(result).toHaveProperty('apiHasContext', true);
    expect(result).toHaveProperty('rpcHasContext', true);
  });
});
