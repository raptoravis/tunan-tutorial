---
name: tunan-improve-arch
description: tunan 架构反思与改进提案。基于代码现状 + retro 历史，识别架构性债务、提出整改方案；产出走正常 REQ→PRD→...流程，不当场动代码。触发：/tunan-improve-arch、"看看架构有啥问题"、"该重构了吗"。
---

# tunan-improve-arch — 架构反思与改进

> **何时用**：发现某类问题反复出现（同一组文件改 5 次）；retro 多次指向同一处；扩展某功能成本异常高。

## 调用语法

```
/tunan-improve-arch                       # 通用扫描
/tunan-improve-arch --area=src/api        # 限定子树
/tunan-improve-arch --from-retros         # 仅基于 retro 历史推
```

## 流程

### 1. 收集证据
- 近 N 个 retro 的 trigger / root-cause
- `git log --pretty='%h %s' -- <area>` 改动热点
- 现有 `.tunan-workspace/diagnose/` 中重复出现的根因
- 若有 graphify-out/ → 用之

### 2. 识别架构性问题（不是单 bug）

判定标准：
- 同一文件被 ≥3 个不同 STORY 改过
- 某接口的 caller 散布 ≥5 处
- 命名/职责不清导致 review 反复纠结
- 测试用例对实现细节过度耦合

### 3. 产出改进提案（top 3 + ★默认）

每条提案：
- 范围（哪些文件/模块）
- 收益（解决哪类反复出现的问题，关联具体 retro id）
- 成本（粗估 STORY 数 / 风险）
- 路径（拆步骤还是大动）

| #  | 提案                                | 说明                                  |
| A  | ★ 把 Vote.tsx 拆为 PollList + Vote 子组件 | 解决 3 个 retro 反复指向的同一文件         |
| B  | 引入 状态管理库（Zustand）              | 收益更大，成本一个 sprint                |
| C  | 不动，写规范文档                        | 最弱，治标                             |

### 4. 不当场动代码

- 选定提案 → 调 `tunan-req` 起新 REQ：`kind: chore`，title 含"重构 — <area>"
- REQ 走正常流程（PRD/STORY/PLAN/...）
- 改进本身有 acceptance：明确"重构完成时世界什么样"（如"Vote.tsx 不再有任何 useState 调用"）

### 5. 链接证据
- 新 REQ 的 frontmatter 多一个字段 `motivated_by: [RETRO-NNN, RETRO-MMM]`
- 让未来 retro 能看到此次改进是否真的让那些根因不再出现

## 反模式

- ❌ 直接动代码（架构改动应走 STORY 链路保证可回滚）
- ❌ 提"通用现代化"提案（Next.js / React 18 / TypeScript 5 等无具体收益叙事）
- ❌ 一次提 5 个改进 — 收敛 3 个，sponsor 选 1
- ❌ 重构和 feature 混进同一个 REQ — 拆开

## 接下来做什么

```
✅ 架构提案已转 REQ-NNN（kind=chore, motivated_by=...）

推荐下一步：
  1. ★ /tunan-prd REQ-NNN       — 走正常 chore 流程
  2. /tunan-prime
  3. /tunan-improve-arch --area=<其他子树>
```
