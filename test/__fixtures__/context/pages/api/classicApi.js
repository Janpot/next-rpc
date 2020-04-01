import { getUrl } from './withContext';

export default async function (req, res) {
  res.json({
    url: await getUrl(),
  });
}
