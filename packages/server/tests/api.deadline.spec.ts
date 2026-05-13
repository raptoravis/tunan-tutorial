import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

function app() {
  return createApp(openDb(":memory:"));
}

async function createPoll(
  a: ReturnType<typeof app>,
  deadline?: string | null,
) {
  const body: Record<string, unknown> = {
    title: "T",
    options: ["A", "B"],
    mode: "single",
  };
  if (deadline !== undefined) body.deadline = deadline;
  const res = await a.fetch(
    new Request("http://x/api/polls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  const { shortCode } = (await res.json()) as { shortCode: string };
  const d = await a.fetch(new Request("http://x/api/polls/" + shortCode));
  const dj = (await d.json()) as { options: { id: number }[]; deadlineAt: string | null };
  return { shortCode, optionId: dj.options[0]!.id, deadlineAt: dj.deadlineAt };
}

async function vote(a: ReturnType<typeof app>, code: string, optionId: number) {
  return a.fetch(
    new Request("http://x/api/polls/" + code + "/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ optionIds: [optionId] }),
    }),
  );
}

describe("deadline", () => {
  it("L-1 omitting deadline → deadlineAt is null and votes always open", async () => {
    const a = app();
    const p = await createPoll(a);
    expect(p.deadlineAt).toBeNull();
    const r = await vote(a, p.shortCode, p.optionId);
    expect(r.status).toBe(200);
  });

  it("L-2 future deadline → vote 200", async () => {
    const a = app();
    const future = new Date(Date.now() + 60_000).toISOString();
    const p = await createPoll(a, future);
    const r = await vote(a, p.shortCode, p.optionId);
    expect(r.status).toBe(200);
  });

  it("L-3 past deadline → vote 423 poll_closed", async () => {
    const a = app();
    const past = new Date(Date.now() - 60_000).toISOString();
    const p = await createPoll(a, past);
    const r = await vote(a, p.shortCode, p.optionId);
    expect(r.status).toBe(423);
    const j = (await r.json()) as { error: string };
    expect(j.error).toBe("poll_closed");
  });

  it("L-4 GET returns deadlineAt", async () => {
    const a = app();
    const future = new Date(Date.now() + 60_000).toISOString();
    const p = await createPoll(a, future);
    expect(p.deadlineAt).toBe(future);
  });
});
