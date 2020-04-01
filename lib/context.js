const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

export function getContext() {
  return asyncLocalStorage.getStore();
}

/**
 * @param {import('next').NextApiHandler} handler
 * @returns {import('next').NextApiHandler}
 */
export function wrapApiHandler(handler) {
  return (req, res) => {
    const context = { req, res };
    return asyncLocalStorage.runSyncAndReturn(context, () => {
      return handler(req, res);
    });
  };
}

/**
 * @typedef {import('next').GetServerSideProps} GetProps
 */

/**
 * @param {import('next').GetServerSideProps} getProps
 * @returns {import('next').GetServerSideProps}
 */
export function wrapGetServerSideProps(getProps) {
  return (context) => {
    return asyncLocalStorage.runSyncAndReturn(context, () => {
      return getProps(context);
    });
  };
}
