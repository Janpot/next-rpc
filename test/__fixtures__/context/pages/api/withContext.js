import { getContext } from 'next-rpc/context';

export const config = {
  rpc: true,
};

export async function hasContext(expected) {
  const got = getContext();
  if (expected) {
    return got && expected.req === got.req && expected.res === got.res;
  } else {
    return !!(got && got.req && got.res);
  }
}

export async function getUrl() {
  const { req } = getContext();
  return req.url;
}

export async function setSomeCookie(name, value) {
  const { req, res } = getContext();
  res.setHeader('set-cookie', `${name}=${value}; path=/`);
}

export async function getSomeCookie(name) {
  const { req } = getContext();
  const cookieHeader = req.headers.cookie || '';
  const cookies = new Map(
    cookieHeader.split(';').map((c) => c.trim().split('='))
  );
  return cookies.get(name);
}
