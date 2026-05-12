---
name: tunan-takeover
description: tunan 显式接管池条目。把某 id 的 owner 改为当前 git user（多人协作下 A 缺席时 B 接手）。触发：/tunan-takeover、"接手 STORY-007"、"我接 PR-005"。
---

# tunan-takeover — 接管 owner

> **背景**（REQ-001 G-006）：池条目默认按 owner 粘性分发；A 起的需求由 A 跟到底；A 缺席时 B 显式接手。

## 调用语法

```
/tunan-takeover <id>                          # 接管为当前 git user
/tunan-takeover <id> --to=<other-owner>       # 改派给指定人
/tunan-takeover <id> --reason=...              # 写理由（可选）
```

## 前置

- `<id>` 必须存在于某池
- 被接管条目状态非 `done` / `merged`（已完成的不需接管）

## 流程

### 1. 读条目
- 找 `<id>` 在哪个池
- 读 frontmatter `owner` / `status` / `transfer_log`（如有）

### 2. 防止误接管
若 `status == in_progress` 且 `owner != 当前 user`：

```
⚠️ STORY-007 当前 owner=alice，status=in_progress
  最近更新：2 小时前

| #  | 操作                                  | 说明                              |
| A  | ★ 联系 alice 确认（不接管）            | 安全；避免双线工作                 |
| B  | 强制接管（写 transfer_log）           | alice 真的不在；记录留痕           |
| C  | 取消                                  | 想错了                           |
```

`B` 时必须有 `--reason`，否则拒绝。

### 3. 改 owner
- frontmatter `owner: <new>`
- frontmatter `transfer_log:`（追加而非覆盖）：
  ```yaml
  transfer_log:
    - from: alice
      to: jonli
      at: 2026-05-10T14:32:00
      reason: alice 出差，PR 卡 5 天未推
  ```
- `updated: <today>`

### 4. 联动 worktree（仅当 STORY/PR 池且有活跃 worktree）
- 分支命名含旧 owner → 提示 sponsor：
  - ★ 默认 重命名分支：`tunan/dev/STORY-007-alice` → `tunan/dev/STORY-007-jonli`（`git branch -m`）
  - 备选 不改（保留可追溯性）
- worktree 路径 `worktrees/STORY-007-alice` → `worktrees/STORY-007-jonli`（`git worktree move`）

### 5. 通知（可选）
- 若条目对应 GitHub PR：在 PR 评论"@alice → @jonli takeover, reason: ..."
- 若有 GitHub issue：assignee 改派

## 反模式

- ❌ 不写 reason 强制接管
- ❌ 接管后旧 owner 还在改（双线作业）— takeover 完成后必须明确旧 owner 停手
- ❌ 接管 done 条目（无意义）
- ❌ 静默改 worktree 路径而不动 frontmatter

## 接下来做什么

```
✅ <id> 已接管：owner=<旧> → <新>

推荐下一步：
  1. ★ /tunan-<对应阶段 skill>   — 继续推进（如 /tunan-pr / /tunan-dev）
  2. /tunan-prime                  — 确认池现状
  3. （可选）通知旧 owner
```
