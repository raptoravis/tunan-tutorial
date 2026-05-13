---
id: PLAN-003
title: 实时结果 — 实现计划
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-003
priority: P2
---

# PLAN-003 — 实时结果

源：[STORY-003](./STORY-003-realtime-results.md)

## Approach

**轮询方案**（PRD OQ-1 ★ 默认）：前端每 1.5s GET `/api/rooms/:id/results`，server 返回当前票数聚合。

- **为什么轮询**：50 人量级 + p95 < 2s 阈值用 1.5s 间隔即可达成；零额外协议复杂度；SSE/WS 留作未来 STORY
- **去 NaN**：0 票候选项前端 `(votes/total) || 0`；server 端直接 `0/0 → 0`
- **关闭态**：仍轮询（参与者要能看终值）；只是不提交新票（STORY-002 已实现）
- **a11y**：票数 ≥ 文字 + 条；条用 `aria-hidden`；屏幕阅读器读 `<X> 票，<Y>%`
- **否决备选**：
  - SSE：⛔ 增加 keepalive / proxy 兼容成本；本期无价值
  - WebSocket：⛔ 同上 + Hono 接入额外依赖
  - 仅页面加载时拉一次：⛔ 不满足 AC-1（≤2s 别人投票即可见）

## Affected Files

修改：

```
- packages/server/src/routes/votes.ts        — 新增 GET /api/rooms/:id/results 端点
- packages/web/src/pages/Room.tsx            — useEffect 轮询 + 渲染结果区
- packages/web/src/lib/api.ts                — 新增 fetchResults 类型 + 函数
- packages/web/src/styles.css                — .results / .bar 样式
```

新建：

```
- packages/server/test/results.test.ts       — GET results 用例
```

## Steps

1. **server `votes.ts` 新端点** `GET /api/rooms/:id/results`：
   - 房间存在校验（404）；不要求 cookie（公开可见）
   - SQL：`SELECT o.id, o.label, COUNT(v.id) AS votes FROM options o LEFT JOIN votes v ON v.option_id = o.id AND v.deleted_at IS NULL WHERE o.room_id = ? AND o.deleted_at IS NULL GROUP BY o.id ORDER BY o.id`
   - total 参与者：`SELECT COUNT(DISTINCT participant_token) AS n FROM votes WHERE room_id = ?`
   - 返回 `{ total_participants: number, options: [{id, label, votes}] }`
2. **server 测试**（`test/results.test.ts`）：
   - 空房间 → total=0、每项 votes=0
   - 投 1 票 → total=1、对应项 votes=1
   - 多参与者 + 多选 → total/votes 正确（投了 N 项算 N 次 vote 但 1 个 participant）
   - 已删除 option 不出现
   - 关闭房间结果仍可读
3. **web `api.ts`**：`fetchResults(roomId)` 返回 `Results`
4. **web `Room.tsx`**：
   - 进入页面后启动 `setInterval` 1500ms 拉 results；卸载清
   - 提交后立即拉一次（让自己当下就看到更新）
   - 渲染 `<section className="results" aria-live="polite">`：每项 `<X> 票 (Y%)` + 横向条
5. **a11y**：bar 用 `aria-hidden="true"`；section `aria-live="polite"` 但仅在票数变化时不抢焦点
6. **冒烟**：两个浏览器（无痕窗口）开同房间，A 投 → B 1.5s 内看到更新

## Risks

- **R-1** 轮询请求叠加：组件卸载未清 interval → 内存泄漏 + 重复请求；useEffect cleanup 必须 clearInterval
- **R-2** 网络慢导致前端响应栈积：用"in-flight 标记"跳过并发；本期间隔 1.5s 通常够，先简单不做
- **R-3** SQL `LEFT JOIN ... AND v.deleted_at IS NULL` —— votes 表 STORY-001 schema 没建 deleted_at；改用 `LEFT JOIN votes v ON v.option_id = o.id`（votes 本身不软删，options 软删时该选项 not in 查询自动被前提 WHERE 排除）

## Rollback

- 整 STORY 单独 PR；revert 即可
- 无 DB 迁移
- 失败回退：删 results 端点 + Room.tsx 中 results 段 + api.ts fetchResults

## Open Questions

- OQ-1 轮询间隔可配？★ 默认硬编码 1500ms；如需调整开新 STORY
- OQ-2 是否在 results 中暴露每项的投票者总数（去重后）？★ 默认不暴露（隐私）

## 接下来做什么

1. ★ `/tunan-testplan PLAN-003`
