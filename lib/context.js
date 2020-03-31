const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

export function getContext() {
  return asyncLocalStorage.getStore();
}

export function wrapApiHandler(handler) {
  return (req, res) => {
    const context = { req, res };
    return asyncLocalStorage.runSyncAndReturn(context, () => {
      return handler(req, res);
    });
  };
}

export function wrapGetProps(getProps) {
  return (context) => {
    return asyncLocalStorage.runSyncAndReturn(context, () => {
      return getProps(context);
    });
  };
}
