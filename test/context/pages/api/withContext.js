import { getContext } from 'next-rpc/context';

export const config = {
  rpc: true,
};

export async function getUrl() {
  const { req } = getContext();
  return req.url;
}
