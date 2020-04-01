import { hasContext } from './withContext';
import { getContext } from 'next-rpc/context';

export default async function (req, res) {
  const ctx = getContext();
  res.json({
    apiHasContext: ctx.req === req && ctx.res === res,
    rpcHasContext: await hasContext({ req, res }),
  });
}
