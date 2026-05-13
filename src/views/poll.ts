import { layout, escapeHtml } from './layout.js';

export interface PollViewData {
  id: string;
  question: string;
  deadlineMs: number;
  options: Array<{ id: string; label: string }>;
  adminToken?: string;
  mySelectedOptionId?: string;
  closed?: boolean;
  publicDetails?: boolean;
  myNickname?: string;
}

export function renderPollPage(p: PollViewData): string {
  const deadline = new Date(p.deadlineMs);
  const isAdmin = !!p.adminToken;
  const closed = !!p.closed;
  const publicDetails = !!p.publicDetails;
  const adminBanner = isAdmin
    ? `<div class="meta" style="background:#fef3c7;padding:.5rem .75rem;border-radius:8px;display:flex;flex-direction:column;gap:.5rem">
        <span>🔑 这是管理链接，请勿分享。参与链接：<a href="/v/${escapeHtml(p.id)}">/v/${escapeHtml(p.id)}</a></span>
        ${closed ? '' : `<button type="button" id="close-poll-btn" data-token="${escapeHtml(p.adminToken!)}" data-poll-id="${escapeHtml(p.id)}" style="align-self:flex-start;background:#dc2626;color:#fff;border:0;padding:.5rem .75rem;border-radius:6px;min-height:36px;cursor:pointer">提前关闭投票</button>`}
      </div>`
    : '';
  const statusBanner = closed
    ? `<p class="meta" style="background:#fee2e2;padding:.5rem .75rem;border-radius:8px">⛔ 投票已结束（只读）</p>`
    : '';
  const detailsBanner = publicDetails
    ? `<p class="meta">明细模式：每个选项下会显示投票人昵称</p>`
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

  const nicknameRow = closed
    ? ''
    : `<label class="nickname-row">
        昵称（选填，公开明细时显示）
        <input type="text" id="nickname-input" maxlength="20" value="${escapeHtml(p.myNickname ?? '')}" placeholder="例：小张">
      </label>`;

  const addOptionRow = closed
    ? ''
    : `<form id="add-option-form" class="add-option-row" aria-label="追加新候选项">
        <label style="flex:1;font-weight:400">
          <span class="visually-hidden">新候选项</span>
          <input type="text" name="label" required maxlength="100" placeholder="想到一个新选项？在这里补充">
        </label>
        <button type="submit">＋ 加</button>
      </form>`;

  const resultsHtml = p.options.map((o) => `<li class="result-row" data-option-id="${escapeHtml(o.id)}">
    <span class="result-label">${escapeHtml(o.label)}</span>
    <span class="result-bar"><span class="result-bar-fill" style="width:0%"></span></span>
    <span class="result-count">0 票 (0%)</span>
    ${publicDetails ? `<ul class="voter-list" aria-label="投票人"></ul>` : ''}
  </li>`).join('');

  return layout(
    p.question,
    `
    <h1>${escapeHtml(p.question)}</h1>
    ${adminBanner}
    ${statusBanner}
    ${detailsBanner}
    <p class="meta">截止：<time datetime="${deadline.toISOString()}">${escapeHtml(deadline.toLocaleString('zh-CN'))}</time></p>

    ${nicknameRow}

    <ul class="options-list" id="options-list" aria-label="候选项">${optionsHtml}</ul>

    ${addOptionRow}

    <section aria-label="结果" style="margin-top:1.5rem">
      <h2 style="font-size:1.05rem;margin:.25rem 0 .5rem">当前结果 <span id="total-voters" class="meta">（0 人已投）</span></h2>
      <ul id="results-list" class="results-list" aria-live="polite">${resultsHtml}</ul>
    </section>

    <style>
      .visually-hidden { position: absolute; width:1px; height:1px; overflow:hidden; clip: rect(0 0 0 0) }
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
      .nickname-row { font-weight: 400; display: grid; gap: .35rem; margin-bottom: .25rem }
      .add-option-row { display: flex; gap: .5rem; margin-top: .75rem }
      .add-option-row button { min-height: 44px; padding: .55rem .9rem; background: #f3f4f6; color:#222; border:1px solid #e5e7eb }
      .results-list { list-style: none; padding: 0; margin: 0; display: grid; gap: .65rem }
      .result-row { display: grid; grid-template-columns: 1fr auto; gap: .25rem .75rem; align-items: center }
      .result-label { font-weight: 600 }
      .result-count { color: #666; font-size: .9rem; white-space: nowrap }
      .result-bar { grid-column: 1 / -1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden }
      .result-bar-fill { display: block; height: 100%; background: #2563eb; transition: width .3s ease }
      .voter-list { grid-column: 1 / -1; list-style: none; padding: 0; margin: .15rem 0 0; display: flex; flex-wrap: wrap; gap: .35rem }
      .voter-chip { font-size: .75rem; background: #f1f5f9; color:#1e293b; padding: .15rem .45rem; border-radius: 999px }
    </style>
    <script>
      const POLL_ID = ${JSON.stringify(p.id)};
      const POLL_CLOSED = ${closed ? 'true' : 'false'};
      const PUBLIC_DETAILS = ${publicDetails ? 'true' : 'false'};

      function getNickname() {
        const i = document.getElementById('nickname-input');
        return i ? (i.value || '').trim() : '';
      }

      document.querySelectorAll('.vote-form').forEach((f) => {
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          const optionId = f.dataset.optionId;
          const r = await fetch(f.action, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ optionId, nickname: getNickname() || undefined }),
          });
          if (r.ok) location.reload();
        });
      });

      const addForm = document.getElementById('add-option-form');
      if (addForm) {
        addForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const label = addForm.querySelector('input[name="label"]').value.trim();
          if (!label) return;
          const r = await fetch('/api/polls/' + POLL_ID + '/options', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ label }),
          });
          if (r.ok) location.reload();
          else {
            const j = await r.json().catch(() => ({}));
            alert('添加失败：' + (j.error || r.status));
          }
        });
      }

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
            if (PUBLIC_DETAILS && data.voters) {
              const ul = row.querySelector('.voter-list');
              if (ul) {
                const chips = data.voters
                  .filter((v) => v.optionId === opt.id)
                  .map((v) => '<li class="voter-chip">' + (v.nickname || '匿名') + '</li>')
                  .join('');
                ul.innerHTML = chips;
              }
            }
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
