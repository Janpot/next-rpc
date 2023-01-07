import * as path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { buildNext, startNext, cleanup, RunningNextApp } from './utils';

const FIXTURE_PATH = path.resolve(
  __dirname,
  './__fixtures__/typescript-context'
);

afterAll(() => cleanup(FIXTURE_PATH));

describe('typescript-context', () => {
  let browser: Browser;
  let app: RunningNextApp;

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

  test('should provide context when called through getServerSidProps, function declaration', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(new URL('/getServerSideProps', app.url).toString());
      expect(await page.$('#has-context')).not.toBeNull();
    } finally {
      await page.close();
    }
  });
});
