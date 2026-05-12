---
name: tunan-req
description: tunan 工作流第一站。把 sponsor 的 raw-req MD 文件（或 --from-conversation 抽取对话 / --from-issue 抓 issue）吸纳为 REQ 池中一条结构化需求。默认要求传入 .tunan-workspace/raw-reqs/ 下的 MD 文件路径；缺省启用 --research。触发：/tunan-req、"开始一个新需求"、"把这个 issue 变成需求"。
---

# tunan-req — 需求入池 skill

> **何时触发**：sponsor 说 `/tunan-req`、"开始新需求"、"把这个 issue 转成 REQ"、"我想做 X"，或当前对话出现明显的需求陈述但还没人入池。

## 调用语法

```
/tunan-req <raw-req.md 路径>          # 默认形态：必须指向一份原始需求 MD 文件
/tunan-req --from-issue <#>           # 或从 GitHub issue 起
/tunan-req --from-conversation        # 或显式从当前对话抽取（必须显式指定，不再是缺省）
```

**默认形态：必须传入 raw-req MD 文件路径**

- 约定位置：`.tunan-workspace/raw-reqs/<YYYY-MM-DD>-<slug>.md`（不存在就先建目录）
- **Why**：所有原始需求统一进 `raw-reqs/` 留痕，可 grep / 可 git blame / 可回溯；同时强制 sponsor 把"一句话"展开成可被自己/他人重读的初稿，鼓励深思熟虑
- skill 启动时先校验路径存在且非空；不存在 → 报错并提示 sponsor 先在 `raw-reqs/` 下落一份草稿
- raw-req 文件本身**没有 frontmatter 要求**，自由文本即可；skill 仍会走第 2 步"抽取原始意图"把它结构化
- 既没有传路径、也没显式指定 `--from-issue` / `--from-conversation` → **直接报错**，不再静默 fallback 到对话抽取

**开关**：
- `--from-conversation` — 显式从当前会话抽取需求（**必须显式传，不再是缺省**）。skill 会在 REQ frontmatter 记 `raw_req_source: conversation`，并提醒 sponsor 这条没有可追溯的原始草稿；建议事后用 `/tunan-cp` 之前手工把抽取到的原文回写一份到 `raw-reqs/` 留痕
- `--from-issue <#>` — 从 GitHub issue 抓取标题/正文/讨论作为输入（用 `gh issue view`）；issue 正文会落档一份到 `raw-reqs/` 做留痕
- `--no-research` — **关掉**默认的社区调研（缺省是开的）
- `--kind=feature|bug|chore` — 指定类型；不传时由 skill 推断并向 sponsor 确认
- `--id=<REQ-NNN>` — 显式 id（默认自动 = `REQ-` + 池中下一序号）
- `--owner=<name>` — 默认 = 当前 git user

**示例**：
```
/tunan-req .tunan-workspace/raw-reqs/2026-05-12-vote-history.md   # 标准形态
/tunan-req --from-issue 42                                        # 从 issue #42（自动落档）
/tunan-req --from-conversation                                    # 显式从对话抽取（不推荐，无草稿留痕）
/tunan-req --kind=chore .tunan-workspace/raw-reqs/2026-05-12-node-lts.md
```

> 想"一路推到 verify" → 用 `/tunan-pipeline <raw-req.md>`（pipeline 内部会调本 skill 起步；`--from-conversation` / `--from-issue` 同样适用）。自然语言"全部默认"/"一路走完"等价 `--pre-auth`，自动跳过 H1 TDD red-gate / H2 PR LGTM；H3 改 SKILL 仍二次确认，merge/verify 失败仍刹车。

## 缺省 research（重要）

**`tunan-req` 默认带 `--research`**，目的是把"sponsor 一句话"接到"业界已有共识/坑/验收基准"上：

- 用 `WebSearch` / `mcp__context7` 搜同类功能的常见实现、典型抱怨、边界条件、可访问性/性能阈值
- 找到的发现 **不能默默放大 scope**：必须分两栏写入 REQ 的 Open Questions / 推荐补充 部分，由 sponsor 选
- 若 sponsor 在调用时显式 `--no-research` 才跳过

## 流程（**开始**先告诉 sponsor 接下来要走的步骤）

> ⚠️ skill **开始**时输出一行："tunan-req 启动：将依次执行 1) 抽取意图 → 2) 社区调研 → 3) top3 对齐 → 4) 写入 REQ 池。中途任意时刻可输入 `全部默认` 或 `accept all` 一键采纳推荐。"

### 1. 检查上下文（防漂移）

- 跑等价于 `tunan-prime` 的最小现状探测：列出当前 REQ 池中 status=ready/in_progress 的条目。如果有 owner==当前用户的未完结条目，提示 sponsor："是否先跑 `/tunan-prime` 看现状？"
- 如对话很长或不确定上下文一致性，**必须**先建议 `/tunan-prime`，再继续。

### 2. 抽取原始意图（不改写、不脑补）

- 来源（按开关定）：
  - 默认：读 `<raw-req.md>` 路径指向的文件
  - `--from-issue <#>`：`gh issue view <#>`，并把正文落档到 `.tunan-workspace/raw-reqs/<YYYY-MM-DD>-issue-<#>.md`
  - `--from-conversation`：从当前会话原话抽取（frontmatter 标 `raw_req_source: conversation`）
  - 三种都没指定 → 报错并提示 sponsor 选一种；**不静默 fallback**
- 输出三段："**用户原话**"（贴 raw-req 关键引文 / 对话原话）、"**我理解的意图**（一句话）"、"**疑点/缺口**（要点列表）"
- 严禁直接进入解决方案；这一步只做 understanding capture

