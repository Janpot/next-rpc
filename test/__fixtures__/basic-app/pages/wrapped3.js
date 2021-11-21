import * as React from 'react';
import { echo } from './api/wrapMethod3';

export async function getServerSideProps() {
  return {
    props: {
      data: await echo('quux', 'foo'),
    },
  };
}

export default function Index(props) {
  const [data, setData] = React.useState();
  React.useEffect(() => {
    echo('bar', 'baz').then(setData);
  }, []);
  return (
    <div>
      <div id="ssr">{props.data}</div>
      {data ? <div id="browser">{data}</div> : null}
    </div>
  );
}
