export type CreateRoomInput = {
  title: string;
  options: string[];
  allow_add: boolean;
};

export type ValidationError = {
  ok: false;
  field: 'title' | 'options' | 'allow_add' | 'body';
  message: string;
};

export type ValidationOk = {
  ok: true;
  value: {
    title: string;
    options: string[];
    allow_add: boolean;
  };
};

export const TITLE_MAX = 120;
export const OPTION_MAX = 80;

export function validateCreateRoom(raw: unknown): ValidationOk | ValidationError {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, field: 'body', message: 'body 必须是 JSON 对象' };
  }
  const r = raw as Record<string, unknown>;

  const title = typeof r.title === 'string' ? r.title.trim() : '';
  if (title.length === 0) {
    return { ok: false, field: 'title', message: '标题不能为空' };
  }
  if (title.length > TITLE_MAX) {
    return { ok: false, field: 'title', message: `标题超长（>${TITLE_MAX}）` };
  }

  if (!Array.isArray(r.options)) {
    return { ok: false, field: 'options', message: '候选项必须是数组' };
  }
  const trimmed = r.options
    .filter((o): o is string => typeof o === 'string')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  for (const o of trimmed) {
    if (o.length > OPTION_MAX) {
      return { ok: false, field: 'options', message: `候选项超长（>${OPTION_MAX}）` };
    }
  }
  const dedup: string[] = [];
  const seen = new Set<string>();
  for (const o of trimmed) {
    const k = o.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(o);
  }
  if (dedup.length < 2) {
    return { ok: false, field: 'options', message: '至少需要 2 个不重复的候选项' };
  }

  const allow_add = r.allow_add === true;

  return { ok: true, value: { title, options: dedup, allow_add } };
}
