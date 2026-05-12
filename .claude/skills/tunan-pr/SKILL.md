---
name: tunan-pr
description: tunan PR 自驱动闭环编排器。一次调用 = 拉评论 → review → coder 修 → test → 直到稳定态进入 sponsor_wait。--watch 子模式纯本地轮询 gh CLI 评论，无云端 daemon。触发：/tunan-pr、"推一轮 PR-xxx"、"看下 PR 进度"。
---

# tunan-pr — PR 自驱动闭环

> **核心理念**（来自 reqs/req.md §65 与 REQ-001 G-004）：reviewer/tester/coder/sponsor 形成 AI 自我驱动闭环；评论触发更新；不需人盯每一步；sponsor 任何时刻可介入。

## 调用语法

```
/tunan-pr                            # pop-next：选 PR 池中状态非 merged/failed 的下一项
/tunan-pr <PR-id>
/tunan-pr <PR-id> --watch [<秒>]    # 本地轮询；默认 60 秒一轮
/tunan-pr list / show / block / unblock
```

## 闭环一轮做什么（一次 `/tunan-pr <PR-id>` 调用）

```
fetch 评论
  ↓
有 sponsor APPROVE / "LGTM" / "合并"？
  ├─ 是 → 进入 sponsor_wait → 推荐 /tunan-merge → 结束
  └─ 否 ↓
有未消费的新评论（reviewer/tester/sponsor）？
  ├─ 是 → coder 修改 + push → 回到顶端再来一次
  └─ 否 ↓
PR 池 status == reviewing？
  └─ 是 → 调 tunan-review → verdict 写回 → 视情况进 testing 或保持 reviewing
PR 池 status == testing？
  └─ 是 → 调 tunan-test → verdict 写回 → 通过则进 sponsor_wait，失败则回 reviewing 等 coder
稳定态 → 进入 sponsor_wait → 播报"等评论；用 /tunan-pr <id> 再跑或 --watch 持续轮询"
```

## 详细流程

### 1. 加载 PR 上下文
- 读 PR 池条目（worktree / branch / gh_pr / source_id 链路）
- `gh pr view <num> --json state,reviewDecision,comments,updatedAt`
- 读上一轮 frontmatter `last_review` / `last_test` / `last_seen_comment_at`

### 2. 检测 sponsor approve
- `reviewDecision == APPROVED`，或
- 有评论包含 `LGTM` / `合并` / `approve` / `通过`（不区分大小写），由 sponsor 之外的非机器账号也算？默认仅 sponsor / git-user
- 命中 → PR 池 `status: sponsor_wait → 自动调 /tunan-merge <PR-id>`，不停留在本 skill

### 3. 消费新评论
- 与 `last_seen_comment_at` 比对
- 新评论中：
  - **来自 reviewer 自己（机器评论）**：跳过（已经在上一轮处理）
  - **sponsor / 其他人的评论**：作为 coder 修改输入
- 调 coder 流程（隐式 `tunan-dev` 的代码段）：
  - 读评论 → 在 worktree 内修改 → 跑 `tunan-test`（仅 smoke）做最快冒烟 → `git push`
  - PR 池更新 `last_seen_comment_at`
- 修完之后**继续本轮**而不是退出（评论修复必须紧跟一轮 review/test 重新评估）

### 4. 推进状态
按状态机：

| 当前 status | 上一轮 last_review | 上一轮 last_test | 本轮动作 |
|---|---|---|---|
| reviewing | none / changes_requested | — | 调 tunan-review |
| reviewing | pass | — | status → testing |
| testing | pass | none / fail | 调 tunan-test |
| testing | pass | pass | status → sponsor_wait |

### 5. 稳定态判定
- review pass + test pass + 无未消费评论 + 无 sponsor approve → `sponsor_wait`
- 播报：
  ```
  PR-NNN 进入 sponsor_wait。
    review:  pass (3 NIT 仅参考)
    test:    pass (smoke 5 / persona 8 / regression 12)
    评论:    全部已处理
  请 sponsor 在 GitHub PR 评论 LGTM/合并 后再跑 /tunan-pr，或 /tunan-pr <id> --watch 自动检测。
  ```

### 6. `--watch` 子模式
- 进入循环：每 N 秒（默认 60）重跑步骤 1-5
- 只在「检测到变化」时才做实际工作（评论新增 / commit 新增）
- Ctrl-C 退出
- 检测到 sponsor approve 自动转 `tunan-merge` 后退出循环
- 不开后台 daemon；这是前台阻塞循环

## 自驱动循环不变量

- 每轮都把所有**外部状态**（GitHub 评论 / commit）拉一次，不靠记忆
- 每轮结束写回 PR 池 frontmatter；下一轮从 frontmatter 起步
- 评论的"已消费"以 `last_seen_comment_at` 时间戳为准（保守取最近一次本机处理时间）
- 任何步骤失败 → 把失败摘要写为 PR comment，PR 池 status 转 `failed`，结束本轮

## 反模式

- ❌ 一轮内只跑 review 不跑 test（pass 时应主动推进 status）
- ❌ 把"机器自己的评论"当未消费 → 死循环
- ❌ `--watch` 间隔过短（< 30s）→ 频繁打 GitHub API
- ❌ sponsor 评论了但 status 不重置 reviewing → coder 不会修

## 接下来做什么

```
✅ 一轮完成。PR-NNN 当前 status: <s>

推荐下一步：
  1. ★ /tunan-pr <PR-id>           — 再跑一轮
  2. /tunan-pr <PR-id> --watch     — 持续轮询
  3. /tunan-pr-resolve <PR-id>     — 仅 status=failed 时（修冲突/CI 红）
  4. /tunan-prime
```
