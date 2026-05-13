---
id: PRD-001
title: 轻量投票系统 PRD
owner: raptoravis
status: in_progress
created: 2026-05-13
updated: 2026-05-13
source_id: REQ-001
priority: P2
blocked_by: []
pipeline_defaults_applied:
  - persona_scope=internal-small-team (source: pipeline-default)
  - a11y_baseline=WCAG-AA (source: pipeline-default)
  - perf_p95_api<200ms (source: pipeline-default)
  - tech_stack=Node+Hono+Vite/React+SQLite (source: pipeline-default, 由 PLAN 细化)
---

# PRD-001 轻量投票系统

## Background

源自 REQ-001：sponsor 希望搭一个能快速发起投票（"去哪旅游 / 中饭吃啥"）的轻量工具。
目标用户是小团队（≤ 30 人），无需账号体系，session/cookie 防刷即可。

## Personas

- **P1 发起人**：想拍板"中午吃啥"或"周末去哪"的组织者；要求是"30 秒能起一个投票分享出去"
- **P2 参与者**：拿到链接，扫一眼候选项就点选；要求是"无需注册、能看实时结果、能改主意"
- **P3 观望者**（次要）：不投票只看结果

## Functional Requirements

### FR-001 投票创建
- 输入：标题（≤100 字）+ 2..10 个候选项
- 输出：投票 ID（短 nanoid 10 位）+ 可分享链接
- 候选项创建后不可由参与者追加
- 可选字段：截止时间（不填则永不截止）

### FR-002 投票动作
- 单选模型
- 同 session/cookie 同投票只能投一次；可修改自己的选择直到截止
- 提交后立即返回最新结果

### FR-003 实时结果
- 每候选项展示绝对票数 + 百分比
- 投票动作后无需手动刷新整页即可见最新结果（轮询或简单 SSE 均可，PLAN 阶段定）
- 总票数显示

### FR-004 模板预填
- 内置两个模板按钮："旅游目的地" / "中饭吃啥"
- 点击模板预填示例标题与候选项；用户可继续编辑
- 模板非硬约束

### FR-005 创建者管理
- 创建者持有创建时返回的 owner_token（cookie 存）
- 凭 owner_token 可删除自己创建的投票（二次确认）

## Non-Functional Requirements

- **性能**：API p95 < 200ms（小数据集，单机 SQLite 完全足够）
- **可访问性**：键盘可达 + 语义化 label；目标 WCAG AA
- **安全**：防 CSRF（同源 + SameSite cookie）；nanoid 10 位防顺序遍历
- **可观测**：基础访问日志即可，无需引入 APM
- **兼容**：现代浏览器（Chrome/Edge/Firefox/Safari 近两年版本）

## Acceptance

- AC-001 创建投票 → 拿到链接 → 别人打开链接 → 投票 → 看到票数变化（端到端 happy path）
- AC-002 同一浏览器对同一投票重复投票 → 第二次为"改票"而非"加票"
- AC-003 创建时未指定截止时间 → 投票永不过期
- AC-004 模板按钮点击 → 表单预填示例内容
- AC-005 创建者凭 owner_token 删除投票 → 链接 404
- AC-006 候选项数量 < 2 或 > 10 → 创建失败，返回明确错误
- AC-007 标题超过 100 字 → 创建失败

## Risks

- R-1 SQLite 单文件并发：小团队场景下风险极低；若超出预期可后续切 PG
- R-2 session 防刷绕过（清 cookie 即可重投）：接受，明确为"非强保证"
- R-3 截止时间时区处理：用 UTC 存，前端按本地时区显示

## Decisions（pipeline-default）

| 决策 | 选择 | 来源 |
|---|---|---|
| 投票模型 | 单选 | pipeline-default |
| 身份识别 | session/cookie | pipeline-default |
| 候选项创建后追加 | 否 | pipeline-default |
| 结果可见性 | 实时 | pipeline-default |
| 截止时间字段 | 可选 | pipeline-default |
| ID 形式 | nanoid 10 位 | pipeline-default |
| 创建者删除权 | 是，二次确认 | pipeline-default |
| 技术栈方向 | Node + Hono + Vite/React + SQLite | pipeline-default（PLAN 细化） |
| a11y 基线 | WCAG AA | pipeline-default |

## Open Questions（PRD 阶段未决，下沉到 STORY/PLAN）

无（pipeline 内调，全部就地 ★ 默认）

## 接下来做什么

1. ★ `/tunan-story PRD-001` — 拆 STORY（pipeline 自动衔接）
2. `/tunan-cp -- 添加 PRD-001`
3. `/tunan-prime`
