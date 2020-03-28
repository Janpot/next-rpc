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
  await execa('next', ['build'], {
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
    kill: (...args) => app.kill(...args)
  };
}

describe('basic-app', () => {
  let browser

  beforeAll(async () => {
    await buildNext(path.resolve(__dirname, '../'));
    browser = await puppeteer.launch()
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
      await page.goto('http://localhost:3000/');
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
  }, 30000)
})
