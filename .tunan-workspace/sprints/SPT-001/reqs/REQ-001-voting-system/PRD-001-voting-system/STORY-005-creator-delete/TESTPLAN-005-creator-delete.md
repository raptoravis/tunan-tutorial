---
id: TESTPLAN-005
title: 创建者删除 TESTPLAN
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-005
priority: P2
blocked_by: []
---

# TESTPLAN-005
- T-D01 owner 删除 → 200，GET → 404 ✅
- T-D02 无 owner_token → 403 ✅
- T-D03 错 owner_token → 403 ✅
- T-D04 不存在 → 404 ✅
- T-WD1 非 owner 不见按钮 ✅
- T-WD2 owner 见按钮 ✅
- T-WD3 cancel confirm 不 DELETE ✅
- T-WD4 confirm 后 DELETE + onDeleted ✅

Pass: 全过。Regression: server 22 + web 15 不破坏。
