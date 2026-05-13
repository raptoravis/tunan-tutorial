import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

function app() {
  return createApp(openDb(":memory:"));
}

async function create(a: ReturnType<typeof app>, mode: "single" | "multi") {
  const res = await a.fetch(
    new Request("http://x/api/polls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "T", options: ["A", "B"], mode }),
    }),
  );
  const { shortCode } = (await res.json()) as { shortCode: string };
  const detail = await a.fetch(new Request("http://x/api/polls/" + shortCode));
  const d = (await detail.json()) as {
    mode: string;
    options: { id: number }[];
  };
  return { shortCode, options: d.options, mode: d.mode };
}

async function vote(a: ReturnType<typeof app>, code: string, ids: number[]) {
  return a.fetch(
    new Request("http://x/api/polls/" + code + "/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ optionIds: ids }),
    }),
  );
}

describe("multi mode", () => {
  it("M-1 creates poll with mode=multi", async () => {
    const a = app();
    const { mode } = await create(a, "multi");
    expect(mode).toBe("multi");
  });

  it("M-2 multi vote records each option once", async () => {
    const a = app();
    const { shortCode, options } = await create(a, "multi");
    const res = await vote(a, shortCode, [options[0]!.id, options[1]!.id]);
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      totalVotes: number;
      results: { optionId: number; count: number }[];
    };
    expect(j.totalVotes).toBe(2);
    expect(j.results.find((r) => r.optionId === options[0]!.id)!.count).toBe(1);
    expect(j.results.find((r) => r.optionId === options[1]!.id)!.count).toBe(1);
  });

  it("M-3 multi rejects empty optionIds with 400/optionIds", async () => {
    const a = app();
    const { shortCode } = await create(a, "multi");
    const res = await vote(a, shortCode, []);
    expect(res.status).toBe(400);
    const j = (await res.json()) as { field: string };
    expect(j.field).toBe("optionIds");
  });

  it("M-4 single rejects multiple optionIds with 400/optionIds", async () => {
    const a = app();
    const { shortCode, options } = await create(a, "single");
    const res = await vote(a, shortCode, [options[0]!.id, options[1]!.id]);
    expect(res.status).toBe(400);
    const j = (await res.json()) as { field: string };
    expect(j.field).toBe("optionIds");
  });

  it("M-5 single still accepts exactly one optionId", async () => {
    const a = app();
    const { shortCode, options } = await create(a, "single");
    const res = await vote(a, shortCode, [options[0]!.id]);
    expect(res.status).toBe(200);
  });
});
