import * as os from 'os';

export const config = { rpc: true };

// should be legal to export types
export type HostInfo = {
  now: string;
  hostname: string;
};

// should be legal to export interfaces
export interface SomeInterface {
  x: number;
}

export async function getInfo(): Promise<HostInfo> {
  return {
    now: new Date().toLocaleTimeString(),
    hostname: os.hostname(),
  };
}
