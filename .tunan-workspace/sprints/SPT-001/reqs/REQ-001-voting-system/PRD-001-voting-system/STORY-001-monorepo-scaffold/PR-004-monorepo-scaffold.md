---
id: PR-004
title: STORY-001 monorepo scaffold
owner: raptoravis
source_id: TESTPLAN-001
status: reviewing
created: 2026-05-13
updated: 2026-05-13
gh_pr: 15
worktree: .tunan-workspace/worktrees/STORY-001-raptoravis-v3
branch: tunan/dev/STORY-001-raptoravis-v3
base: test
---

# PR-004 — STORY-001 monorepo scaffold

- GitHub PR: https://github.com/raptoravis/tunan-tutorial/pull/15
- Base: `test`
- Head: `tunan/dev/STORY-001-raptoravis-v3`

## TDD Evidence

- 🔴 red：`health.spec.ts` Cannot find module `../src/index.js`（sponsor 已 `red ok`）
- 🟢 green：写 `src/db.ts` + `src/index.ts` 后 2/2 通过
- 🟢 smoke：`curl http://localhost:4123/api/health` → `{"ok":true,"db":"ok"}`

## Pass Criteria

按 TESTPLAN-001：smoke S-1..S-5 + Functional F-1..F-2 通过即可。
