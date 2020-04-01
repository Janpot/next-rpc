import { getContext } from 'next-rpc/context';

export const config = {
  rpc: true,
};

export async function hasContext(expected) {
  const got = getContext();
  return got && expected.req === got.req && expected.res === got.res;
}

export async function getUrl() {
  const { req } = getContext();
  return req.url;
}
