# next-rpc

`next-rpc` makes exported functions from API routes accessible in the browser. Just import your API function and call it anywhere you want.

## Example

Define your rpc route as follows:

```js
// /pages/api/countries.js
export const config = { rpc: true }; // enable rpc on this API route

// export a function that needs to be called from the server and the browser
export async function getName(code) {
  return db.query(`SELECT name FROM country WHERE code = ?`, code);
}
```

Now in your components you can just import `getName` and call it anywhere you want:

```jsx
// /pages/index.js
import { getName } from './api/countries';

export default function MyPage({ initialData }) {
  const [countryName, setCountryName] = React.useState(initialData);

  return (
    <button onClick={() => getName('BE').then(setCountryName)}>
      {countryName || 'click me'}
    </button>
  );
}
```

## Installation

Install the `next-rpc` module

```
npm install -S next-rpc
```

configure Next.js to use the module

```tsx
// ./next.config.js
const withRpc = require('next-rpc')();
module.exports = withRpc({
  // your next.js config goes here
});
```

## Why this library is needed

Next.js 9.3 introduced [`getServerSideProps` and `getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching). New ways of calling serverside code and transfer the data to the browser. a pattern emerged for sharing API routes serverside and browserside. In short the idea is to abstract the logic into an exported function for serverside code and expose the function to the browser through an API handler.

```js
// /pages/api/myApi.js
export async function getName(code) {
  return db.query(`SELECT name FROM country WHERE code = ?`, code);
}

export default async (req, res) => {
  res.send(await getName(req.query.code));
};
```

This pattern is great as it avoids hitting the network when used serverside. Unfortunately, to use it client side it still involves a lot of ceremony. i.e. a http request handler needs to be set up, `fetch` needs to be used in the browser, the input and output needs to be correctly encoded and decoded. Error handling needs to be set up to deal with network related errors. If you use typescript you need to find a way to propagate the types from API to fetch result. etc...

Wouldn't it be nice if all of that was automatically handled and all you'd need to do is import `getName` on the browserside, just like you do serverside? That's where `next-rpc` comes in. With a `next-rpc` enabled API route, all its exported functions automatically become available to the browser as well.

> **Note:** `next-rpc` is not meant as a full replacement for Next.js API routes. Some use cases are still better solved with classic API routes. For instance when you want to rely on the existing browser caching mechanisms.

## Rules and limitations

1. Rpc routes are **only allowed to export async functions**. They also need to be statically analyzable as such. Therefore only the following is allowed, either:

   ```js
   export async function fn1() {}

   export const fn2 = async () => {};
   ```

2. All inputs and outputs must be simple **JSON serializable values**.
3. a **default export is not allowed**. `next-rpc` will generate one.
4. **You must enable rpc routes** through the `config` export. It must be an exported object that has the `rpc: true` property.

## typescript

> Try [the example](https://github.com/Janpot/next-rpc/tree/master/examples/with-typescript) on [codesandbox](https://codesandbox.io/s/github/Janpot/next-rpc/tree/master/examples/with-typescript)

`next-rpc` works really nicely with typescript. There is no serialization layer so functions just retain their type sigantures both on server and client.

## swr

> Try [the example](https://github.com/Janpot/next-rpc/tree/master/examples/with-swr) on [codesandbox](https://codesandbox.io/s/github/Janpot/next-rpc/tree/master/examples/with-swr)

`next-rpc` can work seamlessly with [`swr`](https://swr.vercel.app/).

```ts
// ./pages/api/projects.js
export const config = { rpc: true };

export async function getMovies(genre) {
  return db.query(`...`);
}

// ./pages/index.jsx
import useSwr from 'swr';
import { getMovies } from './api/movies';
import MoviesList from '../components/MoviesList';

const callFn = (method, ...params) => method(...params);

export default function Comedies() {
  const { data, error } = useSwr([getMovies, 'comedy'], callFn);
  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;
  return <MoviesList items={data} />;
}
```

## react-query

> Try [the example](https://github.com/Janpot/next-rpc/tree/master/examples/with-react-query) on [codesandbox](https://codesandbox.io/s/github/Janpot/next-rpc/tree/master/examples/with-react-query)

`next-rpc` can also work with [`react-query`](https://react-query.tanstack.com/).

```ts
// ./pages/api/projects.js
export const config = { rpc: true };

export async function getMovies(genre) {
  return db.query(`...`);
}

// ./pages/index.jsx
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { getMovies } from './api/movies';
import MoviesList from '../components/MoviesList';

function App() {
  const queryClient = React.useMemo(() => new QueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <Movies genre="comedy" />
    </QueryClientProvider>
  );
}

export default function Movies({ genre = 'comedy' }) {
  const { isLoading, error, data } = useQuery(['getMovies', genre], () =>
    getMovies(genre)
  );
  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  return <MoviesList items={data} />;
}
```

## next request context

> **warning:** This feature makes use of [experimental node.js APIs](https://nodejs.org/api/async_hooks.html#async_hooks_class_asynclocalstorage). Running node.js > v12.17/v13.10 is required to use the following feature.

This library completely hides the network layer. This makes it elegant to use, but also imposes limitations. To efficiently be able to implement things like cookie authentication, access to the underlying requests is required. To enable that, this library introduces `next-rpc/context`. An example:

```js
// ./pages/api/myRpc.js
import { getContext } from 'next-rpc/context';

const config = { rpc: true };

export async function currentUser() {
  const { req } = getContext();
  return getUserFromRequest(req);
}
```

The `req` variable in the previous example will contain the `IncomingMessage` that lead to the call of `currentUser()`. That means it will receive `req` from either:

- `NextPageContext`: if it traces back to `getServerSideProps` or `getInitialProps`.
- `NextApiHandler`: if it traces back to a call in another API handler, or if it was called from the browser.

`next-rpc` intercepts all instances of `getInitialProps`, `getServerSideProps` and api handlers and injects its context provider in there. From there on, every function invocation that descends from that point will be able to access the context through `getContext`. Since this feature relies on experimental APIs, it needs to be explicitly enabled by configuring the `experimentalContext` flag in `next.config.js`:

```js
// ./next.config.js
const withRpc = require('next-rpc')({
  experimentalContext: true,
});
module.exports = withRpc();
```

## How it works

`next-rpc` compiles api routes. If it finds `rpc` enabled it will rewrite the module. In serverside bundles, it will generate an API handler that encapsulates all exported functions. For browserside bundles, it will replace each exported function with a function that uses `fetch` to call this API handler.

It's important to note that `next-rpc` intends to be fully backwards compatible. If you don't specify the `rpc` option, the API route will behave as it does by default in Next.js.

## Roadmap

- **Improve dev experience:** warn when using unserializable input/output
- **Custom contexts:** it should be possible to build on the context feature to provide a custom context. e.g. `UserContext`.

## Contributing

Bug fixing PRs are welcome, provided they are of high quality and accompagnied by tests. Don't open PRs for feature requests prior to my approval.
