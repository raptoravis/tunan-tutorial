---
name: tunan-diagnose
description: tunan bug 诊断。把 bug 现象转为可复现的失败测试，定位根因（不当场修），输出诊断报告供 tunan-plan 修复。触发：/tunan-diagnose、"诊断 REQ-xxx"、"为什么 X 会出错"。
---

# tunan-diagnose — Bug 根因诊断

> **核心**：诊断 ≠ 修复。本 skill 输出"现象 → 复现测试（红）→ 根因假说 → 验证"的诊断报告；修复走正常 STORY/PLAN/dev 流程。

## 调用语法

```
/tunan-diagnose <REQ-id>             # REQ kind=bug
/tunan-diagnose --from-issue <#>
/tunan-diagnose --quick              # 跳过 align，凭快感写假说（仅探索）
```

## 流程

### 1. 收集现象
- 从 REQ / issue / sponsor 描述抽：复现步骤 / 期望 / 实际 / 环境
- 缺一项 → 调 `tunan-grill` 追问，不脑补

### 2. 写复现测试（必须红）
- 调 `tunan-tdd` 协议：在仓库内（或临时 worktree）写一个失败测试**只复现该 bug**
- 跑 → 必须红
- 红状态 = 现象已可机器复现，是根因定位的锚点

### 3. 二分 / 排查
- `git bisect` 如果是回归（之前能跑现在不能）
- `git log --oneline -- <相关文件>` 找最近改动
- Grep 关键路径
- 列出 ≤ 3 个根因假说（top3 + ★最可能）

### 4. 验证假说（不修）
- 对每个假说写一个**验证步骤**（不是修复）：
  - 假说 A 真 → 我应该看到 X
  - 假说 B 真 → 我应该看到 Y
- 跑验证 → 标记 hit / miss

### 5. 出诊断报告

<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
`.tunan-workspace/retro/<date>-diag-<REQ-id>.md`（与 retro 同目录便于查找）：

```
# 诊断报告 REQ-NNN

## 现象
<复现步骤 / 期望 / 实际 / 环境>

## 复现测试
<文件路径 + 用例名>，红色稳定可复现

## 假说与验证
| # | 假说                           | 验证       | 结果 |
| A | ★ Vote.tsx 状态未刷新           | console log | hit  |
| B | API 返回 stale 计数             | curl + diff | miss |
| C | DB 写后未 commit                | tx log      | miss |

## 根因
A：Vote.tsx 提交后未触发 refetch（src/web/Vote.tsx:42）

## 修复建议（不在本 skill 完成）
新建 STORY："投票后即时刷新结果"，PLAN 修改点：Vote.tsx onSubmit 后 mutate(swr key)
```

### 6. 不修

- 诊断完成，**控制权交回 sponsor**：是否走 STORY/PLAN/dev 修复
- 如果 sponsor 说"现在就修小一点"→ 提示走 STORY 流程（保留可追溯性），最差也得开个 STORY 占位

## 反模式

- ❌ 边诊断边修 — 失去 TESTPLAN 阶段，回归发现不了
- ❌ 没有红测试就给假说 — 假说没锚点
- ❌ 给 5 个假说稀释默认 — 先收敛 3 个
- ❌ 把诊断报告当 PLAN — 二者职责不同

## 接下来做什么

```
✅ 诊断报告已写入 retro/<date>-diag-<REQ-id>.md

推荐下一步：
  1. ★ /tunan-prd <REQ-id>      — 走正常修复流程
  2. /tunan-grill <REQ-id>       — 仍需要 sponsor 澄清现象
  3. /tunan-prime
```
