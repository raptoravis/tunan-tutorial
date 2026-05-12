---
name: tunan-tdd
description: tunan 强制 TDD red-gate。在写产品代码前，必须先把 TESTPLAN 中的失败测试写出来并跑红，sponsor 显式放行才能进入产品代码。tunan-dev 缺省内调本 skill。触发：/tunan-tdd、其他 skill 间接调用。
---

# tunan-tdd — Red-Gate

> **核心约束**（来自 memory feedback_tdd_red_gate）：tests-first 必须落地为**真实可跑**的测试代码且**呈现真实红状态**；sponsor 必须**显式放行**才能写任何产品代码。**缺省强制开启，不接受默契式跳过。**

## 何时被调用

- 直接：sponsor 说 `/tunan-tdd <TESTPLAN-id>`
- **间接（主要）**：`tunan-dev` 在第 4 步内调
- bug 修复：`tunan-diagnose` 复现 bug 时也走本 skill 写"复现测试"

## 协议（red-gate 五条铁律）

1. **真测试**：必须是项目测试运行器能跑的代码（jest/pytest/cargo test/...），不接受伪代码 / TODO / `pending`
2. **真红**：必须实际跑测试运行器并捕获红色输出；只写测试不跑 = 不算
3. **覆盖 TESTPLAN**：smoke + persona + regression 三类各至少 1 条；TESTPLAN 中标 P0 的全部覆盖
4. **不写产品代码**：只动测试文件、fixture、mock；任何产品代码改动直接拒绝（哪怕"为了让测试编译过"也只能加最小 stub）
5. **sponsor 显式放行**：必须收到 `red ok` / `proceed` / `放行` 等明确指令才进入下一步

## 流程

### 1. 进入 worktree
- 在 `tunan-dev` 创建的 worktree 内工作；不在主仓库根写

### 2. 探测测试运行器
- 读 `package.json` / `pyproject.toml` / `Cargo.toml` 等找命令
- 输出："本仓库测试命令：`<cmd>`"，让 sponsor 一眼看到将跑什么
- 找不到 → 询问 sponsor，**不脑补默认**

### 3. 起测试候选（基于 TESTPLAN）
- 列出将创建/修改的测试文件
- 每个测试一句话说明对应 TESTPLAN 哪条
- 内调 `tunan-align`：
  - Q1 测试覆盖度（★全 P0）
  - Q2 mock 策略（★最小 mock，倾向真实）

### 4. 写测试 + 跑

```
（写测试文件）
$ <test command>
... FAIL: 5 / 5
```

捕获实际输出（摘要，不全文）。

### 5. 出红状态报告

```
🔴 TDD Red 状态报告（TESTPLAN-NNN）

测试运行器：<cmd>
新增测试文件：
  - tests/vote.spec.ts    (3 用例)
  - tests/poll.spec.ts    (2 用例)

红色用例：
  ❌ 创建投票 — 标题超长应返回 400
  ❌ 投一票 — 重复提交应返回 409
  ❌ 看结果 — 计数应即时更新（issue REQ-003 复现）
  ❌ 截止后投票 — 应返回 410
  ❌ 单选约束 — 多选应返回 400

5 红 / 5 总。无任何绿/黄/skip。

⚠️ sponsor 必须显式放行才能写产品代码：
  回复 "red ok" / "proceed" / "放行" 进入第 6 步
  回复 "改 X" 调整测试再来一遍
```

### 6. 等待放行

- 收到放行 → 把控制权交回 `tunan-dev` 写产品代码
- 收到调整意见 → 改测试 → 重跑 → 重出红状态报告
- **不接受沉默放行**（沉默 = 等待）

### 7. 绿灯阶段（可选 follow-up）

`tunan-dev` 写完产品代码后再次调 `tunan-tdd --green-check`：
- 重跑同一组测试
- 输出绿状态报告：5/5 绿
- 任意红 → 回 `tunan-dev` 修，不放行进入 PR

## 反模式（自检）

- ❌ "测试已写但还没跑" — 不算红，必须跑
- ❌ 测试只 assert(true) — 不是真红
- ❌ 跳过 sponsor 放行直接写产品代码 — 违反 red-gate 第 5 条
- ❌ 一次写 50 个测试 — 颗粒度过大，先 P0 几条进 red-gate
- ❌ 测试代码里偷偷调用产品代码新接口 — 引入未实现的依赖会把"红"伪装成"编译失败" → 必须 stub 占位

## 何时**关闭** TDD（仅这两种）

1. `tunan-dev --no-tdd`：sponsor 显式声明，且 PR body 必须写明原因
2. 纯 docs / 配置 / 脚本无可写测试的改动：自动豁免（脚本应在 PR body 写明）

任何 feature/bug 代码改动：**绝不豁免**。

## 接下来做什么

被内调时（主要场景）：把 red 状态报告交回 `tunan-dev`，不输出"接下来做什么"。

直接调用时：
```
🔴 红状态已记录到 worktree。

推荐下一步：
  1. ★ 等 sponsor 回复 "red ok" 进入产品代码
  2. /tunan-align — 如果 sponsor 想调测试覆盖度
  3. /tunan-prime
```
