export type RPCMethodError<T = any> = {
  code: number;
  message: string;
  payload?: T;
};

export function apiError(code: number, message: string, payload: Object = {}): any {
  return {
    _rpcType: "error",
    code,
    message,
    payload
  };
};