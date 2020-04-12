import * as os from 'os';

export const config = { rpc: true };

export async function getNow(): Promise<number> {
  return Date.now();
}

export async function getHostname(): Promise<string> {
  return os.hostname();
}
