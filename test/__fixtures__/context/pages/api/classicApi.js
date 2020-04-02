import { hasContext } from './withContext';
import { useContext } from 'next-rpc/context';

export default async function (req, res) {
  const ctx = useContext();
  res.json({
    apiHasContext: ctx.req === req && ctx.res === res,
    rpcHasContext: await hasContext({ req, res }),
  });
}
