export function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    *,*::before,*::after { box-sizing: border-box }
    html,body { margin:0; padding:0; font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color:#222; background:#fafafa }
    main { max-width: 560px; margin: 0 auto; padding: 1.25rem 1rem 4rem }
    h1 { font-size: 1.4rem; margin: .25rem 0 1rem }
    form { display: grid; gap: 1rem }
    label { display: grid; gap: .35rem; font-weight: 600 }
    input[type="text"], input[type="datetime-local"], textarea {
      font: inherit; padding: .55rem .65rem; border: 1px solid #ccc; border-radius: 8px;
      min-height: 44px; width: 100%;
    }
    textarea { min-height: 96px; resize: vertical }
    button {
      font: inherit; font-weight: 600; padding: .7rem 1rem; border: 0; border-radius: 8px;
      background: #2563eb; color: #fff; min-height: 44px; cursor: pointer;
    }
    button:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px }
    .options-list { display: grid; gap: .5rem; list-style: none; padding: 0; margin: 0 }
    .option { padding: .65rem .8rem; border: 1px solid #e5e7eb; background:#fff; border-radius: 8px }
    .meta { color:#666; font-size:.9rem }
    .err { color:#b91c1c }
  </style>
</head>
<body>
  <main>
    ${body}
  </main>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
