# tunan-tutorial — 轻量投票系统

源自 [REQ-001](.tunan-workspace/sprints/SPT-001/reqs/REQ-001-voting-system/REQ-001-voting-system.md) → [PRD-001](.tunan-workspace/sprints/SPT-001/reqs/REQ-001-voting-system/PRD-001-voting-system/PRD-001-voting-system.md)。

## 开发

需要 Node ≥ 22（本机 v24 测过）+ pnpm ≥ 10。

```bash
pnpm install

# 起后端（:4123）
pnpm -F server dev

# 起前端（:5173，自动 proxy /api → :4123）
pnpm -F web dev

# 跑后端单测
pnpm -F server test
```

## 当前 STORY

- [x] STORY-001 创建投票房间
- [ ] STORY-002 参与投票（多选）
- [ ] STORY-003 实时结果
- [ ] STORY-004 追加候选项
- [ ] STORY-005 房间管理

## 数据库

SQLite 文件落在 `./data/voting.sqlite`，可被环境变量 `VOTING_DB_PATH` 覆盖。
表：`rooms` / `options` / `votes`。
