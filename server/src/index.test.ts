import { describe, it, expect } from 'vitest';
import { app } from './index.js';

describe('GET /api/health', () => {
  it('returns 200 + {ok:true}', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
