import { NextRpcConfig, WrapMethod } from '../../../../..';

const wrapMethod: WrapMethod = (method, meta) => {
  return async (...args) => {
    console.log(`calling "${meta.name}" on "${meta.pathname}" with ${args}`);
    const result = await method(...args);
    console.log(`result: ${result}`);
    return result;
  };
};

export const config: NextRpcConfig = {
  rpc: true,
  wrapMethod,
};
