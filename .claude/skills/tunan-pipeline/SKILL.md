---
name: tunan-pipeline
description: tunan 全链路串联 pipeline。从 raw-req MD 文件（或 --from-conversation / --from-issue）一路推到合并（REQ→PRD→STORY→PLAN→TESTPLAN→dev→PR→merge→verify），每环节调对应 skill，每决策点走 tunan-align。等价于"全部默认"一键流。触发：/tunan-pipeline、"一路走完"、"自动跑全流程"。
---

# tunan-pipeline — 一键全流程

> **何时用**：sponsor 信任默认推荐，希望尽量少介入；演示 / 教程；同一类需求重复处理。

> **重要**：这不是替代 sponsor，而是把"全部默认"应用到所有阶段对齐点。任何阶段 sponsor 仍可中断。

## 对齐节点清单（权威清单 — 改 pipeline 行为时必须先改这里）

| #  | 节点                     | 默认行为      | 可被 `--pre-auth` 预授权？ | 来源       |
|----|--------------------------|---------------|-----------------------------------|------------|
| H1 | TDD red-gate            | ⏸ 暂停等 `red ok` | ✅                          | 全局      |
| H2 | PR sponsor approve      | ⏸ 暂停等 GitHub LGTM/approve | ✅                  | 全局      |
| H3 | retro 改 skill 落盘     | ⏸ 暂停二次确认 diff | ❌（质量底线）            | REQ-001 G-005 |
| S1 | 设计/开发阶段失败       | ⏸ 暂停 top3 选项 | ❌                              | RETRO-006 |
| S2 | merge 冲突              | ⏸ 暂停推荐 resolve | ❌                            | RETRO-006 |
| S3 | verify 失败             | ⏸ 暂停推荐 req-new 流 | ❌                         | RETRO-006 |
| A1 | 各 skill 内部决策点     | tunan-align 协议（单字符编号） | ★ 默认自动            | RETRO-007 |
| A2 | 决策点选项菜单格式      | 强制单字符编号 + 组合预列      | —                       | RETRO-007 |

**任何 pipeline 行为变更（新增/移除 pause）必须先回头修这张表 + 标 retro 来源**，
避免后续 retro 又在补漏的边角（来源 RETRO-009）。

## 调用语法

```
/tunan-pipeline <raw-req.md>               # 默认形态：从 raw-req MD 文件起
/tunan-pipeline --from-issue <#>           # 从 issue 起（issue 正文自动落档到 raw-reqs/）
/tunan-pipeline --from-conversation        # 显式从当前对话抽取（必须显式指定，无草稿留痕）
/tunan-pipeline <REQ-id>                   # 从已有 REQ 续推
/tunan-pipeline --stop-at=plan             # 推到 plan 即停（不进 dev）
/tunan-pipeline --no-merge                 # 推到 sponsor_wait 即停（不自动 merge）
/tunan-pipeline --pre-auth                 # 预授权 TDD red-gate + PR LGTM；merge/verify 失败仍刹车
```

> **默认必须传入 raw-req MD 路径**（约定位置 `.tunan-workspace/raw-reqs/<YYYY-MM-DD>-<slug>.md`）。
> **Why**：所有原始需求统一进 `raw-reqs/` 留痕，可追溯；同时强制 sponsor 把"一句话"展开成可被自己/他人重读的初稿，鼓励深思熟虑。
> 既没传路径、也没显式指定 `--from-issue` / `--from-conversation` → **直接报错**，不静默 fallback 到对话抽取。

> 自然语言"全部默认"/"一路走完"等价 `--pre-auth`，pipeline 自动识别。

### 澄清：单跑 `/tunan-pipeline` ≠ `--pre-auth`

裸调 `/tunan-pipeline <raw-req.md>`（或 `<REQ-id>` / `--from-issue` / `--from-conversation`）的 "全程默认" 仅指 **A1 各 skill 内部决策点**（tunan-align 协议的小选项）自动取 ★默认；
**H1 TDD red-gate 与 H2 PR LGTM 仍会暂停等 sponsor 显式放行**。

| 调用方式                                          | A1 内部小选项 | H1 red-gate | H2 PR LGTM |
|--------------------------------------------------|---------------|-------------|------------|
| `/tunan-pipeline <raw-req.md>`                   | ★默认自动     | ⏸ 暂停      | ⏸ 暂停     |
| `/tunan-pipeline --pre-auth <raw-req.md>`        | ★默认自动     | ✅ 跳过      | ✅ 跳过     |
| `/tunan-pipeline --from-conversation`            | ★默认自动     | ⏸ 暂停      | ⏸ 暂停     |
| 对话里说"全部默认"/"一路走完"                    | ★默认自动     | ✅ 跳过      | ✅ 跳过     |

H3（改 SKILL）/ S1-3（设计开发失败 / merge 冲突 / verify 失败）三类 `❌` 节点**不可**被任何方式预授权——见上方权威清单与下方"失败处理"。

