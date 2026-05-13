import { layout } from './layout.js';

export function renderCreatePage(): string {
  const minIso = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16);
  return layout(
    '创建投票',
    `
    <h1>创建投票</h1>
    <p class="meta">投票"中午吃啥 / 周末去哪玩"这类小决策。</p>
    <form id="create-form" method="post" action="/api/polls">
      <label>问题
        <input type="text" name="question" required minlength="1" maxlength="200" placeholder="例：中午吃啥？">
      </label>
      <label>候选项（2-10 个，每行一个）
        <textarea name="options" required placeholder="拉面&#10;盖饭&#10;..."></textarea>
      </label>
      <label>截止时间（最短 10 分钟、最长 30 天）
        <input type="datetime-local" name="deadline" required min="${minIso}">
      </label>
      <label style="flex-direction: row; display: flex; gap: .5rem; align-items: center; font-weight:400">
        <input type="checkbox" name="publicDetails">
        公开明细（结果中显示每人投了什么）
      </label>
      <button type="submit">创建投票</button>
      <p id="form-error" class="err" role="alert" aria-live="polite"></p>
    </form>
    <script>
      const form = document.getElementById('create-form');
      const err = document.getElementById('form-error');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        err.textContent = '';
        const fd = new FormData(form);
        const options = String(fd.get('options') || '')
          .split(/\\r?\\n/).map(s => s.trim()).filter(Boolean);
        const payload = {
          question: String(fd.get('question') || ''),
          options,
          deadline: new Date(String(fd.get('deadline'))).toISOString(),
          publicDetails: fd.get('publicDetails') === 'on',
        };
        const r = await fetch('/api/polls', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          err.textContent = '创建失败：' + (j.error || r.statusText);
          return;
        }
        const data = await r.json();
        location.href = data.adminUrl;
      });
    </script>
    `,
  );
}
