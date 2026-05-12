---
name: tunan-story
description: tunan 工作流第三站：把 PRD 拆为 1..N 个 STORY（用户故事），写入 STORY 池。每个 STORY 独立可开发可验收。触发：/tunan-story、"拆 PRD-xxx"、"开始 story 阶段"。
---

# tunan-story — PRD → STORY(s)

> **何时触发**：sponsor 说 `/tunan-story`、`/tunan-story <PRD-id>`、"拆 PRD-007"。

## 调用语法

```
/tunan-story                          # pop-next：弹 PRD 池下一个
/tunan-story <PRD-id>
/tunan-story list / show / block / unblock
```

**开关**：
- `--target-count=<n>` — 目标 STORY 数（默认让 claude 自由判断 + 经 align 确认）
<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
- `--id-base=<STORY-NNN>` — 起始 id（默认 = 跨所有 sprint 的下一序号，glob `.tunan-workspace/sprints/SPT-*/reqs/REQ-*/PRD-*/STORY-*/`）

## 拆分原则（必须遵守）

- **独立可开发**：每个 STORY 应能单人在 1-3 天完成；超过则继续拆
- **独立可验收**：每个 STORY 自带 Given-When-Then acceptance；不依赖其他 STORY 完成才能验
- **垂直切片**：宁可窄端到端，不要横向分层（"前端" + "后端" 不是好拆法）
- **可独立部署**：合并后即使其他 STORY 没做，也不破坏现有功能（用 feature flag 或可见性收口）

## 流程

### 1. prime + pop-next（同 tunan-prd 套路）

### 2. 起 STORY 候选清单

读 PRD 的 FR + Personas + Acceptance，提出 N 个 STORY 草稿。每个：
- title（动词开头："允许 sponsor 关闭投票"）
- As-a / I-want / So-that
- 估算 S/M/L
- 依赖（指向其他 STORY）

### 3. 对齐（tunan-align，关键决策点）

- **Q1 数量与切分**：呈现 3 种切分方案（粗 3 / 标准 5 / 细 8 个 STORY），★默认 = 标准
- **Q2 优先级**：哪些 P0 现做 / 哪些 P2 留后
- **Q3 拆出但不做**：是否有 STORY 直接进 Non-Goals（PRD 里写 Open Questions 兜底）

### 4. 落盘（每条一个文件）

<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
`<REQ-dir>/<PRD-dir>/<STORY-id>-<slug>/<STORY-id>-<slug>.md`（`<REQ-dir>` 通过 PRD frontmatter `source_id` Glob 反查到 `.tunan-workspace/sprints/SPT-*/reqs/<REQ-id>-*/`），套本 skill 同目录 `template.md`：
（`<REQ-dir>` 和 `<PRD-dir>` 通过 PRD frontmatter 的 source_id 反查；STORY 自己有独立目录方便后续 PLAN/TESTPLAN/PR 同居）
- frontmatter `source_id: PRD-xxx`、`priority`、`estimate`、`blocked_by`
- 正文必含 As-a / I-want / So-that + Given-When-Then AC + Dependencies
- `status: ready`（或 `blocked` 若依赖未完成）

### 5. 维护依赖图

- 在每个 STORY 的 `blocked_by` 填上前置 STORY id
- PRD 池条目状态保持 `in_progress`，等所有 STORY done 后由 verify 回写

## 反模式

- ❌ 一个 PRD 拆 1 个 STORY（除非真的就一句话工作量；否则等于跳过 STORY 阶段）
- ❌ 把 PLAN 写进 STORY（"修改 X 文件"、"用 Redis"——那是 PLAN 的事）
- ❌ AC 写成 "用户能投票"（不可验证；改成 "Given 投票开启 When 用户点提交 Then 看到自己的选项被高亮且计数 +1"）

## 接下来做什么

```
✅ 拆出 5 个 STORY 写入 <PRD-dir>/STORY-007..011-*/：STORY-007..STORY-011

推荐下一步：
  1. ★ /tunan-plan STORY-007  — 从依赖图根节点起 PLAN
  2. /tunan-parallel-pick     — 看哪些 STORY 可并行开发
  3. /tunan-cp -- 添加 5 个 STORY
  4. /tunan-prime
```
