import { layout, escapeHtml } from './layout.js';

export interface PollViewData {
  id: string;
  question: string;
  deadlineMs: number;
  options: Array<{ id: string; label: string }>;
  adminToken?: string;
}

export function renderPollPage(p: PollViewData): string {
  const deadline = new Date(p.deadlineMs);
  const isAdmin = !!p.adminToken;
  const adminBanner = isAdmin
    ? `<p class="meta" style="background:#fef3c7;padding:.5rem .75rem;border-radius:8px">
        🔑 这是管理链接，请勿分享。参与链接：<a href="/v/${escapeHtml(p.id)}">/v/${escapeHtml(p.id)}</a>
      </p>`
    : '';
  return layout(
    p.question,
    `
    <h1>${escapeHtml(p.question)}</h1>
    ${adminBanner}
    <p class="meta">截止：<time datetime="${deadline.toISOString()}">${escapeHtml(deadline.toLocaleString('zh-CN'))}</time></p>
    <ul class="options-list" id="options-list" aria-label="候选项">
      ${p.options.map((o) => `<li class="option" data-option-id="${escapeHtml(o.id)}">${escapeHtml(o.label)}</li>`).join('')}
    </ul>
    <p class="meta">（投票交互将于 STORY-002 上线）</p>
    `,
  );
}
