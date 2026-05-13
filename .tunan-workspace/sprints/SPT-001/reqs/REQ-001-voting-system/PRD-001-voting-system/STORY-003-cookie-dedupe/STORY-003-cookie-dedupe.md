---
id: STORY-003
title: 防重复投票（cookie 去重）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
estimate: S
blocked_by: [STORY-001]
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# STORY-003 — 防重复投票（cookie 去重）

**As a** 参与者 Bob，
**I want** 在同一浏览器中无法对同一话题重复投票，
**So that** 一个普通用户不会因好奇连点几下就把结果带歪。

## 范围

- 服务端：投票成功时写 `voter_token` cookie（HttpOnly, SameSite=Lax, Path=/, 6mo, Secure 取决于环境）；cookie 值是一个签名的小 JSON 或 base64 编码，记录已投 poll id 集合（首版可直接用明文 + HMAC 签名）
- 提交端点：先解析 cookie，已包含本 poll id → 返回 409 `{ error: "already_voted" }`
- 前端：投票成功后切换为结果视图并禁用提交按钮；收到 409 时也切换为结果视图 + toast "你已投过此话题"
- 创建页 + 投票页底部加灰字"匿名 cookie 去重，并非强身份认证"

## Acceptance

- **AC-1 单次投票成功** Given 全新浏览器 / When 投票 / Then 200 + Set-Cookie 含 voter_token
- **AC-2 二次提交被拒** Given 已投并带 cookie / When 再次 POST /vote / Then 409 + 结果不变
- **AC-3 清 cookie 可重投（known limitation）** Given 删 cookie 后 / When 再投 / Then 200（验证非强身份）
- **AC-4 跨 poll 不受影响** Given 我对 poll A 投过 / When 对新 poll B 投 / Then 200 正常
- **AC-5 UI 提示** Given 创建页 + 投票页 / Then 均可见"匿名 cookie 去重"灰字

## Dependencies

- STORY-001
