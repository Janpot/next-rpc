import { getUrl } from './api/withContext';

export async function getServerSideProps() {
  return {
    props: {
      ssp: await getUrl(),
    },
  };
}

export default function Page({ ssp }) {
  const [url, setUrl] = React.useState();
  return (
    <div>
      {ssp}
      <button onClick={() => getUrl().then(setUrl)}>click {url}</button>
    </div>
  );
}
