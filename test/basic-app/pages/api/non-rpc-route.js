// anything should still be allowed to be exported
export const someValue = 1;

// default exports should still be allowed
export default (req, res) => {
  res.send('hello');
}
