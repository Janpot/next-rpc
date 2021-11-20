import { execa } from 'execa';
import * as fs from 'fs/promises';
import { Writable, Readable } from 'stream';
import * as path from 'path';
import getPort from 'get-port';

async function appReady(stdout: Readable): Promise<void> {
  return new Promise<void>((resolve) => {
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
  });
}

export async function buildNext(appPath: string) {
  await execa('next', ['build'], {
    preferLocal: true,
    cwd: appPath,
  });
}
export interface RunningNextApp {
  url: string;
  kill: (...args: any[]) => boolean;
}

export async function startNext(
  appPath: string,
  port?: number
): Promise<RunningNextApp> {
  port = port || (await getPort());
  const app = execa('next', ['start', '-p', String(port)], {
    preferLocal: true,
    cwd: appPath,
  });
  await appReady(app.stdout);
  return {
    url: `http://localhost:${port}/`,
    kill: app.kill.bind(app),
  };
}

export async function cleanup(appPath: string): Promise<void> {
  await fs.rm(path.resolve(appPath, './.next'), { recursive: true });
}
