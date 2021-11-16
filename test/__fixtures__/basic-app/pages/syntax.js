import * as React from 'react';
import { f1, f2, f3, f4, f5, f6, f7 } from './api/rpc-syntax';

export default function Index(props) {
  const [results, setResults] = React.useState();
  React.useEffect(
    () =>
      Promise.all([f1(), f2(), f3(), f4(), f5(), f6(), f7()]).then(setResults),
    []
  );
  return results ? <div id="results">{results.join(' ')}</div> : null;
}
