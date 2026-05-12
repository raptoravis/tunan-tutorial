---
name: tunan-retro
description: tunan 回顾 + 自我进化。形如"issue xyz came up, what could we fix in our rules/skills/workflows so it doesn't happen again"。提议对 tunan-* skill 的具体修改，sponsor 二次确认才落盘。触发：/tunan-retro、合并后的复盘、bug 修复后。
---

# tunan-retro — 回顾 + skill 自我进化

> **核心理念**（reqs/req.md §28）：让 skill 自己进化。每次失败/痛点都问"我们的 rules/skills/workflows 里有什么可以改的，让这种事不再发生？"

## 调用语法

```
/tunan-retro                          # 通用：复盘最近一段
/tunan-retro <REQ-id|PR-id>           # 围绕一个具体事件
/tunan-retro --since=2026-04-01       # 时间窗
```

## 流程

### 1. 收集事件信号
- 围绕给定 id：拉它的全链路 artifact + 评论 + diff + 失败用例
- 通用：取最近 N 个失败 PR、verify 失败、PR 池 failed 状态、merge 后 1 周内复发的 issue

### 2. 提问框架（USER.md 风格 + reqs §28 提法）

> "issue xyz came up. 我们的 rules / skills / workflows 中有什么可以改的，让这种问题不再发生？"

### 3. 提议改动（top 3 + ★默认）

每条改动必须：
- 指明**具体**改哪个文件（`.claude/skills/tunan-X/SKILL.md` 第 N 段 / `.claude/skills/tunan-X/template.md`）
- 给出 diff 草稿（不是模糊描述）
- 写 `Why:`（这次失败的根因关联）
- 写 `Risk:`（改了可能引入的反模式）

示例：

```
对齐 Q1：怎么改？

| #  | 提议                                      | 说明                              |
| A  | ★ tunan-testplan 的 Persona 模板加"提交后即时反馈"行 | 最便宜，未来 TESTPLAN 自动覆盖该类用例 |
| B  | tunan-review 增加"前后端状态同步"检查项         | 范围更大，所有 PR 受益                |
| C  | 仅记录 retro 不改 skill                       | 最弱，下次还会犯                      |
```

### 4. **关键防线**：sponsor 二次确认

提议被 sponsor 选中（含"全部默认"）后，**必须再一次**展示具体 diff 让 sponsor 确认：

```
即将修改 .claude/skills/tunan-testplan/SKILL.md：

  ### Persona Scenarios
  - novice: ...
  - power-user: ...
  - adversarial: ...
+ - feedback-loop: 用户提交动作后期望立即看到状态变化（无需手动刷新）

落盘？(★ 是 / 否 / 调整)
```

`是` 才写文件。`否` 仅记 retro 不动 skill。`调整` 让 sponsor 微调 diff。

> 这一防线源自 REQ-001 G-005："retro 改写 skill 必须经 sponsor 复核才落盘（避免 skill 自毁）"

### 5. 落盘 retro 记录

`.tunan-workspace/retro/<YYYY-MM-DD>-<slug>.md`：
```yaml
---
id: RETRO-NNN
date: 2026-05-10
trigger: REQ-003           # 触发事件 id
applied_changes:           # 实际落盘的 skill 改动
  - file: .claude/skills/tunan-testplan/SKILL.md
    summary: 加 feedback-loop persona
declined_changes:           # 提议但未采纳
  - 提议 B（review 检查）：暂留待下次
---

# RETRO-NNN: <slug>

## 触发
REQ-003 投票后无结果计数 — TESTPLAN 漏覆盖"提交后即时反馈"类场景

## 根因
tunan-testplan 的 persona 模板只列了 novice/power-user/adversarial，
没有显式覆盖"用户期望即时反馈"这一类常见 UX 行为。

## 决议（来源：accept all）
- 采纳 A：改 testplan persona 模板
- 暂留 B
- 否决 C

## 落盘 diff
<完整 diff>

## 后续观察
等下一次 testplan 创建时，验证是否自动覆盖类似场景。
```

### 6. 联动 cp

retro 落盘后**不**自动 commit；提示 sponsor 用 `/tunan-cp` 提交 retro + skill 改动一起。

## 反模式

- ❌ 提议太抽象（"改进流程"）— 必须指文件 + diff
- ❌ 跳过 sponsor 二次确认 — skill 自毁风险
- ❌ 改了 skill 不写 retro — 失去可追溯性
- ❌ retro 变发散讨论 — 强制 top 3 收敛

## 接下来做什么

```
✅ RETRO-NNN 已落盘；落实 1 项 skill 改动。

推荐下一步：
  1. ★ /tunan-cp -- 应用 retro RETRO-NNN（提交 retro + skill 改动）
  2. /tunan-prime               — 看后续工作
  3. /tunan-retro --since=...   — 复盘更长周期
```
