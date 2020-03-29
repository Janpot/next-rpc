export const config = {
  rpc: true,
};

export async function echo(...params) {
  return params;
}

export async function throws(message, code) {
  throw Object.assign(new Error(message), { code });
}
