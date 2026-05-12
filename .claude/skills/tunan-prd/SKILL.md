---
name: tunan-prd
description: tunan 工作流第二站：把 REQ 池中的需求展开为 PRD（产品需求文档）。同时承担 PRD 池操作（list/pop-next/show/block）。触发：/tunan-prd、"把 REQ-xxx 写成 PRD"、"开始 PRD 阶段"。
---

# tunan-prd — REQ → PRD

> **何时触发**：sponsor 说 `/tunan-prd`、`/tunan-prd <REQ-id>`、"把 REQ-007 展开 PRD"。

## 调用语法

```
/tunan-prd                                   # = pop-next：从 REQ 池弹出最该做的 ready 项展开
/tunan-prd <REQ-id>                          # 显式对某 REQ 展开
/tunan-prd list [--all-owners] [--status=]   # 列 PRD 池
/tunan-prd show <PRD-id>
/tunan-prd block <PRD-id> --reason=...
/tunan-prd unblock <PRD-id>
```

**开关**：
- `--from=<REQ-id>` — 同 `<REQ-id>` 位置参数
- `--id=<PRD-id>` — 显式 id（默认 `PRD-` + 池下一序号）

## 流程（开始时播报"将依次走 1) prime 检查 → 2) 弹 REQ → 3) 起草 PRD → 4) 对齐 → 5) 入池"）

### 1. prime 检查
- 调 `tunan-prime` 协议（轻量版）：列当前用户在 PRD 池中是否已有 in_progress 项；若有，提示先收尾或 takeover

### 2. 弹 REQ（pop-next 规则，G-002）
- 筛 `req/*.md` 中 `status==ready && blocked_by==[] && (owner==当前 user 或 --any-owner)`
- 按 `priority` 升序、`created` 升序选第一个
- 把该 REQ 的 `status: ready → in_progress`（updated 改今天）

### 3. 起草 PRD（基于本 skill 同目录 `template.md`，G-010 模板）

把 REQ 中的内容映射到 PRD：

| REQ 字段 | PRD 字段 |
|---|---|
| Goals + Acceptance | Background + Acceptance |
| 隐含的人物 | Personas（明确化） |
| Goals 拆细 | Functional Requirements |
| Constraints | Non-Functional Requirements（凡涉及性能/可访问性/安全/可观测/兼容） |
| Open Questions(已决议) | 直接采用，不重提 |
| Open Questions(未决) | 在 PRD 内继续走 align |

**严禁**：把 REQ 没说的功能写进 FR；研究发现仍只能进 Open Questions。

### 4. 对齐（必须内调 `tunan-align`）

每个不确定点走 top3+★默认+accept-all 协议。常见 Q：
- Persona 取舍：哪些是主线 / 哪些是 nice-to-have
- NFR 阈值：性能 / a11y 标准是 WCAG AA 还是 AAA
- 风险接受度：哪些风险接受、哪些必须缓解
- 拆 STORY 的颗粒度暗示

### 5. 入池

- 写 `.tunan-workspace/<REQ-dir>/<PRD-id>-<slug>/<PRD-id>-<slug>.md`
  - `<REQ-dir>` 用 `Glob .tunan-workspace/<source-REQ-id>-*` 解析（每个 REQ 顶层目录唯一）
  - PRD 自己的目录与 md 文件 slug 来自 PRD 标题（不必复制 REQ slug）
- frontmatter `source_id: REQ-NNN`，`status: ready`
- 同步把 REQ 中的 `Decisions` 表追加（来源 = `accept all` / `显式 X`）
- 此时 REQ 池条目仍 `in_progress`（要等到所有衍生 STORY done 后由 verify 链回写为 done）

## confidence 三档（同 tunan-req 风格）

- HIGH：FR/NFR 全可验证、Persona 列表稳定、无 blocking Q → ready
- MEDIUM：少量软指标 / Open Questions deferred → ready，标注待 STORY 阶段细化
- LOW：意图模糊 / FR 稀薄 → 不入池，停 draft，回头补 REQ

## 失败处理

- REQ 池为空 → "REQ 池没东西。`/tunan-req` 起一个？"
- 选中的 REQ frontmatter 损坏 → 报错并提示用户手修；不脑补
- 用户已有同 source_id 的 PRD → 询问是合并还是新增 v2

## 接下来做什么（结束时播报）

```
✅ PRD-NNN 已写入 prd/，status=ready（源 REQ-NNN 已置 in_progress）

推荐下一步：
  1. ★ /tunan-story PRD-NNN  — 拆 STORY
  2. /tunan-grill PRD-NNN     — 仍有疑点继续问
  3. /tunan-cp -- 添加 PRD-NNN — 先提交
  4. /tunan-prime              — 看池现状
```
