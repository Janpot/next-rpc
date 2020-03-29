export const config = {
  rpc: true,
};

/* TEST "exporting a non-function"
export const constant = 1;
/**/

/* TEST "exporting a non-async function"
export function notAsync() {
  return 1;
}
/**/

/* TEST "exporting a non-async arrow function"
export const notAsyncArrow = () => 1;
/**/

/* TEST "exporting a non-async function expression"
export const notAsyncFunctionExpr = function () {
  return 1;
}
/**/


async function myFunction() {
  return 1;
}
export { myFunction };
/**/
