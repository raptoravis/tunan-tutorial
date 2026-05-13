---
id: PLAN-005
title: 房间管理 — 实现计划
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-005
priority: P2
---

# PLAN-005 — 房间管理

源：[STORY-005](./STORY-005-room-management.md)

## Approach

- 鉴权：admin_token 通过请求头 `X-Admin-Token` 传；服务端用 `hashToken()` 比对 `rooms.admin_hash`（常数时间 `crypto.timingSafeEqual`）
- 错误统一返回 403 + `{ error: '管理凭据无效' }`，不暴露 token 是否存在 / 是否过期
- `POST /api/rooms/:id/close` — 设 closed_at；幂等（已关闭再调返回 200，closed_at 不动）
- `DELETE /api/rooms/:id/options/:optionId` — 软删 options（写 deleted_at）+ DELETE 该 option 关联的所有 votes（硬删）
- Web 端：`/r/:id/admin` 新路由 — 表单粘 token + 「关闭房间」/ 「删除候选项」按钮组（每个 option 一行）

## Affected Files

新建：
```
- packages/server/src/routes/admin.ts          — close + delete-option 端点
- packages/server/src/lib/auth.ts              — verifyAdminToken（常数时间比较）
- packages/server/test/admin.test.ts           — 鉴权 + 关闭 + 删除用例
- packages/web/src/pages/Admin.tsx             — 管理面板
```

修改：
```
- packages/server/src/app.ts                   — 挂 admin 路由
- packages/web/src/main.tsx                    — 路由 /r/:id/admin
- packages/web/src/lib/api.ts                  — closeRoom / deleteOption
- packages/web/src/styles.css                  — .admin 样式
- packages/web/src/pages/Created.tsx           — "去管理面板" 链接
```

## Steps

1. **lib/auth.ts** `verifyAdminToken(provided: string, storedHash: string): boolean`：`timingSafeEqual(hashToken(provided), storedHash)` （等长 Buffer）
2. **routes/admin.ts**：
   - `POST /api/rooms/:id/close` — 读 X-Admin-Token → verify → 写 closed_at → 200 `{ closed_at }`
   - `DELETE /api/rooms/:id/options/:optionId` — verify → tx { UPDATE options SET deleted_at; DELETE votes WHERE option_id } → 200 `{ deleted: optionId }`
   - 缺 token / 错 token → 403
3. **server tests**：close × 4（成功 / 错 token / 不存在 room / 幂等），delete × 5（成功 / 错 token / option 不在本房间 / 已删除项 idempotent / 撤销该项的投票）
4. **web Admin.tsx**：表单输入 token + 操作按钮；fetch 全部带 `X-Admin-Token: <token>` 头
5. **route 挂载**：`<Route path="/r/:id/admin" element={<Admin />} />`
6. **Created.tsx**：成功页加 `<Link to=/r/{id}/admin>管理面板</Link>`

## Risks

- **R-1** `timingSafeEqual` 要求等长 Buffer；不等长时直接 false（不抛）
- **R-2** 删除 option 后该 option 的 votes 即刻消失，前端结果区会突然变小；这是预期；STORY-003 的轮询自然刷新

## Rollback

- 整 STORY 单 PR；revert 即可
- 关闭操作可通过 SQL `UPDATE rooms SET closed_at = NULL WHERE id = ?` 撤销（不暴露给用户）
- 删除候选项无原子撤销（已硬删 votes）；属于设计接受

## 接下来做什么

1. ★ `/tunan-testplan PLAN-005`
