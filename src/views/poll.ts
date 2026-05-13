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
    ? `<p class="meta" style="background:#fef3c7;padding:.5rem .75rem;border-radius:8px">
        🔑 这是管理链接，请勿分享。参与链接：<a href="/v/${escapeHtml(p.id)}">/v/${escapeHtml(p.id)}</a>
      </p>`
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
    </script>
    `,
  );
}
