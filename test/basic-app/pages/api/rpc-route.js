export const config = {
  rpc: true
};

export async function echo (...params) {
  return params
}

export const throws = async function (message, code) {
  throw Object.assign(new Error(message), { code });
}
