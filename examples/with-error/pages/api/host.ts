import * as os from 'os';
import { apiError } from 'next-rpc/error';

export const config = { rpc: true };

export type HostInfo = {
  now: string;
  hostname: string;
};

export async function getInfo(authorized: boolean): Promise<HostInfo> {
  if(!authorized) {
    return apiError(401, "Hey! You need to be authorized!", {
      requestedAt: new Date().toLocaleTimeString()
    });
  };

  return {
    now: new Date().toLocaleTimeString(),
    hostname: os.hostname(),
  };
}
