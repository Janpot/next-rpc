import { hasContext } from './api/withContext';

export default function Page() {
  const [result, setResult] = React.useState(false);
  React.useEffect(() => {
    hasContext().then(setResult)
  })
  return result ? <div id="has-context" /> : null;
}
