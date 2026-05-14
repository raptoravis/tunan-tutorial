---
name: tunan-test
description: tunan 自动测试执行。在 PR worktree 内按 TESTPLAN 跑 smoke + persona + regression，按 pass criteria 二值化判定，未通过的写为 PR 评论。tunan-pr 闭环内调本 skill。触发：/tunan-test、其他 skill 间接调用。
---

# tunan-test — TESTPLAN 执行

> **职责**：作为 PR 自驱动闭环的 tester 角色，在 worktree 内按 TESTPLAN 跑全集测试；通过则推进到 sponsor_wait，未通过把失败写为 PR 评论让 coder 修。

## 何时被调用

- 直接：`/tunan-test <PR-id>` 或 `/tunan-test <TESTPLAN-id>`
- **间接（主要）**：
  - `tunan-dev` 第 6 步（开发自测）
  - `tunan-pr` 闭环 review pass 后

## 流程

### 1. 定位 worktree + TESTPLAN
- 从 PR 池条目取 `worktree` 和 `source_id`（TESTPLAN-id）
- 进入 worktree 路径执行（用 `git -C <path>` 或 `cd` 视情况）

### 2. 探测测试命令
- `package.json` scripts / `pyproject.toml` tool / `Cargo.toml` / `Makefile`
- 命令必须从仓库标准入口跑（`npm test` / `pytest` / `cargo test`），不私造
- 找不到 → 报错而不是 fallback

### 3. 跑三档测试

按 TESTPLAN 三栏分别跑（如果运行器支持 tag/path 过滤），不支持就跑全集然后筛结果。

| 档 | 通过线 |
|---|---|
| smoke | 全 ✅，任何失败 = 整体失败 |
| persona (novice/power-user/adversarial) | 全 ✅；adversarial 失败往往是 bug |
| regression（PLAN Affected Files 涉及的现有用例） | 全 ✅，任何失败 = 整体失败 |

### 4. flaky 处理
- TESTPLAN 决议默认 `不重试`：一次失败即失败
- 若 TESTPLAN 显式允许重试 N 次：按 N 次跑，每次都需绿才算 pass
- 任何重试历史写入测试报告

### 5. 输出测试报告

简洁格式（USER.md：用摘要不粘贴日志）：
```
🧪 TESTPLAN-NNN 执行报告（PR-MMM）

运行器：<cmd>
结果：smoke 5/5 ✅ | persona 8/8 ✅ | regression 12/13 ❌

失败：
  ❌ regression: tests/legacy/poll-archive.spec.ts
     — "归档投票仍可读" 失败：返回 404 应为 200
     — 关联：PLAN Affected File src/api/poll.ts:41

执行耗时：23s
flaky 历史：无
```

### 6. 写评论 / 推进状态

| Verdict | 动作 |
|---|---|
| `pass` | 把测试报告作为成功记录附在 PR 评论；通知 `tunan-pr` 推进 PR 池 status → `sponsor_wait` |
| `fail` | 失败摘要作为 PR comment（`gh pr comment <num> --body ...`）；PR 池 status 保持 `testing`，等 coder 修；**不**自动重跑 |

写回 PR 池 frontmatter：`last_test: pass | fail`、`last_test_at`、`last_test_summary`（一行）。

### 7. 回流到 TESTPLAN 池
- pass → 不动 TESTPLAN 池（已在 dev 阶段置 done）
- fail 累计 N 次（默认 3）→ 报告"该 TESTPLAN 持续失败，建议 `/tunan-retro` 复盘是否 PLAN 本身错了"

## 反模式

- ❌ 跑测试就写一堆原始日志 — 用摘要
- ❌ 静默 retry 直到绿 — 违反 flaky=fail 决议
- ❌ 跳过 regression 只跑 smoke — 必须三档全跑
- ❌ 改测试让其变绿 — tester 角色只跑、不改测试（修测试是 coder 在 review 反馈下做）
- ❌ 把测试 stdout 全文塞进 PR 评论 — 摘要 + 关键失败上下文足矣

## 失败处理

- 测试运行器崩（OOM / 段错误）→ 视为 fail，附运行器输出末 50 行
- worktree 缺失 → 报错并提示 `/tunan-prime` 检查 PR 池
- 网络/外部依赖测试失败 → 区分"基础设施失败"vs"代码失败"；前者降级为 retry-once，仍失败标 `infra-fail` 让 sponsor 决定

## 接下来做什么

被 `tunan-pr` 内调：返回 verdict + 报告即可。

直接调用：
```
✅ TESTPLAN-NNN: <pass|fail>

推荐下一步：
  1. ★ /tunan-pr <PR-id>            — 让闭环继续（pass 则进 sponsor_wait；fail 等 coder 修）
  2. /tunan-prime
  3. /tunan-retro <PR-id>           — 仅在 fail 累计多次时
```
