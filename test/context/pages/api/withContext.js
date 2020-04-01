import { getContext } from 'next-rpc/context';

export const config = {
  rpc: true,
};

export async function hasContext() {
  const { req, res } = getContext();
  return !!(req && res);
}
