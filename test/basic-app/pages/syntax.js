import { f1, f2, f3, f4 } from './api/rpc-syntax';

export default function Index(props) {
  const [results, setResults] = React.useState();
  React.useEffect(
    () => Promise.all([f1(), f2(), f3(), f4()]).then(setResults),
    []
  );
  return results ? <div id="results">{results.join(' ')}</div> : null;
}
