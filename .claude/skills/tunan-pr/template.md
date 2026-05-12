---
id: PR-NNN
title:
owner:
kind: feature
status: reviewing    # reviewing → testing → sponsor_wait → merged | failed
created:
updated:
source_id:           # 对应 TESTPLAN-NNN
priority: P2
blocked_by: []
gh_pr:               # GitHub PR 号
worktree:            # .tunan-workspace/worktrees/<id>-<owner>
branch:              # tunan/<stage>/<id>-<owner>
---

# PR-NNN: <标题>

## Summary
<1-3 句：为何 + 做了什么>

## Changes
- <文件/模块 维度的变更摘要>

## Test Evidence
- TESTPLAN-NNN 的执行结果摘要 / 截图 / 日志摘要

## Reviewer Checklist
- [ ] 逻辑正确
- [ ] 无新增技术债
- [ ] 错误处理覆盖

## Sponsor Checklist
- [ ] 行为符合 REQ/PRD 意图
- [ ] 可接受合并到 dev

## 接下来做什么
1. ★ `/tunan-pr <PR-id>` 推一轮自驱动循环
2. `/tunan-pr <PR-id> --watch` 持续轮询评论
3. sponsor approve 后 `/tunan-merge <PR-id>`
