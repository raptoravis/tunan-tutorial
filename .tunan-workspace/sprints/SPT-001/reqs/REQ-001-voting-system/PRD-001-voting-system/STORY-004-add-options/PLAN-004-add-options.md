---
id: PLAN-004
title: 参与者追加候选项 — 实现计划
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-004
priority: P2
---

# PLAN-004 — 参与者追加候选项

源：[STORY-004](./STORY-004-add-options.md)

## Approach

- 新端点 `POST /api/rooms/:id/options` body `{ label: string }`
- 校验：房间存在、未关闭、`allow_add == true`、长度 1..80、去重（与 options 中 case-insensitive trim 后比较，且需未软删 OR 软删但 label 不冲突 — 软删项视作存在，避免重新添加被删项）
- 不要求 admin token；任意参与者即可（POST 时签发 / 解析 cookie 仅作日志，非鉴权）
- 实时可见依赖 STORY-003 的 results 轮询 + 同 room 的 GET 拉新 options
- 前端在 Room.tsx 中条件渲染追加表单（`room.allow_add && !closed`）

## Affected Files

修改：
```
- packages/server/src/routes/rooms.ts        — 新增 POST /api/rooms/:id/options
- packages/web/src/pages/Room.tsx            — 追加表单 + 状态刷新
- packages/web/src/lib/api.ts                — addOption 函数
- packages/web/src/styles.css                — .add-option 样式
```

新建：
```
- packages/server/test/options.test.ts       — 追加端点用例
```

## Steps

1. **server `routes/rooms.ts`**：
   - 加 `POST /api/rooms/:id/options`：校验 → 写 options 表 → 返回 `{ id, label }`
   - 校验顺序：room 404 → closed 410 → allow_add 403 → label 长度 400 → 去重 409
2. **server `test/options.test.ts`**：
   - allow_add=true 房间追加成功
   - allow_add=false → 403
   - 关闭房间 → 410
   - 重复（trim + lower 后等）→ 409
   - 超长 → 400
   - 房间不存在 → 404
3. **web `api.ts`**：`addOption(roomId, label)` 返回 `{ id, label }`
4. **web Room.tsx**：
   - 条件渲染追加输入框 + 提交按钮（`room.allow_add && !closed`）
   - 提交后调 `addOption`，成功后调 `fetchRoom` 刷新 options 列表
   - 错误展示在 `role="alert"`
5. **样式**：`.add-option` 行内 flex
6. **a11y**：输入有 `<label htmlFor>`；错误用 `role="alert"`

## Risks

- **R-1** 同名重复判断需大小写不敏感 + trim；测试覆盖 "麻辣烫" / " 麻辣烫 " / "麻辣烫"
- **R-2** 软删项与追加冲突：本期决定追加时也视已存在（不允许"复活"），避免管理 token 删除后被随意复活；测试覆盖

## Rollback

- 整 STORY 单 PR；revert 即可
- 无 DB 迁移

## 接下来做什么

1. ★ `/tunan-testplan PLAN-004`
