---
id: PRD-001
title: 轻量群体投票系统 PRD
owner: raptoravis
source_id: REQ-001
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
blocked_by: []
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# PRD-001 — 轻量群体投票系统

## Background

源自 REQ-001：sponsor 想要一个轻量的群体投票工具，典型场景"周末去哪旅游"、"中饭吃什么"。本 PRD 把 REQ 已决议的方向（匿名 + cookie 去重 / 单选+多选 / Web 响应式 / SQLite / 投完即看 / 可选截止 / 内置两个示例模板）展开为可被 STORY 拆分的 FR/NFR 集。

## Personas

| ID | 名字 | 描述 | 主线？ |
|---|---|---|---|
| P-A | 发起人 Alice | 想让大家定一件事（吃饭/旅游），点几下创建话题并分享链接 | ✅ 主线 |
| P-B | 参与者 Bob | 收到链接，移动端浏览器打开，30 秒内投完票 | ✅ 主线 |
| P-C | 观察者 Carol | 路过看结果，未必投票 | 次要（同 P-B 共用结果视图） |

## Acceptance（继承自 REQ-001 G-001..G-005）

- 创建：标题非空 + ≥2 选项 + 可选截止时间 → 拿到分享短链
- 投票：单选/多选 → 提交即看结果
- 防重：同浏览器对同话题二次提交返回 409
- 结果：按票数倒序 + 百分比 + aria-live
- 模板：首页两个一键填充按钮（旅游 / 午餐）

## Functional Requirements

### FR-1 创建话题
- **FR-1.1** 创建表单：标题（必填，1..120 字符）、模式（单选/多选 radio 切换）、选项列表（动态增删，2..20 项，每项 1..80 字符，trim 后去重）、截止时间（可选 datetime-local）
- **FR-1.2** 提交端点 `POST /api/polls` → 返回 `{ id, shareUrl }`；id 为 ≥8 位 base62 随机短码
- **FR-1.3** 创建后跳转 `/p/<id>`，页面顶部展示分享链接 + 复制按钮

### FR-2 投票
- **FR-2.1** 投票页 `GET /p/<id>` 显示标题、选项、截止状态；如已截止仅展示结果
- **FR-2.2** 单选用 `<input type=radio>`；多选用 `<input type=checkbox>`，至少选 1 项
- **FR-2.3** 提交端点 `POST /api/polls/:id/vote` body `{ optionIds: number[] }`；成功 200 + 返回最新聚合
- **FR-2.4** 服务端写入 `voter_token` cookie（HttpOnly, SameSite=Lax, 6 mo），记录"本浏览器已投话题 id 集合"

### FR-3 防重复投票
- **FR-3.1** 提交前检查 `voter_token` 中是否已包含本话题 id → 是则 409 `{ error: "already_voted" }`
- **FR-3.2** 页面在投票成功后切换为结果视图并禁用提交按钮
- **FR-3.3** 创建页 + 投票页均显著标注"匿名 cookie 去重，并非强身份认证"

### FR-4 查看结果
- **FR-4.1** 结果区按票数倒序展示每项：选项文本 / 票数 / 百分比（百分比=该项票数/总票数，总票数=所有 ballot 数，多选模式下一个 ballot 算一票）
- **FR-4.2** 结果区容器 `aria-live="polite"`
- **FR-4.3** 已截止 → 显示"已截止于 YYYY-MM-DD HH:mm"

### FR-5 示例模板
- **FR-5.1** 首页 `/` 含两个按钮："去哪旅游"、"中饭吃什么"
- **FR-5.2** 点击后跳 `/new?template=travel|lunch`，创建表单已预填标题与典型选项
- **FR-5.3** 预填内容用户可编辑

## Non-Functional Requirements

| 类别 | 指标 |
|---|---|
| 性能 | 单实例 SQLite，1000 话题 × 100 票量级，API p95 < 300ms |
| a11y | WCAG 2.1 AA：选项 `<label for>` 关联、键盘 tab 顺序、结果区 aria-live、对比度 ≥4.5:1 |
| 安全 | cookie HttpOnly+SameSite=Lax；输入服务端校验；XSS 防护（选项文本仅以文本节点渲染，不 innerHTML） |
| 可观测 | 简单 access log；error log 含 request id |
| 兼容 | 现代浏览器（Chrome/Edge/Safari/Firefox 近两年版本）；响应式 ≥320px |
| 部署 | 单进程 Node 服务 + 单文件 SQLite；本地 `pnpm dev` 即可起 |

## Decisions（已对齐，pre-auth = ★ 默认）

| Q | 决议 | 来源 |
|---|---|---|
| 优先级 | P2 | accept all |
| 投票方式 | 单选/多选都支持 | accept all |
| 身份模型 | 匿名 + cookie 去重 | accept all |
| 截止时间 | 可选 | accept all |
| 结果时机 | 投完即看 | accept all |
| 平台 | Web 响应式 | accept all |
| 示例模板 | 旅游/午餐 两个 | accept all |
| 持久化 | SQLite | accept all |
| Persona 主线 | P-A / P-B | accept all |
| a11y 等级 | WCAG AA | accept all |
| 短码长度 | 8 位 base62 | accept all |
| 选项上限 | 20 | accept all |

## Open Questions（deferred 到 STORY 阶段）

- 是否需要"二维码生成"作为分享辅助？— 暂列 Non-Goal，STORY 阶段如简单可顺手做
- 投票后是否允许"撤回 + 改投"？— 首版按"不允许"

## Risks

- **R1 cookie 删除即可重复投** — 已知 limitation，UI 标注；非业务关键场景可接受
- **R2 短码碰撞** — 8 位 base62 ≈ 218 万亿，碰撞期低于话题量级 1e6 时可忽略；保留唯一索引兜底
- **R3 SQLite 并发写** — 单实例 + WAL 模式足以撑 demo 量级

## Non-Goals（继承 REQ）

登录系统 / websocket 推送 / 评论 / 私密投票 / 邮件通知 / 管理后台 / 发起人编辑已创建话题。

## 接下来做什么

1. ★ `/tunan-story PRD-001` — 拆 STORY
2. `/tunan-cp -- 添加 PRD-001`
3. `/tunan-prime`
