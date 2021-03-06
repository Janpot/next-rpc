import * as os from 'os';

export const config = { rpc: true };

export type HostInfo = {
  now: string;
  hostname: string;
};

export async function getInfo(): Promise<HostInfo> {
  return {
    now: new Date().toLocaleTimeString(),
    hostname: os.hostname(),
  };
}
