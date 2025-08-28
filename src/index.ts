/**
 * MIT License
 * Copyright (c) 2025
 */

export type FlattenOptions = {
  /**
   * Path delimiter for object traversal (default ".")
   */
  delimiter?: string;
  /**
   * Joiner string used when merging multiple values under the same key (default ",")
   */
  joiner?: string;
  /**
   * If true, include `null` and `undefined` as string values ("null" / "undefined") (default false)
   */
  includeNullUndefined?: boolean;
  /**
   * If true, de-duplicate repeated values per key before joining (default false)
   */
  dedupeArrayValues?: boolean;
  /**
   * If true, sort resulting keys alphabetically (default false)
   */
  sortKeys?: boolean;
};

/**
 * Flattens any JSON-like value into { "a.b.c": "value", ... }.
 * - Objects become dot paths.
 * - Arrays of primitives are joined with `joiner`.
 * - Arrays of objects merge matching leaf paths across elements.
 * - Top-level primitives produce an empty object (no anonymous key).
 *
 * Design notes:
 *  - Aggregates multiple values for the same leaf key and joins at the end.
 *  - Dates become ISO strings via `.toISOString()`.
 *  - Non-primitive leftovers are JSON.stringified where possible; otherwise `String(v)`.
 */
export function flattenToKeyValue(
  input: unknown,
  opts: FlattenOptions = {}
): Record<string, string> {
  const delimiter = opts.delimiter ?? '.';
  const joiner = opts.joiner ?? ',';
  const includeNullUndefined = opts.includeNullUndefined ?? false;
  const dedupe = opts.dedupeArrayValues ?? false;

  // Accumulator keeps arrays of strings per key; we join at the end.
  const acc = new Map<string, string[]>();

  const add = (key: string, val: string) => {
    if (!key) return; // skip adding empty path
    const list = acc.get(key);
    if (list) {
      if (!dedupe || !list.includes(val)) list.push(val);
    } else {
      acc.set(key, [val]);
    }
  };

  const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

  const isPrimitive = (v: unknown) =>
    v === null ||
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    typeof v === 'bigint';

  const toStr = (v: unknown): string | undefined => {
    if (v === null || v === undefined) {
      return includeNullUndefined ? String(v) : undefined;
    }
    if (v instanceof Date) return v.toISOString();
    if (isPrimitive(v)) return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  const walk = (val: unknown, path: string) => {
    if (isPrimitive(val) || val instanceof Date) {
      const s = toStr(val);
      if (s !== undefined) add(path, s);
      return;
    }

    if (Array.isArray(val)) {
      // Arrays of primitives -> add each value to the same key
      if (val.every(isPrimitive)) {
        for (const item of val) {
          const s = toStr(item);
          if (s !== undefined) add(path, s);
        }
        return;
      }

      // Arrays of objects/mixed -> flatten each element under the SAME path.
      for (const item of val) {
        if (isPrimitive(item) || item instanceof Date) {
          const s = toStr(item);
          if (s !== undefined) add(path, s);
        } else if (Array.isArray(item)) {
          // Nested arrays: recurse with same path so leaves aggregate
          walk(item, path);
        } else if (isPlainObject(item)) {
          for (const [k, v] of Object.entries(item)) {
            const next = path ? `${path}${delimiter}${k}` : k;
            walk(v, next);
          }
        }
      }
      return;
    }

    if (isPlainObject(val)) {
      for (const [k, v] of Object.entries(val)) {
        const next = path ? `${path}${delimiter}${k}` : k;
        walk(v, next);
      }
      return;
    }

    // Fallback (functions, symbols, etc.) -> stringify if asked
    const s = toStr(val);
    if (s !== undefined) add(path, s);
  };

  walk(input, '');

  // Build the final object (joined values per key)
  const entries = Array.from(acc.entries()).map(([k, arr]) => [k, arr.join(joiner)]);
  if (opts.sortKeys) entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return Object.fromEntries(entries);
}

export default flattenToKeyValue;
