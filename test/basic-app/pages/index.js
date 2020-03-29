import { echo } from './api/rpc-route';

export async function getServerSideProps() {
  return {
    props: {
      data: await echo('foo', 'bar'),
    },
  };
}

export default function Index(props) {
  const [data, setData] = React.useState();
  React.useEffect(() => {
    echo('baz', 'quux').then(setData);
  }, []);
  return (
    <div>
      <div id="ssr">{props.data.join(' ')}</div>
      {data ? <div id="browser">{data.join(' ')}</div> : null}
    </div>
  );
}