### 3. 推断 kind 并向 sponsor 确认（top 3 + 默认）

```
我推断这是一个 [feature]。请选：
  A. ★ feature  — 新增能力（你没说"修复"或"维护"）
  B. bug        — 现有行为不对
  C. chore      — 升级/重构/无业务行为变化
  其它：自由文本
```

### 4. 社区调研（缺省开）

- 用最佳可用工具：`WebSearch`、`WebFetch`、`mcp__context7__resolve-library-id` + `query-docs`、必要时 `mcp__github__search_*` 找类似 issue/PR
- 目标：3–6 条**可引用**的外部洞察。每条记录：来源 URL / 关键发现 / 对本 REQ 的可能影响
- 把发现归入两类：
  - **直接补强 acceptance criteria**（明确的边界、常见坑，如"a11y 焦点陷阱"、"输入超过 N 字符时崩溃"）
  - **建议追加 goals**（不在 sponsor 原意里、但社区强烈反映的）→ 进入 Open Questions 等 sponsor 拍板

### 5. 起草 REQ artifact（G-010 必填章节）

文件路径：`.tunan-workspace/<REQ-id>-<slug>/<REQ-id>-<slug>.md`（新建 REQ 目录后落 md；REQ-id 与 slug 既作目录名也作文件名）

> 池结构按 REQ→PRD→STORY 嵌套；REQ 是顶层目录，PRD/STORY 后续往 REQ 目录内嵌。详见 tunan-prime "池结构" 节。

frontmatter（G-002 schema）：
```yaml
---
id: REQ-NNN
title: <一句话标题>
owner: <git user>
kind: feature|bug|chore
status: draft           # 起草态；待 top3 对齐通过后改 ready
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
source_id:              # 上游条目 id；本池为空
priority: P2            # 默认 P2，可在第 6 步对齐时改
blocked_by: []
research_done: true|false
raw_req_source: <相对路径 / "conversation" / "issue#<n>">
---
```

正文必含章节（G-010 REQ 模板）：
- **Goals**（编号 G-001..N，每个含 acceptance criteria 复选框）
- **Acceptance Criteria**（goal 内联，或单列一节聚合）
- **Constraints**
- **Non-Goals**
- **Scope Boundary**（in / out 两段）
- **Open Questions**（每条 ≤3 候选 + 1 ★ 默认 + 自由文本）
- **Research Findings**（仅 research 开启时；列表 + 来源 URL）
- **接下来做什么**（见结尾）

### 6. top 3 + 默认推荐 对齐

把所有不确定点都做成 Q 表：
```
| #  | 问题                       | A ★默认            | B                 | C                  |
| Q1 | 优先级？                  | ★ P2 (常规节奏)    | P1 (本 sprint)    | P0 (阻塞中)         |
| Q2 | 是否纳入 research 建议 X？ | ★ 是，记入 G-00n   | 否，进 Non-Goals  | 进 Open Questions  |
| ...|                            |                    |                   |                    |
```

sponsor 可：
- 单条回答："Q1=B、Q3=C、其余默认"
- 一键："全部默认" / "accept all"
- 自由补充："Q2 改成自定义文本…"

### 7. 落盘 + 状态机

- sponsor 决议后，把 REQ 文件 `status: draft → ready`
- 不自己 `commit`/`push`（用户全局规矩：等显式 cp 指令；可提示"用 `/tunan-cp` 提交"）

## confidence 评估

| 级别 | 标准 | 动作 |
|---|---|---|
| HIGH | 所有 goal 有可验证 acceptance；无 open questions；scope 清楚 | 直接 `status: ready` |
| MEDIUM | goal 清晰但部分 acceptance 偏软 / 少量 open questions deferred | `status: ready`，但 Open Questions 留下，下一池 `tunan-prd` 续问 |
| LOW | 意图模糊 / acceptance 缺 / scope 不定 | **不写入 ready**，停在 draft，向 sponsor 报具体阻塞问题 |

## 容易做错的地方（自检）

- **方案泄露**：把"用 Redis"写进 goal；正确做法："API p99 < 200ms"
- **金边过度**：sponsor 没说的功能不要加；研究发现的也只能作为 Open Questions
- **歧义掩盖**：为了避免回去问就标 HIGH——错。LOW 是诚实选项
- **复述原话**："让用户体验更好"原样写进 acceptance——错，必须翻译成可验证条件
- **跨阶段越权**：不写 PRD/STORY/PLAN 的内容；只产出 REQ。下游有专门的 skill

## 失败处理

- `gh issue view` 失败 → 提示 sponsor 检查 `gh auth status`，不静默继续
- research 工具全部不可用 → 自动降级到 `--no-research` 并在 frontmatter 标 `research_done: false`，提示 sponsor
- 写文件冲突（id 已存在）→ 不覆盖，自动加后缀 `-2`，并报告

## 输出（**结束**告诉 sponsor 接下来做什么）

skill 完成时**必须**输出一段，例：

```
✅ REQ-007 已写入 .tunan-workspace/REQ-007-add-vote-history/REQ-007-add-vote-history.md (status: ready)

接下来做什么（按推荐顺序）：
  1. ★ /tunan-prd REQ-007       — 把 REQ 展开成 PRD（默认下一步）
  2. /tunan-cp -- 添加 REQ-007  — 先把 REQ 提交到 git
  3. /tunan-prime                — 看一下整个池现状再决定
  4. 自由：继续别的工作；REQ-007 留在池里等下次 pop-next
```

> 如果 confidence=LOW 或仍有 blocking Open Questions，把"接下来做什么"换成具体的待 sponsor 回答清单。
