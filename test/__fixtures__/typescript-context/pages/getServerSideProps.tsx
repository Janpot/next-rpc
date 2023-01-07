import * as React from 'react';
import { GetServerSideProps } from 'next';
import { hasContext } from './api/withContext';

interface HomeProps {
  hasContext: boolean;
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
  ctx
) => {
  return {
    props: {
      hasContext: await hasContext(ctx),
    },
  };
};

export default function Page({ hasContext }: HomeProps) {
  console.log(hasContext);
  return hasContext ? <div id="has-context" /> : null;
}
