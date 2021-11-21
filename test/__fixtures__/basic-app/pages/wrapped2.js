import * as React from 'react';
import { echo } from './api/wrapMethod2';

export async function getServerSideProps() {
  return {
    props: {
      data: await echo('bar', 'foo'),
    },
  };
}

export default function Index(props) {
  const [data, setData] = React.useState();
  React.useEffect(() => {
    echo('quux', 'baz').then(setData);
  }, []);
  return (
    <div>
      <div id="ssr">{props.data}</div>
      {data ? <div id="browser">{data}</div> : null}
    </div>
  );
}
