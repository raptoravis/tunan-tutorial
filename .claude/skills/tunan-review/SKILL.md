---
name: tunan-review
description: tunan 自动代码审查。读 PR diff 与 STORY/PLAN/TESTPLAN 链路，出可操作 review 评论；通过则推进 PR 状态到 testing。tunan-pr 闭环内调本 skill。触发：/tunan-review、其他 skill 间接调用。
---

# tunan-review — 自动审查

> **职责**：作为 PR 自驱动闭环的 reviewer 角色，读 PR diff + 上游 artifact，出**可执行**评论（不写 "looks good" 这种废话）。

## 何时被调用

- 直接：`/tunan-review <PR-id>`
- **间接（主要）**：`tunan-pr` 闭环每轮第 2 步

## 输入

- PR diff（`gh pr diff <num>`）
- 上游链路：PR 的 source_id → TESTPLAN → PLAN → STORY → PRD → REQ
- 上一轮 review 评论（避免重复指出 / 检查是否已修）

## 审查清单（按重要性递降）

### A. 与意图一致性（最关键）
- diff 是否实现了 STORY 的 AC（Given-When-Then）
- 是否有 STORY 没要求的功能（gold-plating）
- 是否漏 PLAN 的 Steps 中某一步
- Affected Files 与 PLAN 列表是否一致；多了哪些、少了哪些 → 都要问

### B. 正确性
- 边界条件：空输入 / 超长 / 0 / 负数 / null / 并发
- 错误路径：catch 是否吞错 / 错误信息是否泄露内部
- 类型/状态机一致性：枚举漏 case / switch 漏 default
- 与 STORY 直接对照：每条 AC 找到对应实现行
- **Server→Client 边界**：若 PR 改了 SSR page 把 DB 行（`node:sqlite` / `better-sqlite3`）
  直接传给 `"use client"` 组件，是否做了 plain-object 映射（`.map(r => ({ ...r }))`）；
  null-prototype 行会触发 Next 15+ 序列化拒绝（来源 RETRO-PR-003）

### C. 与现有代码的关系
- 是否引入与现有模块重复的逻辑（应复用）
- 是否破坏现有 API 契约（向后兼容）
- 命名/分层是否跟项目惯例一致

### D. 测试质量
- 测试是否真测了行为（不是测实现细节）
- 是否有 flaky 模式（time.sleep / 顺序依赖）
- TESTPLAN 中的 adversarial persona 是否被实测

### E. 回滚路径
- PLAN 的 Rollback 是否仍有效（schema/flag/revert 可行）

## 不审的事（避免噪音）

- 风格/格式（lint 的事）
- 性能微优化（除非是 NFR 阈值相关）
- 主观偏好（命名风格、几行代码、空行）
- 测试覆盖率数字（看实际覆盖关键路径即可）

## 流程

### 1. 拉 PR 状态
```
gh pr view <num> --json state,reviewDecision,files
gh pr diff <num>
```

### 2. 读链路
- 顺 source_id 链回到 STORY/PLAN/TESTPLAN，把 AC + Steps + Affected Files 摘出来作为审查锚点

### 3. 读上一轮评论
```
gh pr view <num> --comments
```
- 标识哪些已被新 commit 处理（比对评论时间 vs commit 时间）
- 不再重复未变更的评论；新发现才发声

### 4. 出结构化评论

每条评论格式：
```
[severity] <文件:行> — <一句话问题>
建议：<一句话怎么改>
关联：<STORY-AC 编号 / PLAN-Step 编号 / TESTPLAN-用例>
```

severity：
- `MUST` — 阻塞合并（正确性、与意图不符、严重 bug）
- `SHOULD` — 强烈建议（一致性、可维护性）
- `NIT` — 可选（不阻塞，留给 sponsor 取舍）

### 5. 写到 PR

```
gh pr review <num> --comment --body "<结构化评论汇总>"
```

或针对具体行用 `gh pr review --request-changes` + 行内评论（API 复杂时退化为整体 comment 即可）。

### 6. 输出 verdict

| Verdict | 条件 | 动作 |
|---|---|---|
| `pass` | 0 MUST / 0 SHOULD（NIT 可有） | 通知 `tunan-pr` 推进到 testing |
| `changes_requested` | ≥1 MUST 或 ≥1 SHOULD | PR status 保持 reviewing，等 coder 修 |

将 verdict 写回 PR 池 frontmatter `last_review: pass | changes_requested` + `last_review_at`。

## 反模式

- ❌ "Code looks good" — 没价值的评论；要么 pass 要么有具体问题
- ❌ 找到一个问题就停 — 一轮要把能找到的全找；coder 修一次比改三次便宜
- ❌ 评论里写"建议改成 …"+ 一段 30 行代码 — 应一句话指方向，让 coder 自己实现
- ❌ 把 NIT 标成 MUST — 阻塞性要严格

## 接下来做什么

被 `tunan-pr` 内调时：返回 verdict 和评论计数即可。

直接调用时：
```
✅ Review 完成：<verdict>，写了 N 条评论 (M MUST / S SHOULD / x NIT)

推荐下一步：
  1. ★ /tunan-pr <PR-id>      — 让闭环继续（coder 修 / tester 跑）
  2. /tunan-pr <PR-id> --watch
  3. /tunan-prime
```
