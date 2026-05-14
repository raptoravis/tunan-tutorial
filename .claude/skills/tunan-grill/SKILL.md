---
name: tunan-grill
description: tunan 追问 / 拷问 skill。把模糊陈述拆成可枚举候选（再交给 tunan-align 决策）。当 sponsor 给的信息含糊到无法 top3 时用。触发：/tunan-grill、"再问问"、"我说不清"、"帮我梳理"。
---

# tunan-grill — 追问拷问

> **何时用**：sponsor 给的输入太模糊以至于 `tunan-align` 都凑不出 3 个像样候选；或某个 artifact 字段本身有 2 个含义需要拆。

## 调用语法

```
/tunan-grill <主题|artifact-id>
/tunan-grill -- <一段模糊陈述>
```

## 协议

### 不做开放提问

- ❌ "你想要什么样的体验？"
- ❌ "性能要求是什么？"

### 做的：一次只问一个非此即彼的问题

```
**Q1**: 投票截止后再投，是想让用户：
  A. ★ 完全无法操作（按钮置灰）
  B. 看到错误提示后被动等
  C. 自动转到结果页

回 A/B/C，或自由文本。
```

每次 ≤ 1 个 Q，每个 Q 必须 2-3 选 + ★默认 + 自由文本。

### 拆模糊陈述的套路

模糊陈述："性能要快"

拆成：
- Q1：用户感知的"快"是哪个动作？(★加载首页 / 点提交 / 切投票)
- Q2：阈值？(★ < 1s / < 200ms / 用户不抱怨即可)
- Q3：覆盖率？(★ p95 / p50 / 最差用户)

每个 Q 单独问。

### 何时退出

- sponsor 连续给出 ≥ 3 个具体决议 → 把汇总交给 `tunan-align` 完成对齐
- sponsor 说"差不多了"/"先这样"→ 把已有决议落盘到 artifact 的 Decisions 表，剩余进 Open Questions

## 写回原 artifact

每问完一组 → 把决议追加到原 artifact（REQ/PRD/...）的 **Decisions** 或 **Open Questions** 表，标 `来源：grill`。

## 反模式

- ❌ 一次问 5 个 — sponsor 会懵；一次只问 1 个
- ❌ 没有 ★默认 — 违反 USER.md 选择题原则
- ❌ 让 sponsor 写长答案 — 永远拆成选项
- ❌ 自己脑补答案不问 sponsor — 该问就问

## 接下来做什么

```
✅ Grill 完成，决议已写回 <artifact-id>。

推荐下一步：
  1. ★ /tunan-align <artifact-id>   — 完成剩余对齐
  2. /tunan-<回到原 skill>           — 继续推进
  3. /tunan-prime
```
