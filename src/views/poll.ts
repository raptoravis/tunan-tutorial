import { layout, escapeHtml } from './layout.js';

export interface PollViewData {
  id: string;
  question: string;
  deadlineMs: number;
  options: Array<{ id: string; label: string }>;
  adminToken?: string;
  mySelectedOptionId?: string;
  closed?: boolean;
}

export function renderPollPage(p: PollViewData): string {
  const deadline = new Date(p.deadlineMs);
  const isAdmin = !!p.adminToken;
  const closed = !!p.closed;
  const adminBanner = isAdmin
    ? `<div class="meta" style="background:#fef3c7;padding:.5rem .75rem;border-radius:8px;display:flex;flex-direction:column;gap:.5rem">
        <span>🔑 这是管理链接，请勿分享。参与链接：<a href="/v/${escapeHtml(p.id)}">/v/${escapeHtml(p.id)}</a></span>
        ${closed ? '' : `<button type="button" id="close-poll-btn" data-token="${escapeHtml(p.adminToken!)}" data-poll-id="${escapeHtml(p.id)}" style="align-self:flex-start;background:#dc2626;color:#fff;border:0;padding:.5rem .75rem;border-radius:6px;min-height:36px;cursor:pointer">提前关闭投票</button>`}
      </div>`
    : '';
  const statusBanner = closed
    ? `<p class="meta" style="background:#fee2e2;padding:.5rem .75rem;border-radius:8px">⛔ 投票已结束（只读）</p>`
    : '';
  const optionsHtml = p.options
    .map((o) => {
      const selected = p.mySelectedOptionId === o.id;
      const ariaPressed = selected ? 'true' : 'false';
      const tag = selected ? '<span class="badge" aria-hidden="true">已选</span>' : '';
      if (closed) {
        return `<li class="option ${selected ? 'option--selected' : ''}" aria-current="${ariaPressed}">
          <span class="option-label">${escapeHtml(o.label)}</span>${tag}
        </li>`;
      }
      return `<li class="option">
        <form method="post" action="/api/polls/${escapeHtml(p.id)}/vote" class="vote-form" data-option-id="${escapeHtml(o.id)}">
          <button type="submit" name="optionId" value="${escapeHtml(o.id)}" aria-pressed="${ariaPressed}" class="option-btn ${selected ? 'option-btn--selected' : ''}">
            <span class="option-label">${escapeHtml(o.label)}</span>${tag}
          </button>
        </form>
      </li>`;
    })
    .join('');
  return layout(
    p.question,
    `
    <h1>${escapeHtml(p.question)}</h1>
    ${adminBanner}
    ${statusBanner}
    <p class="meta">截止：<time datetime="${deadline.toISOString()}">${escapeHtml(deadline.toLocaleString('zh-CN'))}</time></p>
    <ul class="options-list" id="options-list" aria-label="候选项">${optionsHtml}</ul>

    <section aria-label="结果" style="margin-top:1.5rem">
      <h2 style="font-size:1.05rem;margin:.25rem 0 .5rem">当前结果 <span id="total-voters" class="meta">（0 人已投）</span></h2>
      <ul id="results-list" class="results-list" aria-live="polite">
        ${p.options.map((o) => `<li class="result-row" data-option-id="${escapeHtml(o.id)}">
          <span class="result-label">${escapeHtml(o.label)}</span>
          <span class="result-bar"><span class="result-bar-fill" style="width:0%"></span></span>
          <span class="result-count">0 票 (0%)</span>
        </li>`).join('')}
      </ul>
    </section>
    <style>
      .option { padding: 0; background: transparent; border: 0; list-style: none }
      .option-btn {
        display: flex; align-items: center; justify-content: space-between;
        width: 100%; min-height: 56px; padding: .75rem 1rem;
        background: #fff; color: #222; border: 1px solid #e5e7eb; border-radius: 8px;
        font: inherit; cursor: pointer; text-align: left;
      }
      .option-btn:hover { border-color: #93c5fd }
      .option-btn--selected { border-color: #2563eb; background: #eff6ff }
      .option-btn:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px }
      .badge { font-size: .8rem; color: #2563eb; font-weight: 700 }
      .vote-form { margin: 0 }
      .results-list { list-style: none; padding: 0; margin: 0; display: grid; gap: .5rem }
      .result-row { display: grid; grid-template-columns: 1fr auto; gap: .25rem .75rem; align-items: center }
      .result-label { font-weight: 600 }
      .result-count { color: #666; font-size: .9rem; white-space: nowrap }
      .result-bar { grid-column: 1 / -1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden }
      .result-bar-fill { display: block; height: 100%; background: #2563eb; transition: width .3s ease }
    </style>
    <script>
      document.querySelectorAll('.vote-form').forEach((f) => {
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          const optionId = f.dataset.optionId;
          const r = await fetch(f.action, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ optionId }),
          });
          if (r.ok) location.reload();
        });
      });

      const POLL_ID = ${JSON.stringify(p.id)};
      const POLL_CLOSED = ${closed ? 'true' : 'false'};
      let pollTimer = null;
      async function refreshResults() {
        try {
          const r = await fetch('/api/polls/' + POLL_ID + '/results', { credentials: 'same-origin' });
          if (!r.ok) return;
          const data = await r.json();
          document.getElementById('total-voters').textContent = '（' + data.totalVoters + ' 人已投）';
          for (const opt of data.options) {
            const row = document.querySelector('.result-row[data-option-id="' + opt.id + '"]');
            if (!row) continue;
            row.querySelector('.result-count').textContent = opt.count + ' 票 (' + opt.percent + '%)';
            row.querySelector('.result-bar-fill').style.width = opt.percent + '%';
          }
          if (data.closed && pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        } catch (e) { /* swallow */ }
      }
      refreshResults();
      if (!POLL_CLOSED) pollTimer = setInterval(refreshResults, 5000);

      const closeBtn = document.getElementById('close-poll-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', async () => {
          if (!confirm('提前关闭后将无法再投票，确认？')) return;
          const token = closeBtn.dataset.token;
          const id = closeBtn.dataset.pollId;
          const r = await fetch('/api/polls/' + id + '/close?token=' + encodeURIComponent(token), {
            method: 'POST', credentials: 'same-origin',
          });
          if (r.ok) location.reload();
        });
      }
    </script>
    `,
  );
}
