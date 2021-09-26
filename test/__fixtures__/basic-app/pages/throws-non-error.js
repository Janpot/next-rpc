import * as React from 'react';
import { throwsNonError } from './api/rpc-route';

export default function Index(props) {
  const [error, setError] = React.useState();
  React.useEffect(() => {
    throwsNonError('a string').catch(setError);
  }, []);
  return error ? (
    <div id="error">
      {error.message} : {error.code || 'NO_CODE'}
    </div>
  ) : null;
}
