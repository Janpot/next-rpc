import App from 'next/app';
import { hasContext } from './api/withContext';

function MyApp({ Component, pageProps }) {
  return (
    <>
      {pageProps.appHasContext ? <div id="app-has-context" /> : null}
      <Component {...pageProps} />
    </>
  );
}

MyApp.getInitialProps = async (appContext) => {
  const { pageProps, ...appProps } = await App.getInitialProps(appContext);
  const appHasContext = await hasContext(appContext);
  return { ...appProps, pageProps: { ...pageProps, appHasContext } };
};

export default MyApp;
