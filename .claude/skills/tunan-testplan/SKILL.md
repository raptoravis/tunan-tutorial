---
name: tunan-testplan
description: tunan 工作流第五站：基于 PLAN 出 TESTPLAN（测试矩阵 / persona / smoke / regression / pass criteria）。TESTPLAN 入池后即可被 tunan-dev 拿去开发。触发：/tunan-testplan、"给 PLAN-xxx 出测试计划"。
---

# tunan-testplan — PLAN → TESTPLAN

> **何时触发**：sponsor 说 `/tunan-testplan`、`/tunan-testplan <PLAN-id>`。

## 调用语法

```
/tunan-testplan                       # pop-next
/tunan-testplan <PLAN-id>
/tunan-testplan list / show / block / unblock
```

## 关键原则

- **从 STORY 的 AC 反推**：每条 Given-When-Then 至少一个测试用例
- **从 PLAN 的 Affected Files 推回归**：动过的文件涉及的现有用例必须再跑
- **Persona 多样性**：novice / power-user / adversarial 至少各 1 条场景
- **Pass criteria 必须二值化**：通过 / 不通过；不要"基本通过"
- **TESTPLAN 是 tunan-dev 的输入合同**：dev 阶段以"使所有 TESTPLAN 用例通过"为目标

## 流程

### 1. prime + pop-next

### 2. 读 STORY + PLAN 双源

- STORY 的 AC = 必测的"业务正确性"
- PLAN 的 Affected Files = 必测的"回归不破坏"

### 3. 起草 TESTPLAN（基于本 skill 同目录 `template.md`）

#### Test Matrix
列影响维度（浏览器 / OS / 用户角色 / 数据规模 / 网络条件），每维度取值不必穷举，覆盖关键即可。

#### Persona Scenarios
```
novice:        步骤 1..N → 期望结果
power-user:    ...（含快捷键 / 批量操作）
adversarial:   ...（畸形输入 / 截止后再投 / 并发提交）
```

#### Smoke
- [ ] 最小冒烟：能不能投一票看到结果

#### Regression
- [ ] 现有"投票创建"流程不变
- [ ] 现有"查看投票结果"不变

#### Pass Criteria
- 全部 ✅ → PR 池可进 testing→sponsor_wait
- 任一 ❌ → PR 状态 failed，回 retro

### 4. 对齐（tunan-align）

- Q：测试粒度（仅 e2e 主流程 / 加单元测试 / 加集成）— ★默认按 PLAN 中的测试覆盖决议
- Q：失败重试策略（不重试 / 重试 1 次 / 重试 3 次）— ★默认不重试，flaky 即视为失败
- Q：环境（dev / staging / 本地 mock）— ★默认本地

### 5. 落盘

`<STORY-dir>/<TESTPLAN-id>-<STORY-slug>.md`，`source_id: PLAN-NNN`，`status: ready`

> 与同 STORY 的 PLAN/PR 共享目录；slug 沿用 STORY slug。

## 反模式

- ❌ 把 STORY 的 AC 原样复制 → AC 是合同条款，TESTPLAN 是执行步骤；要展开
- ❌ "测试通过" 作为 pass criteria → 哪些测试？阈值多少？
- ❌ 漏 adversarial persona — 这是发现 bug 的主要来源
- ❌ 把测试数据写在测试计划里 → 测试计划描述要做什么测，不带具体 fixture

## 接下来做什么

```
✅ TESTPLAN-NNN 已写入 testplan/，status=ready

推荐下一步：
  1. ★ /tunan-dev TESTPLAN-NNN  — 创建 worktree 开始开发（入口会统一 commit+push PLAN/TESTPLAN 到 base，见 tunan-dev §2.5）
  2. /tunan-tdd TESTPLAN-NNN    — 强制 TDD 红灯起步
  3. /tunan-prime
```
