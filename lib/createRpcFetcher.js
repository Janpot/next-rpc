/**
 * @typedef {(...params: any[]) => any} NextRpcCall
 * @param { string} url
 * @param { string} method
 * @returns {NextRpcCall}
 */
export default function createRpcCall(url, method) {
  return async (...params) => {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ method, params }),
      headers: {
        'content-type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Unexpected HTTP status ' + res.status);
    }

    const { result, error } = await res.json();
    if (error) {
      throw new Error(error.message);
    }
    return result;
  };
}
