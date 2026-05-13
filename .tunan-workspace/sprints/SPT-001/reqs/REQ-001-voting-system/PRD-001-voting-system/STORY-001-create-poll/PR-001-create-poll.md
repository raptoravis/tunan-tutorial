---
id: PR-001
title: STORY-001 创建投票（含 monorepo 脚手架）
owner: raptoravis
status: reviewing
created: 2026-05-13
updated: 2026-05-13
source_id: TESTPLAN-001
gh_pr: 18
branch: tunan/dev/STORY-001-raptoravis-v2
worktree: .tunan-workspace/worktrees/STORY-001-raptoravis-v2
base: test
url: https://github.com/raptoravis/tunan-tutorial/pull/18
pipeline_defaults_applied:
  - branch_suffix=v2 (source: A4 非破坏性远端残留避开)
---

# PR-001 STORY-001 创建投票

## 端到端范围

铺 pnpm workspace + Hono/node:sqlite/Vite/React 脚手架；落地 `POST /api/polls` 与 `GET /api/polls/:id`；web 端 CreatePage + PollPage（仅展示）。

## Test Evidence
- server: 10 / 10 vitest 用例通过
- web: 4 / 4 vitest 用例通过
- typecheck: clean
- smoke: 健康检查 + 创建 + 404 验证通过

## H2 等待

进入 `sponsor_wait` 后由 tunan-pr 闭环跑 review + test，再等 sponsor LGTM。
