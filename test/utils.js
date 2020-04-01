const execa = require('execa');
const { promises: fs } = require('fs');
const { Writable } = require('stream');
const path = require('path');

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

async function buildNext(appPath) {
  return execa('next', ['build'], {
    preferLocal: true,
    cwd: appPath,
  });
}

async function startNext(appPath) {
  const app = execa('next', ['start'], {
    preferLocal: true,
    cwd: appPath,
  });
  await appReady(app.stdout);
  return {
    url: 'http://localhost:3000/',
    kill: (...args) => app.kill(...args),
  };
}

async function cleanup(appPath) {
  await fs.rmdir(path.resolve(appPath, './.next'), { recursive: true });
}

module.exports = {
  buildNext,
  startNext,
  cleanup,
};
