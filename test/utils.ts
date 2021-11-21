import { execa } from 'execa';
import * as fs from 'fs/promises';
import { Writable, Readable } from 'stream';
import * as path from 'path';
import getPort from 'get-port';
import { ChildProcess } from 'child_process';
import stripAnsi from 'strip-ansi';

const VERBOSE = true;
const FORCE_COLOR = true;

async function appReady(stdout: Readable): Promise<void> {
  return new Promise<void>((resolve) => {
    stdout.pipe(
      new Writable({
        write(chunk, encoding, callback) {
          if (/ready - started server on/i.test(stripAnsi(String(chunk)))) {
            resolve();
          }
          callback();
        },
      })
    );
  });
}

function redirectOutput(cp: ChildProcess) {
  if (VERBOSE) {
    process.stdin.pipe(cp.stdin);
    cp.stdout.pipe(process.stdout);
    cp.stderr.pipe(process.stderr);
  }
}

export async function buildNext(appPath: string) {
  const cp = execa('next', ['build'], {
    preferLocal: true,
    cwd: appPath,
    env: {
      FORCE_COLOR: VERBOSE ? '1' : '0',
    },
  });
  redirectOutput(cp);
  await cp;
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
    env: {
      FORCE_COLOR: FORCE_COLOR ? '1' : '0',
    },
  });
  redirectOutput(app);
  await appReady(app.stdout);
  return {
    url: `http://localhost:${port}/`,
    kill: app.kill.bind(app),
  };
}

export async function cleanup(appPath: string): Promise<void> {
  await fs.rm(path.resolve(appPath, './.next'), { recursive: true });
}
