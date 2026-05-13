import { describe, it, expect } from 'vitest';
import { generateId } from './ids.js';

describe('generateId', () => {
  it('returns 8 base62 characters', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9A-Za-z]{8}$/);
  });

  it('does not collide across 100 calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) ids.add(generateId());
    expect(ids.size).toBe(100);
  });
});
