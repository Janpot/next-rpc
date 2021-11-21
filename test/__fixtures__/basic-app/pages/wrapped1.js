import * as React from 'react';
import { echo } from './api/wrapMethod1';

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
      <div id="ssr">{props.data}</div>
      {data ? <div id="browser">{data}</div> : null}
    </div>
  );
}
