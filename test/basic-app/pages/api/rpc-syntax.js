// all following ways of declaring an rpc function should be allowed

export const config = {
  rpc: true,
};

export async function f1() {
  return 1;
}

export const f2 = async function () {
  return 2;
};

export const f3 = async function f3() {
  return 3;
};

export const f4 = async () => 4;