## 流程（每步对应一个 skill；每个对齐点 = "全部默认"）

```
[input] → tunan-req
       → tunan-prd
       → tunan-story  (可能 1→N)
       → 对每个 STORY：
            tunan-plan
            tunan-testplan
            tunan-dev   (建 worktree + TDD red-gate + 写代码 + push 起 PR)
            tunan-pr    (闭环跑到 sponsor_wait)
            ⏸ 等 sponsor 显式 approve
            tunan-merge
            tunan-verify
       → 全 STORY done → 整链回写
```

## 不可绕过的人工节点

无论怎么"全默认"，以下节点**必须**等 sponsor 显式决定：

1. **TDD red-gate**：sponsor 显式说 `red ok` 才进产品代码（memory feedback_tdd_red_gate）
2. **PR sponsor approve**：必须 sponsor 在 GitHub 评论 `LGTM` / `合并` / approve
3. **retro 改 skill 落盘**：每次 skill 修改前 sponsor 二次确认

> 这三条是质量底线，pipeline 不能"自动全过"。

**例外 — `--pre-auth`**：可对 (1) TDD red-gate 和 (2) PR sponsor LGTM 预授权；**不可**对 (3) skill 改动预授权。
启用时：
- pipeline 第一行播报 `已识别 pre-auth：hard gates (1)(2) 预授权，(3) 仍需 sponsor 二次确认`
- 在对应 PR 池条目 frontmatter 写：
  ```yaml
  pre_auth:
    by: <git user>
    at: <ISO timestamp>
    scope: [tdd_red_gate, pr_lgtm]
  ```
- 用户自然语言（"不间断"/"中间不要等我确认"/"全部默认"/"accept all"/"一路走完"）等价于 `--pre-auth`，pipeline 应自动识别并启用

merge/verify 失败的刹车仍生效（见下方"合并/验收阶段失败"），pre-auth 不绕过 RETRO-006 防线。（来源 RETRO-007）

## 配置

frontmatter 之外，pipeline 启动时可配：
- `--story-limit=N`：拆出 STORY 数若超过则报错暂停（防失控）
- `--watch-pr`：起 PR 后自动 `--watch` 轮询
- `--parallel`：调 `tunan-parallel-pick` 并行多 STORY

## 进度报告

每过一阶段播一行：
```
[1/8] REQ-007 ready
[2/8] PRD-007 ready
[3/8] 拆出 5 个 STORY (007-011)
[4/8] STORY-007 → PLAN-007 ready
[5/8] STORY-007 → TESTPLAN-007 ready
[6/8] STORY-007 → worktree 建好；🔴 TDD red-gate 等放行
       ⏸ sponsor: red ok
[7/8] STORY-007 → PR-007 起；闭环跑中
       ⏸ sponsor: 在 GitHub 评论 LGTM
[8/8] STORY-007 → merged + verified ✅
[继续 STORY-008...]
```

## 失败处理

### 设计/开发阶段失败（plan / testplan / dev / TDD）
- 暂停 pipeline，报告"在 STORY-007 testplan 阶段失败"
- 给 sponsor top3：A. 修了再继续 / B. 跳过这个 STORY 继续别的 / C. 整个 pipeline abort
- 不静默吞错继续

### 合并 / 验收阶段失败（merge 冲突 / verify 失败）
- **不自动衔接 resolve / 不自动重建 verify**；改为暂停 + 一行报告 + 等 sponsor 显式指令
- 报告形如：
  ```
  ⚠ PR-NNN merge 冲突：base 已变更（与 PR-MMM 重叠）
  推荐：
    1. ★ /tunan-pr-resolve PR-NNN     — 走 rebase + 重新 sanity + force push
    2. /tunan-pipeline --abort         — 放弃此 PR
    自由：你也可以手动处理
  ```
- **Why**（来源 RETRO-006）：本轮 PR-005 sponsor approve 后自动 merge → 冲突 → 自动 resolve → 自动 verify
  一路穿透，sponsor 没有"看一眼 rebase 结果再继续"的机会。merge/verify 是涉及共享状态（主分支）的环节，
  比开发阶段更应该让 sponsor 有刹车窗口。

> 注意：这与"三个不可绕过的人工节点"并列，是**补充**而非替代。

## 反模式

- ❌ 把 pipeline 当全自动 — 三个人工节点不能省
- ❌ 一次跑 20 个 STORY — 设 `--story-limit`
- ❌ 起 5 个 worktree 后 sponsor 失控 — 用 `--parallel` 时配合 `tunan-parallel-pick` 的 max=3

## 接下来做什么

```
[暂停于 ⏸ 节点]
等 sponsor 操作。

推荐：
  1. ★ red ok / LGTM / approve（看暂停在哪个节点）
  2. /tunan-prime                   — 看进度全貌
  3. /tunan-pipeline --abort         — 中止流水线
```
