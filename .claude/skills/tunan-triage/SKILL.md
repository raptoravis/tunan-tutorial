---
name: tunan-triage
description: tunan 入口分诊。批量处理 GitHub issue / 反馈 / 草稿，分类 + 去重 + 路由到 REQ 池或丢弃。触发：/tunan-triage、"分诊一下未处理 issue"、"清理 issue 池"。
---

# tunan-triage — 入口分诊

> **何时用**：GitHub issue 堆积；多渠道反馈未归整；不确定哪些值得做。

## 调用语法

```
/tunan-triage                              # 默认：拉所有 open issue
/tunan-triage --label=bug                  # 仅 bug
/tunan-triage --since=2026-04-01           # 时间窗
/tunan-triage --from-file=feedback.md      # 从本地文件批量分诊
```

## 流程

### 1. 拉数据
- `gh issue list --state=open --json number,title,body,labels,createdAt,author`
- 或读 `--from-file` 中按 `---` 分隔的反馈条目

### 2. 对每条做分类（top 3 + ★默认）

```
issue #42 "投票后无结果计数"

| #  | 处置                              | 说明                |
| A  | ★ 入 REQ 池 kind=bug              | 明确可复现，P1     |
| B  | 入 REQ 池 kind=feature            | 实为新功能请求     |
| C  | 关闭（duplicate / out-of-scope）  | 已有 REQ-003 跟踪 |
```

可批量决议：sponsor 输入"全部默认"或针对特定 # 改。

### 3. 去重
- 与现有 REQ 池标题做模糊匹配（jaccard 或简单 token 重叠）
- 命中阈值 → 标记 `duplicate_of: REQ-NNN`，**不**新建

### 4. 落盘
- A/B 决议 → 调 `tunan-req --from-issue <#>` 入池
- C 决议 → `gh issue close <#> --comment "<理由>"`

### 5. 出分诊报告
```
分诊 12 条 issue：
  → REQ 池新增 5 (3 bug / 2 feature)
  → 关闭 4 (duplicate / out-of-scope)
  → 待 sponsor 决定 3
```

## 反模式

- ❌ 把所有 issue 都入 REQ 池 — 失去过滤价值
- ❌ 沉默关闭 issue — 必须留 `gh issue close --comment` 给作者交代
- ❌ 不做去重 → REQ 池变冗余

## 接下来做什么

```
✅ 分诊完成。

推荐下一步：
  1. ★ /tunan-prd                — 处理 REQ 池新增项
  2. /tunan-prime                  — 看池整体
  3. /tunan-triage --since=...     — 处理更老的 issue
```
