import * as React from 'react';
import { hasContext } from './api/withContext';

export default function Page({ hasContext }) {
  return hasContext ? <div id="has-context" /> : null;
}

Page.getInitialProps = async (ctx) => {
  return {
    hasContext: await hasContext(ctx),
  };
};
