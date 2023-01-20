import * as React from 'react';
import { GetServerSideProps } from 'next';
import { getInfo, HostInfo } from './api/host';
import { RPCMethodError } from 'next-rpc/error';

export const getServerSideProps: GetServerSideProps<HostInfo> = async () => {
  return {
    // We can call the functions server-side
    props: await getInfo(true),
  };
};

export default function Home(props: any) {
  const [info, setInfo] = React.useState(props);
  const [error, setError] = React.useState({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      getInfo(true).then(res => setInfo(res));
      getInfo(false).catch((err: RPCMethodError) => setError(err));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Success:</h1>
      <pre>
        {JSON.stringify(info, null, 2)}
      </pre>
      <h1>Error:</h1>
      <pre>
        {JSON.stringify(error, null, 2)}
      </pre>
    </div>
  );
}
