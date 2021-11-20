import path from 'path';
import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import { buildNext, startNext, cleanup, RunningNextApp } from './utils';
import fetch from 'node-fetch';
import { Browser } from 'puppeteer';

const PUPPETEER_OPTIONS =
  process.arch === 'arm64'
    ? {
        executablePath:
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      }
    : undefined;

const FIXTURE_PATH = path.resolve(__dirname, './__fixtures__/basic-app');

async function withEnabledTest(
  filepath: string,
  test: string,
  assertions: () => Promise<void>
): Promise<void> {
  const content = await fs.readFile(filepath, { encoding: 'utf-8' });
  const newContent = content.replace(`/* TEST "${test}"`, '');
  try {
    await fs.writeFile(filepath, newContent, { encoding: 'utf-8' });
    await assertions();
  } finally {
    await fs.writeFile(filepath, content, { encoding: 'utf-8' });
  }
}

afterAll(() => cleanup(FIXTURE_PATH));

describe('basic-app', () => {
  let browser: Browser;
  let app: RunningNextApp;

  beforeAll(async () => {
    await Promise.all([
      buildNext(FIXTURE_PATH),
      puppeteer.launch(PUPPETEER_OPTIONS).then((b) => (browser = b)),
    ]);
    app = await startNext(FIXTURE_PATH);
  }, 30000);

  afterAll(async () => {
    await Promise.all([browser && browser.close(), app && app.kill()]);
  });

  test('should call the rpc method everywhere', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(new URL('/', app.url).toString());
      const ssrData = await page.$eval('#ssr', (el) => el.textContent);
      expect(ssrData).toBe('foo bar');
      await page.waitForSelector('#browser');
      const browserData = await page.$eval('#browser', (el) => el.textContent);
      expect(browserData).toBe('baz quux');
    } finally {
      await page.close();
    }
  });

  test('should reject on errors', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(new URL('/throws', app.url).toString());
      await page.waitForSelector('#error');
      const error = await page.$eval('#error', (el) => el.textContent);
      // avoid leaking error internals, don't forward the code
      expect(error).toBe('the message : NO_CODE');
    } finally {
      await page.close();
    }
  });

  test('should handle when non-errors are thrown', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(new URL('/throws-non-error', app.url).toString());
      await page.waitForSelector('#error');
      const error = await page.$eval('#error', (el) => el.textContent);
      // avoid leaking error internals, don't forward the code
      expect(error).toBe(
        'Invalid value thrown in "throwsNonError", must be instance of Error : NO_CODE'
      );
    } finally {
      await page.close();
    }
  });

  test('should pass all allowed syntaxes', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(new URL('/syntax', app.url).toString());
      await page.waitForSelector('#results');
      const browserData = await page.$eval('#results', (el) => el.textContent);
      expect(browserData).toBe('1 2 3 4 5 6');
    } finally {
      await page.close();
    }
  });

  test("shouldn't leak prototype methods", async () => {
    const response = await fetch(
      new URL('/api/rpc-route', app.url).toString(),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ method: 'toString', params: [] }),
      }
    );
    expect(response).toHaveProperty('status', 400);
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty(
      ['error', 'message'],
      expect.stringMatching('"toString" is not a function')
    );
  });

  test("shouldn't accept non-POST requests", async () => {
    const response = await fetch(
      new URL('/api/rpc-route', app.url).toString(),
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      }
    );
    expect(response).toHaveProperty('status', 405);
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty(
      ['error', 'message'],
      expect.stringMatching('method "GET" is not allowed')
    );
  });
});

describe('build', () => {
  test('should fail on non function export', async () => {
    await withEnabledTest(
      path.resolve(FIXTURE_PATH, './pages/api/disallowed-syntax.js'),
      'exporting a non-function',
      async () => {
        const build = buildNext(FIXTURE_PATH);
        await expect(build).rejects.toHaveProperty(
          'message',
          expect.stringMatching('rpc exports must be static functions')
        );
      }
    );
  }, 30000);

  test('should fail on non-async function export', async () => {
    await withEnabledTest(
      path.resolve(FIXTURE_PATH, './pages/api/disallowed-syntax.js'),
      'exporting a non-async function',
      async () => {
        const build = buildNext(FIXTURE_PATH);
        await expect(build).rejects.toHaveProperty(
          'message',
          expect.stringMatching('rpc exports must be declared "async"')
        );
      }
    );
  }, 30000);

  test('should fail on non-async arrow function export', async () => {
    await withEnabledTest(
      path.resolve(FIXTURE_PATH, './pages/api/disallowed-syntax.js'),
      'exporting a non-async arrow function',
      async () => {
        const build = buildNext(FIXTURE_PATH);
        await expect(build).rejects.toHaveProperty(
          'message',
          expect.stringMatching('rpc exports must be declared "async"')
        );
      }
    );
  }, 30000);

  test('should fail on non-async function expression export', async () => {
    await withEnabledTest(
      path.resolve(FIXTURE_PATH, './pages/api/disallowed-syntax.js'),
      'exporting a non-async function expression',
      async () => {
        const build = buildNext(FIXTURE_PATH);
        await expect(build).rejects.toHaveProperty(
          'message',
          expect.stringMatching('rpc exports must be declared "async"')
        );
      }
    );
  }, 30000);

  test('should fail on non-static function export', async () => {
    await withEnabledTest(
      path.resolve(FIXTURE_PATH, './pages/api/disallowed-syntax.js'),
      'exporting a non-static function',
      async () => {
        const build = buildNext(FIXTURE_PATH);
        await expect(build).rejects.toHaveProperty(
          'message',
          expect.stringMatching('rpc exports must be static functions')
        );
      }
    );
  }, 30000);
});
