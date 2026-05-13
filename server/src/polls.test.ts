import { describe, it, expect, beforeEach } from 'vitest';
import { createPoll, ValidationError } from './polls.js';
import { db } from './db.js';
import { initSchema } from './schema.js';

beforeEach(() => {
  db.exec('DROP TABLE IF EXISTS votes; DROP TABLE IF EXISTS options; DROP TABLE IF EXISTS polls;');
  initSchema(db);
});

describe('createPoll', () => {
  it('inserts poll + options and returns 8-char id', () => {
    const { id } = createPoll({ title: '中午吃啥', options: ['麻辣烫', '盖饭', '沙县'] });
    expect(id).toMatch(/^[0-9A-Za-z]{8}$/);
    const poll = db.prepare('SELECT title FROM polls WHERE id=?').get(id) as { title: string };
    expect(poll.title).toBe('中午吃啥');
    const opts = db.prepare('SELECT text FROM options WHERE poll_id=? ORDER BY position').all(id) as Array<{ text: string }>;
    expect(opts.map((o) => o.text)).toEqual(['麻辣烫', '盖饭', '沙县']);
  });

  it('rejects empty title', () => {
    expect(() => createPoll({ title: '', options: ['a', 'b'] })).toThrow(ValidationError);
  });

  it('rejects title > 100', () => {
    expect(() => createPoll({ title: 'x'.repeat(101), options: ['a', 'b'] })).toThrow(ValidationError);
  });

  it('rejects < 2 options', () => {
    expect(() => createPoll({ title: 't', options: ['a'] })).toThrow(ValidationError);
  });

  it('rejects > 20 options', () => {
    const opts = Array.from({ length: 21 }, (_, i) => `o${i}`);
    expect(() => createPoll({ title: 't', options: opts })).toThrow(ValidationError);
  });

  it('rejects empty option text', () => {
    expect(() => createPoll({ title: 't', options: ['a', ''] })).toThrow(ValidationError);
  });

  it('rejects option > 50 chars', () => {
    expect(() => createPoll({ title: 't', options: ['a', 'x'.repeat(51)] })).toThrow(ValidationError);
  });

  it('rejects duplicate options', () => {
    expect(() => createPoll({ title: 't', options: ['a', 'a', 'b'] })).toThrow(ValidationError);
  });
});
