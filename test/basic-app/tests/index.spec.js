const execa = require('execa');
const path = require('path');
const puppeteer = require('puppeteer');
const { Writable } = require('stream');
const { promises: fs } = require('fs');

const FIXTURE_PATH = path.resolve(__dirname, '../');

async function withEnabledTest(filepath, test, assertions) {
  const content = await fs.readFile(filepath, { encoding: 'utf-8' });
  const newContent = content.replace(`/* TEST "${test}"`, '');
  try {
    await fs.writeFile(filepath, newContent, { encoding: 'utf-8' });
    await assertions();
  } finally {
    await fs.writeFile(filepath, content, { encoding: 'utf-8' });
  }
}

async function appReady(stdout) {
  return new Promise((resolve) => {
    stdout.pipe(
      new Writable({
        write(chunk, encoding, callback) {
          if (/ready on/i.test(String(chunk))) {
            resolve();
          }
          callback();
        },
      })
    );
  });
}

async function buildNext(path) {
  return execa('next', ['build'], {
    preferLocal: true,
    cwd: path,
  });
}

async function startNext(path) {
  const app = execa('next', ['start'], {
    preferLocal: true,
    cwd: path,
  });
  await appReady(app.stdout);
  return {
    url: 'http://localhost:3000/',
    kill: (...args) => app.kill(...args),
  };
}

afterAll(async () => {
  await fs.rmdir(path.resolve(FIXTURE_PATH, './.next'), { recursive: true });
});

describe('basic-app', () => {
  /**
   * @type {import('puppeteer').Browser}
   */
  let browser;
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

  test('should call the rpc method everywhere', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(new URL('/', app.url));
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
      await page.goto(new URL('/throws', app.url));
      await page.waitForSelector('#error');
      const error = await page.$eval('#error', (el) => el.textContent);
      expect(error).toBe('the message : THE_CODE');
    } finally {
      await page.close();
    }
  });

  test('should pass all allowed syntaxes', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(new URL('/syntax', app.url));
      await page.waitForSelector('#results');
      const browserData = await page.$eval('#results', (el) => el.textContent);
      expect(browserData).toBe('1 2 3 4 5 6');
    } finally {
      await page.close();
    }
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
