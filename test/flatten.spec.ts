import { describe, it, expect } from 'vitest';
import flattenToKeyValue from '../src';

describe('flattenToKeyValue', () => {
  it('flattens nested objects', () => {
    const input = { a: { b: { c: 1 }, d: 'x' } };
    const out = flattenToKeyValue(input);
    expect(out).toEqual({ 'a.b.c': '1', 'a.d': 'x' });
  });
});
