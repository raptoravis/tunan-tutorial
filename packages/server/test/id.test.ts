import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRoomId, newAdminToken, hashToken } from '../src/lib/id.ts';

test('U-8a newRoomId length === 8', () => {
  const id = newRoomId();
  assert.equal(id.length, 8);
});

test('U-8b newRoomId charset is base62', () => {
  const re = /^[0-9A-Za-z]{8}$/;
  for (let i = 0; i < 100; i++) {
    assert.match(newRoomId(), re);
  }
});

test('U-8c newRoomId no collisions in 1000', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 1000; i++) seen.add(newRoomId());
  assert.equal(seen.size, 1000);
});

test('U-9a hashToken differs from plain', () => {
  const t = newAdminToken();
  assert.notEqual(hashToken(t), t);
});

test('U-9b hashToken deterministic', () => {
  const t = 'fixed-input';
  assert.equal(hashToken(t), hashToken(t));
});

test('U-9c newAdminToken hex length 64 (32 bytes)', () => {
  const t = newAdminToken();
  assert.match(t, /^[0-9a-f]{64}$/);
});
