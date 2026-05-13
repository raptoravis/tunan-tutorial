import { Hono } from "hono";
import type { DB } from "./db.js";
import { genShortCode } from "./shortcode.js";
import { normalizeOptions, ValidationError } from "./options.js";
import { aggregateResults, type OptionRow } from "./results.js";

interface CreateBody {
  title?: unknown;
  options?: unknown;
  mode?: unknown;
}

interface VoteBody {
  optionIds?: unknown;
}

function bad(field: string, error = "validation_failed") {
  return { error, field };
}

export function createApp(db: DB) {
  const app = new Hono();

  app.get("/healthz", (c) => c.text("ok"));

  app.post("/api/polls", async (c) => {
    let body: CreateBody;
    try {
      body = (await c.req.json()) as CreateBody;
    } catch {
      return c.json(bad("body"), 400);
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title.length === 0 || title.length > 120) {
      return c.json(bad("title"), 400);
    }
    if (!Array.isArray(body.options)) return c.json(bad("options"), 400);

    let normalized: string[];
    try {
      normalized = normalizeOptions(
        (body.options as unknown[]).map((x) => String(x ?? "")),
      );
    } catch (e) {
      if (e instanceof ValidationError) {
        return c.json(bad(e.field), 400);
      }
      throw e;
    }
    if (normalized.length < 2 || normalized.length > 20) {
      return c.json(bad("options"), 400);
    }
    const mode = body.mode === "multi" ? "multi" : "single";

    // 3 retries on shortcode collision
    let shortCode = "";
    let pollId = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      shortCode = genShortCode();
      try {
        const ins = db.prepare(
          "INSERT INTO polls (short_code, title, mode) VALUES (?, ?, ?)",
        );
        const res = ins.run(shortCode, title, mode);
        pollId = Number(res.lastInsertRowid);
        break;
      } catch {
        if (attempt === 2) {
          return c.json({ error: "internal" }, 500);
        }
      }
    }

    const insOpt = db.prepare(
      "INSERT INTO options (poll_id, label, idx) VALUES (?, ?, ?)",
    );
    normalized.forEach((label, i) => insOpt.run(pollId, label, i));

    return c.json({
      id: pollId,
      shortCode,
      shareUrl: `/p/${shortCode}`,
    });
  });

  app.get("/api/polls/:shortCode", (c) => {
    const code = c.req.param("shortCode");
    const poll = db
      .prepare("SELECT * FROM polls WHERE short_code = ?")
      .get(code) as
      | { id: number; short_code: string; title: string; mode: string; created_at: string }
      | undefined;
    if (!poll) return c.json({ error: "not_found" }, 404);

    const options = db
      .prepare("SELECT id, label, idx FROM options WHERE poll_id = ? ORDER BY idx ASC")
      .all(poll.id) as OptionRow[];
    const votes = db
      .prepare("SELECT option_id as optionId FROM votes WHERE poll_id = ?")
      .all(poll.id) as { optionId: number }[];

    const agg = aggregateResults(options, votes);
    return c.json({
      shortCode: poll.short_code,
      title: poll.title,
      mode: poll.mode,
      createdAt: poll.created_at,
      options,
      totalVotes: agg.totalVotes,
      results: agg.results,
    });
  });

  app.post("/api/polls/:shortCode/vote", async (c) => {
    const code = c.req.param("shortCode");
    const poll = db
      .prepare("SELECT id, mode FROM polls WHERE short_code = ?")
      .get(code) as { id: number; mode: string } | undefined;
    if (!poll) return c.json({ error: "not_found" }, 404);

    let body: VoteBody;
    try {
      body = (await c.req.json()) as VoteBody;
    } catch {
      return c.json(bad("body"), 400);
    }
    if (!Array.isArray(body.optionIds) || body.optionIds.length === 0) {
      return c.json(bad("optionIds"), 400);
    }
    const optionIds = (body.optionIds as unknown[])
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x));

    if (optionIds.length === 0) return c.json(bad("optionIds"), 400);
    if (poll.mode === "single" && optionIds.length !== 1) {
      return c.json(bad("optionIds"), 400);
    }

    const placeholders = optionIds.map(() => "?").join(",");
    const owned = db
      .prepare(
        `SELECT id FROM options WHERE poll_id = ? AND id IN (${placeholders})`,
      )
      .all(poll.id, ...optionIds) as { id: number }[];
    if (owned.length !== optionIds.length) {
      return c.json({ error: "option_mismatch" }, 400);
    }

    const ins = db.prepare(
      "INSERT INTO votes (poll_id, option_id) VALUES (?, ?)",
    );
    for (const oid of optionIds) ins.run(poll.id, oid);

    const options = db
      .prepare("SELECT id, label, idx FROM options WHERE poll_id = ? ORDER BY idx ASC")
      .all(poll.id) as OptionRow[];
    const votes = db
      .prepare("SELECT option_id as optionId FROM votes WHERE poll_id = ?")
      .all(poll.id) as { optionId: number }[];

    const agg = aggregateResults(options, votes);
    return c.json({
      totalVotes: agg.totalVotes,
      results: agg.results,
    });
  });

  return app;
}
