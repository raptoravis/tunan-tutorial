---
id: PR-003
title: STORY-003 查看投票详情 PR
owner: raptoravis
source_id: TESTPLAN-003
status: reviewing
created: 2026-05-13
updated: 2026-05-13
gh_pr: TBD
branch: tunan/dev/STORY-003-raptoravis
base: test
worktree: .tunan-workspace/worktrees/STORY-003-raptoravis
priority: P2
blocked_by: []
---

# PR-003 — STORY-003 查看投票详情

## TDD Evidence
Red 7/26 → 产品代码后 26/26 全绿。

## Test Evidence
- server: 18/18（含 GET /api/polls/:id + getPoll 两组）
- web: 8/8（含 PollPage 加载/成功/404 三态）
