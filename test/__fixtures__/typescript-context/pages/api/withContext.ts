import { IncomingMessage, ServerResponse } from 'http';
import { getContext } from 'next-rpc/context';

export const config = {
  rpc: true,
};

interface Expected {
  req?: IncomingMessage;
  res?: ServerResponse;
}

export async function hasContext(expected?: Expected) {
  const got = getContext();
  if (expected) {
    return got && expected.req === got.req && expected.res === got.res;
  } else {
    return !!(got && got.req && got.res);
  }
}
