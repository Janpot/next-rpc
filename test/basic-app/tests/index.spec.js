const execa = require('execa');
const path = require('path');
const puppeteer = require('puppeteer');
const { Writable } = require('stream');

async function appReady (stdout) {
  return new Promise(resolve => {
    stdout.pipe(new Writable({
      write(chunk, encoding, callback) {
        if (/ready on/i.test(String(chunk))) {
          resolve();
        }
        callback();
      }
    }));
  });
}

async function buildNext (path) {
  return execa('next', ['build'], {
    preferLocal: true,
    cwd: path
  });
}

async function startNext (path) {
  const app = execa('next', ['start'], {
    preferLocal: true,
    cwd: path
  });
  await appReady(app.stdout);
  return {
    url: 'http://localhost:3000/',
    kill: (...args) => app.kill(...args)
  };
}

describe('basic-app', () => {
  /**
   * @type {import('puppeteer').Browser}
   */
  let browser

  beforeAll(async () => {
    await Promise.all([
      buildNext(path.resolve(__dirname, '../')),
      puppeteer.launch().then(b => browser = b)
    ]);
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  })

  test('should call the rpc method everywhere', async () => {
    const app = await startNext(path.resolve(__dirname, '../'));
    const page = await browser.newPage()
    try {
      await page.goto(new URL('/', app.url));
      const ssrData = await page.$eval('#ssr', el => el.textContent);
      expect(ssrData).toBe('foo bar')
      await page.waitForSelector('#browser')
      const browserData = await page.$eval('#browser', el => el.textContent);
      expect(browserData).toBe('baz quux')
    } finally {
      await Promise.all([
        app.kill(),
        page.close()
      ]);
    }
  })

  test('should pass all allowed syntaxes', async () => {
    const app = await startNext(path.resolve(__dirname, '../'));
    const page = await browser.newPage()
    try {
      await page.goto(new URL('/syntax', app.url));
      await page.waitForSelector('#results')
      const browserData = await page.$eval('#results', el => el.textContent);
      expect(browserData).toBe('1 2 3 4')
    } finally {
      await Promise.all([
        app.kill(),
        page.close()
      ]);
    }
  })
})
