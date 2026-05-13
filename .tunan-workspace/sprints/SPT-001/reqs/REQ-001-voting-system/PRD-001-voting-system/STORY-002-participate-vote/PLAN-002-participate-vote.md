---
id: PLAN-002
title: 参与投票（多选 + 修改）— 实现计划
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-002
priority: P1
---

# PLAN-002 — 参与投票（多选 + 修改）

源：[STORY-002](./STORY-002-participate-vote.md)

## Approach

**复用 STORY-001 栈**：Hono + node:sqlite + Vite/React。

- **参与者身份**：服务端首次访问房间时签发一个不可猜的随机 token（32 字节 hex），写入 HttpOnly Cookie `pt`（path=/、SameSite=Lax，无过期=会话）；同一浏览器同 token 视为同一参与者
- **投票存储语义**：votes 表按 `(room_id, participant_token)` 唯一族；提交时**先 DELETE 旧票，再批量 INSERT 新票**，保证覆盖式语义（避免 UPSERT 复杂度）
- **GET 自身选择**：新增端点 `GET /api/rooms/:id/my-vote`，按 cookie 中 pt 查询当前参与者已选 option_id 列表
- **关闭/已关闭房间**：检查 `rooms.closed_at`；非空时投票端点返回 410，前端按钮置灰
- **否决备选**：
  - 用 URL 中 ?pt= 传 token：⛔ 易泄漏到 referer/分享链接，差于 cookie
  - 一次 UPSERT 同步：⛔ SQLite 多行 UPSERT 写法繁琐；DELETE+INSERT 同一事务效果一致
  - 把 votes 表改成"按 option 计票" 而不存逐人记录：⛔ 之后追加 option 删除 + 撤票需求会卡（STORY-005）

## Affected Files

新建：

```
- packages/server/src/lib/participant.ts          — issuePtCookie / parsePt / setPtHeaders
- packages/server/src/routes/votes.ts             — POST /api/rooms/:id/votes · GET /api/rooms/:id/my-vote
- packages/server/test/votes.test.ts              — 投票 + 修改 + 持久化 + 关闭 + 非法
```

修改：

```
- packages/server/src/app.ts                      — 挂 votes 路由
- packages/server/src/routes/rooms.ts             — GET 房间时若无 pt cookie 则签发（响应 Set-Cookie）；返回字段不含 admin_*
- packages/web/src/pages/Room.tsx                 — 替换占位：拉房间 → 拉自身选择 → 渲染复选框 → 提交 → 回显
- packages/web/src/lib/api.ts                     — 加 fetchRoom / fetchMyVote / submitVote 三个函数（credentials: 'include'）
- packages/web/vite.config.ts                     — proxy /api 已有，无需改；但 dev 同源走 :5173，cookie 自然可达
- packages/web/src/styles.css                     — 投票页 .options ul/li 样式 + 已选高亮
```

仅读：

```
- packages/server/src/db.ts                       — 用 getDb()，无需改 schema（votes 表已建）
```

## Steps

1. **participant lib**（`lib/participant.ts`）：
   - `newParticipantToken()` → `randomBytes(32).toString('hex')`
   - `getOrIssuePt(c: Context)` → 从 `c.req.header('cookie')` 解析 `pt=`；无则生成，并 `c.header('Set-Cookie', 'pt=...; HttpOnly; SameSite=Lax; Path=/')`
2. **rooms GET 增强**：调用 `getOrIssuePt` 后再返回；保证参与者初次访问房间页时拿到 cookie
3. **votes 路由**（`routes/votes.ts`）：
   - `POST /api/rooms/:id/votes` body `{ option_ids: number[] }`
     - 校验：room 存在；未关闭；option_ids 长度 ≥1；每个 option_id 属于本 room 且 deleted_at 为 NULL；去重
     - 事务：DELETE FROM votes WHERE room_id=? AND participant_token=?; INSERT 多行
     - 返回 `{ ok: true, selected: number[] }`
   - `GET /api/rooms/:id/my-vote`
     - 返回 `{ selected: number[] }`（按 cookie pt 查；房间不存在 → 404；无 cookie / 无投票 → `selected: []`）
4. **app 挂路由**：`app.route('/', votes)`
5. **votes 单测**（`test/votes.test.ts`，按 TESTPLAN-002 写）：
   - 投票成功 → my-vote 回读一致
   - 重复提交覆盖（不是累加）
   - 房间关闭 → 410
   - 不属于本房间的 option_id → 400
   - 空 option_ids → 400
   - 已删除的 option_id → 400
   - 不同 cookie 视作不同参与者；选择互不影响
6. **web Room 页**（`pages/Room.tsx`）：
   - `useEffect` 拉房间 + my-vote；状态 `selected: number[]`
   - 复选框列表（label 关联 input id），点击切换 selected
   - 「提交」按钮 disabled when selected.length===0 或正在提交
   - 提交后展示"已投票，可修改"提示（`role="status"`）
   - 房间已关闭：按钮 disabled 文案"投票已结束"
7. **web api lib**：fetch 全部带 `credentials: 'include'`；错误从 `error.field` 取
8. **冒烟**：dev 跑 server + web，浏览器开两个无痕窗口分别投票 → 各自 my-vote 不同；server 重启后回读不丢

## Risks

- **R-1** SameSite=Lax 在跨 origin 场景下 cookie 可能不发；本期 web 走同源 :5173 proxy /api，无问题；生产部署需同域名
- **R-2** 浏览器禁用 cookie → 参与者无法保持身份；本期可接受（PRD Non-Goals 兜底）；前端遇到 401-类信号给提示
- **R-3** 频繁切换勾选导致请求风暴：前端只在「提交」按钮触发请求（不实时同步）
- **R-4** SQLite 写并发：本期 50 人量级 + WAL 足够；保留单元测试压测 ≥10 并发提交不丢

## Rollback

- 整 STORY 在新 worktree / 新 PR 独立提交，未触动 STORY-001 代码核心（routes/rooms.ts 仅加 cookie 签发）；rollback = revert PR
- 无 DB 迁移（votes 表 STORY-001 已建）
- 无 feature flag（投票是 STORY-002 的核心功能）
- 失败回退：删 routes/votes.ts、解 app.ts 挂载、revert routes/rooms.ts 中 cookie 签发那几行

## Open Questions

- OQ-1 是否在 POST /api/rooms/:id/votes 时**也**签发 cookie（参与者直接 curl POST 而没先 GET 房间页）？★ 默认是（多签一次无害）
- OQ-2 单测里如何模拟 cookie 往返？★ 默认手工解析 `Set-Cookie` 响应头并在下个请求 header 里回传（不引第三方 cookie jar 依赖）

## 接下来做什么

1. ★ `/tunan-testplan PLAN-002` — 出测试计划
2. `/tunan-prime`
