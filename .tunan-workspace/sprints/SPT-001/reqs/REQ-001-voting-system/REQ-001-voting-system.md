---
id: REQ-001
title: 轻量投票系统（旅游目的地 / 中饭吃啥）
owner: raptoravis
kind: feature
status: in_progress
created: 2026-05-13
updated: 2026-05-13
source_id:
priority: P2
blocked_by: []
research_done: true
raw_req_source: raw-reqs/SPT-001/2026-05-12-voting-system.md
pipeline_defaults_applied:
  - kind=feature (source: pipeline-default)
  - priority=P2 (source: pipeline-default)
  - voting_model=single-choice (source: pipeline-default)
  - identity=session-based (source: pipeline-default)
  - options_fixed_at_create=true (source: pipeline-default)
  - results_realtime=true (source: pipeline-default)
---

# REQ-001 轻量投票系统

## 用户原话

> 我想做一个投票系统：可以投票去哪里旅游 / 中饭吃什么。

## 我理解的意图

搭一个轻量投票工具，让小团队能快速针对"去哪旅游、中饭吃什么"这类多选场景发起投票、收集意见、查看实时结果。

## Goals

- **G-001** 创建投票：用户可创建一个投票，含标题、N 个候选项（N ≥ 2）
  - [ ] AC-001.1 可输入标题（≤ 100 字）+ 2..10 个候选项
  - [ ] AC-001.2 创建后生成可分享链接 / 投票 ID
  - [ ] AC-001.3 创建时确定的候选项不可被参与者追加（防 scope 漂移）

- **G-002** 投票：参与者可在候选项中选一项
  - [ ] AC-002.1 单选模型（pipeline-default）
  - [ ] AC-002.2 同一浏览器 session 同一投票只能投一次（防刷基线）
  - [ ] AC-002.3 已投票后可修改自己的选择，直至投票截止

- **G-003** 实时结果：任何人访问投票链接可看到当前票数与百分比
  - [ ] AC-003.1 每个候选项显示绝对票数 + 百分比
  - [ ] AC-003.2 结果在投票动作后即时刷新（无需手动刷新整页）

- **G-004** 模板化常用场景：内置"旅游目的地 / 中饭吃啥"两类模板（一键填示例选项）
  - [ ] AC-004.1 模板按钮预填示例标题与候选项，用户可继续编辑
  - [ ] AC-004.2 模板不是硬约束，用户可完全自定义

## Constraints

- 单机起步，无需多区域 / 高并发架构
- 不引入复杂账号体系，用 session / cookie 识别身份即可
- 技术栈跟随项目 ★ 默认（Node + Hono + Vite/React + SQLite，由后续 PLAN 阶段确定）

## Non-Goals

- 不做实名登录 / OAuth / 邮箱验证
- 不做选项动态追加（参与者不能加候选项）
- 不做加权投票 / 多轮投票 / 排序投票
- 不做投票审计 / 区块链存证 / 反作弊高级策略（IP 黑名单、人脸识别等）
- 不做管理后台 / 投票审核

## Scope Boundary

**In**：创建投票、单选投一票、改票、实时结果、两类示例模板

**Out**：多选投票、匿名性强保证、可追溯审计、移动 App、推送通知、邀请系统、过期归档自动清理

## Open Questions

（pipeline 内调，按 ★ 默认全部就地决议；保留以便后续 PRD 阶段复审）

- OQ-1 是否需要"截止时间"功能？★ 默认 **是，可选字段**（不填则永不截止）
- OQ-2 创建者能否删除自己的投票？★ 默认 **能，且二次确认**
- OQ-3 投票链接是否需要混淆 ID（避免顺序遍历）？★ 默认 **是，短 nanoid**

## Research Findings

- 单选投票 + session 防刷是最小可用基线，社区常见做法（如 strawpoll / dudle）
- 实时结果显示比"投票后才可见"对小团队场景更友好（即时反馈）
- 候选项创建时固定能有效避免 scope 漂移与"被人乱加项"的体验问题
- 短 ID（如 nanoid 10 位）足以抗顺序遍历，无需鉴权

## 接下来做什么

1. ★ `/tunan-prd REQ-001` — 展开成 PRD（pipeline 将自动衔接）
2. `/tunan-cp -- 添加 REQ-001` — 先提交到 git
3. `/tunan-prime` — 查看池现状
