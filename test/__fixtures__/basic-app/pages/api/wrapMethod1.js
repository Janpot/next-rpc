function wrapMethod(method) {
  return async (...args) => `wrapped result "${await method(...args)}"`;
}

export const config = {
  rpc: true,
  wrapMethod,
};

export async function echo(...params) {
  return `original called with ${params}`;
}
