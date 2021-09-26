const execa = require('execa');
const { promises: fs } = require('fs');
const { Writable, Readable } = require('stream');
const path = require('path');
const getPort = require('get-port');

/**
 * @param {Readable} stdout
 * @returns Promise<void>
 */
async function appReady(stdout) {
  return /** @type {Promise<void>} */ (
    new Promise((resolve) => {
      stdout.pipe(
        new Writable({
          write(chunk, encoding, callback) {
            if (/ready - started server on/i.test(String(chunk))) {
              resolve();
            }
            callback();
          },
        })
      );
    })
  );
}

/**
 * @param {string} appPath
 * @returns Promise<void>
 */
async function buildNext(appPath) {
  await execa('next', ['build'], {
    preferLocal: true,
    cwd: appPath,
  });
}

/**
 * @typedef {{ url: string, kill: (...args: any[]) => boolean }} RunningNextApp
 */

/**
 * @param {string} appPath
 * @param {number=} port
 * @returns Promise<RunningNextApp>
 */
async function startNext(appPath, port) {
  port = port || (await getPort());
  const app = execa('next', ['start', '-p', String(port)], {
    preferLocal: true,
    cwd: appPath,
  });
  await appReady(/** @type {Readable} */ (app.stdout));
  return {
    url: `http://localhost:${port}/`,
    kill: app.kill.bind(app),
  };
}

/**
 * @param {string} appPath
 * @returns Promise<void>
 */
async function cleanup(appPath) {
  await fs.rmdir(path.resolve(appPath, './.next'), { recursive: true });
}

module.exports = {
  buildNext,
  startNext,
  cleanup,
};
