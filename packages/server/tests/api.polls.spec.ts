import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

function makeApp() {
  const db = openDb(":memory:");
  const app = createApp(db);
  return { app, db };
}

async function postJson(app: ReturnType<typeof createApp>, path: string, body: unknown) {
  return app.fetch(
    new Request("http://x" + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/polls", () => {
  it("I-1 happy path returns shortCode of length 8", async () => {
    const { app } = makeApp();
    const res = await postJson(app, "/api/polls", {
      title: "周末去哪",
      options: ["杭州", "成都"],
      mode: "single",
    });
    expect(res.status).toBe(200);
    const j = (await res.json()) as { shortCode: string; shareUrl: string };
    expect(j.shortCode).toMatch(/^[0-9A-Za-z]{8}$/);
    expect(j.shareUrl).toContain(j.shortCode);
  });

  it("I-2 empty title → 400 validation_failed/title", async () => {
    const { app } = makeApp();
    const res = await postJson(app, "/api/polls", {
      title: "",
      options: ["a", "b"],
      mode: "single",
    });
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: string; field: string };
    expect(j.error).toBe("validation_failed");
    expect(j.field).toBe("title");
  });

  it("I-3 only one option → 400 validation_failed/options", async () => {
    const { app } = makeApp();
    const res = await postJson(app, "/api/polls", {
      title: "x",
      options: ["a"],
      mode: "single",
    });
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: string; field: string };
    expect(j.field).toBe("options");
  });

  it("I-4 trims + dedupes options before storing", async () => {
    const { app } = makeApp();
    const res = await postJson(app, "/api/polls", {
      title: "x",
      options: ["杭州", " 杭州 ", "成都"],
      mode: "single",
    });
    expect(res.status).toBe(200);
    const { shortCode } = (await res.json()) as { shortCode: string };
    const get = await app.fetch(new Request("http://x/api/polls/" + shortCode));
    const data = (await get.json()) as { options: { label: string }[] };
    expect(data.options.map((o) => o.label)).toEqual(["杭州", "成都"]);
  });
});

describe("GET /api/polls/:shortCode", () => {
  it("I-5 returns poll + options + zero results", async () => {
    const { app } = makeApp();
    const create = await postJson(app, "/api/polls", {
      title: "T",
      options: ["a", "b"],
      mode: "single",
    });
    const { shortCode } = (await create.json()) as { shortCode: string };
    const res = await app.fetch(new Request("http://x/api/polls/" + shortCode));
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      title: string;
      options: unknown[];
      totalVotes: number;
      results: { count: number }[];
    };
    expect(j.title).toBe("T");
    expect(j.options).toHaveLength(2);
    expect(j.totalVotes).toBe(0);
    expect(j.results.every((r) => r.count === 0)).toBe(true);
  });

  it("I-6 unknown shortCode → 404", async () => {
    const { app } = makeApp();
    const res = await app.fetch(new Request("http://x/api/polls/NOPE0000"));
    expect(res.status).toBe(404);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe("not_found");
  });
});
