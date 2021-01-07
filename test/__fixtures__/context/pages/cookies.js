import * as React from 'react';
import { getSomeCookie, setSomeCookie } from './api/withContext';

export default function Page({ hasContext }) {
  const [done, setDone] = React.useState(false);
  const [initial, setInitial] = React.useState(undefined);
  const [final, setFinal] = React.useState(undefined);
  React.useEffect(() => {
    (async () => {
      setInitial(await getSomeCookie('cookieName'));
      await setSomeCookie('cookieName', 'some cookie value');
      setFinal(await getSomeCookie('cookieName'));
      setDone(true);
    })();
  }, []);
  return (
    <div>
      <span id="initial-value">{initial}</span>
      {final ? <span id="final-value">{final}</span> : null}
    </div>
  );
}
