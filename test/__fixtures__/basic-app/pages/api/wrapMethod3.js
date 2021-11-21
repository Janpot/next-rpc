export const config = {
  rpc: true,
  wrapMethod: (method) => {
    return async (...args) => `wrapped result "${await method(...args)}"`;
  },
};

export async function echo(...params) {
  return `original called with ${params}`;
}
