# next-rpc

> `next-rpc` makes exported functions from API routes accessible in the browser. Just import your API function and call it anywhere you want.

## Usage

Next.js 9.3 introduced [`getServerSideProps` and `getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching). New ways of calling serverside code and transfer the data to the browser. a pattern emerged for sharing API routes serverside and browserside. In short the idea is to abstract the logic into an exported function for serverside code and expose the function to the browser through an API handler.

```js
// ./pages/api/myApi.js
export async function getName(code) {
  return db.query(`SELECT name FROM country WHERE code = ?`, code);
}

export default async (req, res) => {
  res.send(await getName(req.query.code));
};
```

This pattern is great as it avoids hitting the network when used serverside. Unfortunaly, to use it client side it still involves a lot of ceremony. i.e. a http request handler needs to be set up, `fetch` needs to be used in the browser, the input and output needs to be correctly encoded and decoded. Error handling needs to be set up to deal with network related errors. If you use typescript you need to find a way to propagate teh types from API to fetch result. etc...

Wouldn't it be nice if all of that was automatically handled and all you'd need to do is import `getName` on the browserside, just like you do serverside? That's where `nect-rpc` comes in. With a `nect-rpc` enabled API route, all its exported functions automatically become available to the browser as well. The previous snippet now becomes:

```js
// ./pages/api/myApi.js

// use the config export to enable rpc on this API route
export const config = { rpc: true };

// this method can now be called serverside as well as in the browser
export async function getName(code) {
  return db.query(`SELECT name FROM country WHERE code = ?`, code);
}

// no need for a default export, next-rpc will set up a request handler
```

Now in your components you can just import `getName` and call it anywhere you want:

```jsx
// ./pages/index.js
import { getName } from './api/myApi';

export function getServerSideProps() {
  return {
    props: {
      // call your API functions serverside
      initialData: await getName('US'),
    },
  };
}

export default function Index({ initialData }) {
  const [countryName, setCountryName] = React.useState(initialData);
  // but also call your API function from a click handler
  const handleClick = async () => setCountryName(await getName('CA'));
  return (
    <div>
      <button onClick={handleClick}>countryName</button>
    </div>
  );
}
```

It's important to note that `next-rpc` intends to be fully backwards compatible. If you don't specify the `rpc` option, the API route will behave as it does by default in next.js.

## Installation

Install the `next-rpc` module

```
npm install -S next-rpc
```

configure next.js to use the module

```tsx
// ./next.config.js
const withRpc = require('next-rpc');
module.exports = withRpc({
  // your next.js config goes here
});
```

## Rules and limitations

1. Rpc routes are **only allowed to export async functions**. They also need to be statically analyzable as such. Therefore only the following is allowed, either:

   ```js
   export async function fn1() {}

   export const fn2 = async () => {};
   ```

2. All inputs and outputs must be simple **JSON serializable values**.
3. a **default export is not allowed**. `next-rpc` will generate one.
4. **You must enable rpc routes** through the `config` export. It must be an exported object that has the `rpc: true` property.

## When not to use rpc routes (yet)

- **You need to handle sensitive data.** Currently there is no way to authenticate rpc routes yet.
- **You need to fine grained control over the network layer.** You want to add certain caching logic in the network layer? Or you wnat strict control over how API handlers behave? Maybe you'd like to use existing node.js middleware? You can still use classic next.js API routes.

I'm looking into all the available options for implementing a middleware style solution. I have some ideas, but for now I intend to just keep it simple and get some mileage out of this library first.

## How it works

`next-rpc` compiles api routes. If it finds `rpc` enabled it will rewrite the module. If the compilation is for a serverside bundle, it will generate an API handler that encapsulates all exported functions. For browserside bundles, it will replace each exported function with a function that uses fetch to call this API handler.

## Roadmap

- **Improve dev experience**, warn when using unserializable input/output
- **Come up with a Middleware mechanism**, with the primary purpose of enabling authentication
