import * as React from 'react';
import { throws } from './api/rpc-route';

export default function Index(props) {
  const [error, setError] = React.useState();
  React.useEffect(() => {
    throws('the message', 'THE_CODE').catch(setError);
  }, []);
  return error ? (
    <div id="error">
      {error.message} : {error.code || 'NO_CODE'}
    </div>
  ) : null;
}
