# flatten-to-key-value

Flatten any JSON-like value into `{ "a.b.c": "value", ... }`.

- Objects become dot paths.
- Arrays of primitives aggregate into a single key and are joined (default `,`).
- Arrays of objects merge matching leaf paths across elements.
- Dates are serialized to ISO strings.
- Optional deduping, key sorting, delimiter and joiner customization.

## Install

```bash
npm i flatten-to-key-value
# or
pnpm add flatten-to-key-value
# or
yarn add flatten-to-key-value
```

## Usage

### ESM

```ts
import flattenToKeyValue from 'flatten-to-key-value';
// or: import { flattenToKeyValue } from 'flatten-to-key-value';

const input = {
  user: { id: 1, name: 'Ann' },
  tags: ['a', 'b', 'b'],
  purchases: [{ sku: 'X', qty: 1 }, { sku: 'Y', qty: 2 }, { sku: 'X', qty: 3 }],
};

const out = flattenToKeyValue(input, {
  dedupeArrayValues: true,
  sortKeys: true,
});

console.log(out);
/*
{
  "purchases.qty": "1,2,3",
  "purchases.sku": "X,Y",
  "tags": "a,b",
  "user.id": "1",
  "user.name": "Ann"
}
*/
```

### CommonJS

```js
const flattenToKeyValue = require('flatten-to-key-value').default;
// or: const { flattenToKeyValue } = require('flatten-to-key-value');

const out = flattenToKeyValue({ a: { b: [1, 2] } });
```

## API

```ts
type FlattenOptions = {
  delimiter?: string;             // default "."
  joiner?: string;                // default ","
  includeNullUndefined?: boolean; // default false (skips null/undefined)
  dedupeArrayValues?: boolean;    // default false
  sortKeys?: boolean;             // default false
};

function flattenToKeyValue(input: unknown, opts?: FlattenOptions): Record<string, string>;
```

### Notes

- Top-level primitives result in an empty object (no anonymous key).
- Circular references fall back to `String(v)` for non-serializable values.
- For arrays of primitives, each element is collected under the same key and joined at the end.
- For arrays of objects, leaf paths are merged across elements—use `dedupeArrayValues: true` to remove repeats.

## Development

```bash
pnpm i
pnpm test
pnpm build
```

## License

MIT
