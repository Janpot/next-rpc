import { hasContext } from './api/withContext';

export async function getServerSideProps() {
  return {
    props: {
      hasContext: await hasContext(),
    },
  };
}

export default function Page({ hasContext }) {
  return hasContext ? 'success' : null;
}
