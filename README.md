# next-rpc

Call your API functions straight from the browser.

**Example:**

```js
// ./pages/api/myApi.js
export const config = { rpc: true };

export async function capitalize (str) {
  return str[0].upperCase() + str.slice(1);
}

// ./pages/index.js
import { capitalize } from './api/myApi';

export function getServerSideProps () {
  return {
    props: {
      // call your API functions serverside
      firstName: await capitalize('john')
    }
  };
}

export default function Index ({ firstName }) {
  const [lastName, setLastName] =  React.useState();
  // And also call your API functions browserside!
  React.useEffect(() => capitalize('doe').then(setLastName));
  return (
    <div>
      Hi I'm {firstName, lastName}
    </div>
  );
}
```

## Installation

Install the `next-rpc` module

```
npm install -S next-rpc
```

configure next.js to use the module


```js
// ./next.config.js
const withRpc = require('next-rpc')
module.exports = withRpc();
```

## Usage

RPC API modules are modules that only export functions. the functions can only accept and return JSON serializable values. To configure an API handler to work as an RPC module, just export a `config` object with a property `rpc: true`. Now you can import and call these methods from the browser as well.

```js
export const config = { rpc: true };

export async function capitalize (str) {
  return str[0].upperCase() + str.slice(1);
}
```
