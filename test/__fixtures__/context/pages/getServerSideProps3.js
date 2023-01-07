import * as React from 'react';
import { hasContext } from './api/withContext';

export const getServerSideProps = async (ctx) => {
  return {
    props: {
      hasContext: await hasContext(ctx),
    },
  };
};

export default function Page({ hasContext }) {
  return hasContext ? <div id="has-context" /> : null;
}
