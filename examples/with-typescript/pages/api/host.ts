export const config = { rpc: true };

export async function getNow(): Promise<number> {
  return Date.now();
}
