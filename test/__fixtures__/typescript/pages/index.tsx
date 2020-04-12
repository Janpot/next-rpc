import * as React from 'react';
import { GetServerSideProps } from 'next';
import { getInfo, HostInfo } from './api/host';

export const getServerSideProps: GetServerSideProps<HostInfo> = async () => {
  return {
    // We can call the functions server-side
    props: await getInfo(),
  };
};

export default function Home(props: HostInfo) {
  const [info, setInfo] = React.useState(props);

  React.useEffect(() => {
    // And we can call the functions client-side
    const interval = setInterval(() => getInfo().then(setInfo), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      It's now {info.now} on host {info.hostname}
    </div>
  );
}
