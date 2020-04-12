import * as React from 'react';
import { GetServerSideProps } from 'next';
import { getNow, getHostname } from './api/host';

interface Props {
  now: number;
  hostname: string;
}

async function getInfo() {
  const [now, hostname] = await Promise.all([getNow(), getHostname()]);
  return { now, hostname };
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return {
    // We can call the functions server-side
    props: await getInfo(),
  };
};

export default function Home(props: Props) {
  const [info, setInfo] = React.useState(props);

  React.useEffect(() => {
    // And we can call the functions client-side
    const interval = setInterval(() => getInfo().then(setInfo), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      It's now {new Date(info.now).toTimeString()} on host {info.hostname}
    </div>
  );
}
