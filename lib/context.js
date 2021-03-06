const { AsyncLocalStorage } = require('async_hooks');

const DEFAULT_CONTEXT = {};

const asyncLocalStorage = new AsyncLocalStorage();

function getContext() {
  return asyncLocalStorage.getStore() || DEFAULT_CONTEXT;
}

/**
 * @param {import('next').NextApiHandler} handler
 * @returns {import('next').NextApiHandler}
 */
function wrapApiHandler(handler) {
  return (req, res) => {
    const context = { req, res };
    return asyncLocalStorage.run(context, () => handler(req, res));
  };
}

/**
 * @typedef {import('next').GetServerSideProps} GetProps
 */

/**
 * @param {import('next').GetServerSideProps} getServerSideProps
 * @returns {import('next').GetServerSideProps}
 */
function wrapGetServerSideProps(getServerSideProps) {
  return (context) =>
    asyncLocalStorage.run(context, () => getServerSideProps(context));
}

/**
 * @template IP
 * @typedef {(context: import('next').NextPageContext) => IP | Promise<IP>} GetInitialProps
 */

/**
 * @template IP
 * @param {GetInitialProps<IP>} getInitialProps
 * @returns {GetInitialProps<IP>}
 */
function wrapGetInitialProps(getInitialProps) {
  return (context) =>
    asyncLocalStorage.run(context, () => getInitialProps(context));
}

/**
 * @template P
 * @template IP
 * @param {import('next').NextPage<P, IP>} Page
 * @returns {import('next').NextPage<P, IP>}
 */
function wrapPage(Page) {
  if (typeof Page.getInitialProps === 'function') {
    Page.getInitialProps = wrapGetInitialProps(Page.getInitialProps);
  }
  return new Proxy(Page, {
    set(target, property, value) {
      if (property === 'getInitialProps' && typeof value === 'function') {
        return Reflect.set(target, property, wrapGetInitialProps(value));
      }
      return Reflect.set(target, property, value);
    },
  });
}

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.getContext = getContext;
exports.wrapApiHandler = wrapApiHandler;
exports.wrapGetServerSideProps = wrapGetServerSideProps;
exports.wrapGetInitialProps = wrapGetInitialProps;
exports.wrapPage = wrapPage;
