import { getUrl } from './api/withContext';

export function getServerSideProps() {
  return {
    props: {},
  };
}

export default function Page() {
  const [url, setUrl] = React.useState();
  return <button onClick={() => getUrl().then(setUrl)}>click {url}</button>;
}
