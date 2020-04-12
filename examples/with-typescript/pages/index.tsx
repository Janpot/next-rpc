import * as React from 'react';
import { GetServerSideProps } from 'next';
import { getNow } from './api/host';

interface Props {
  now: number;
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return {
    props: {
      now: await getNow(),
    },
  };
};

export default function Home(props: Props) {
  const [now, setNow] = React.useState(props.now);

  React.useEffect(() => {
    const interval = setInterval(() => getNow().then(setNow), 5000);
    return () => clearInterval(interval);
  }, []);

  return <div>It's now {new Date(now).toLocaleTimeString()}</div>;
}
