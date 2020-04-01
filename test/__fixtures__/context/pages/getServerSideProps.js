import { hasContext } from './api/withContext';

export async function getServerSideProps(ctx) {
  return {
    props: {
      hasContext: await hasContext(ctx),
    },
  };
}

export default function Page({ hasContext }) {
  return hasContext ? <div id="result">success</div> : null;
}
