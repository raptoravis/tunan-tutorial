import { db } from './db.js';
import { generateId } from './ids.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface CreatePollInput {
  title: string;
  options: string[];
}

export function createPoll(input: CreatePollInput): { id: string } {
  const title = (input.title ?? '').trim();
  if (!title) throw new ValidationError('title 不能为空');
  if (title.length > 100) throw new ValidationError('title 超过 100 字符');

  const options = input.options ?? [];
  if (options.length < 2) throw new ValidationError('选项数不能少于 2');
  if (options.length > 20) throw new ValidationError('选项数不能超过 20');

  const seen = new Set<string>();
  for (const opt of options) {
    const t = (opt ?? '').trim();
    if (!t) throw new ValidationError('选项不能为空');
    if (t.length > 50) throw new ValidationError('选项超过 50 字符');
    if (seen.has(t)) throw new ValidationError('选项重复');
    seen.add(t);
  }

  const id = generateId();
  const now = Date.now();
  const insertPoll = db.prepare('INSERT INTO polls (id, title, created_at) VALUES (?, ?, ?)');
  const insertOption = db.prepare(
    'INSERT INTO options (id, poll_id, text, position) VALUES (?, ?, ?, ?)',
  );

  db.exec('BEGIN');
  try {
    insertPoll.run(id, title, now);
    options.forEach((text, i) => {
      insertOption.run(generateId(), id, text.trim(), i);
    });
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  return { id };
}
