import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

function app() {
  return createApp(openDb(":memory:"));
}

async function createPoll(a: ReturnType<typeof app>, title = "T") {
  const res = await a.fetch(
    new Request("http://x/api/polls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, options: ["A", "B"], mode: "single" }),
    }),
  );
  const { shortCode } = (await res.json()) as { shortCode: string };
  const d = await a.fetch(new Request("http://x/api/polls/" + shortCode));
  const { options } = (await d.json()) as { options: { id: number }[] };
  return { shortCode, optionId: options[0]!.id };
}

async function vote(
  a: ReturnType<typeof app>,
  code: string,
  optionId: number,
  cookie?: string,
) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers["cookie"] = cookie;
  return a.fetch(
    new Request("http://x/api/polls/" + code + "/vote", {
      method: "POST",
      headers,
      body: JSON.stringify({ optionIds: [optionId] }),
    }),
  );
}

function extractCookie(res: Response): string {
  const sc = res.headers.get("Set-Cookie")!;
  return sc.split(";")[0]!;
}

describe("cookie dedupe", () => {
  it("D-1 first vote sets cookie", async () => {
    const a = app();
    const { shortCode, optionId } = await createPoll(a);
    const res = await vote(a, shortCode, optionId);
    expect(res.status).toBe(200);
    expect(res.headers.get("Set-Cookie")).toMatch(/voted_polls=/);
  });

  it("D-2 second vote with cookie → 409 already_voted", async () => {
    const a = app();
    const { shortCode, optionId } = await createPoll(a);
    const r1 = await vote(a, shortCode, optionId);
    const cookie = extractCookie(r1);
    const r2 = await vote(a, shortCode, optionId, cookie);
    expect(r2.status).toBe(409);
    const j = (await r2.json()) as { error: string };
    expect(j.error).toBe("already_voted");
  });

  it("D-3 no cookie → can vote again (known limitation)", async () => {
    const a = app();
    const { shortCode, optionId } = await createPoll(a);
    await vote(a, shortCode, optionId);
    const r2 = await vote(a, shortCode, optionId); // no cookie
    expect(r2.status).toBe(200);
  });

  it("D-4 cookie scoped per poll", async () => {
    const a = app();
    const A = await createPoll(a, "A");
    const B = await createPoll(a, "B");
    const r1 = await vote(a, A.shortCode, A.optionId);
    const cookie = extractCookie(r1);
    const r2 = await vote(a, B.shortCode, B.optionId, cookie);
    expect(r2.status).toBe(200);
  });

  it("D-5 cookie accumulates across polls; revisit blocked", async () => {
    const a = app();
    const A = await createPoll(a, "A");
    const B = await createPoll(a, "B");
    const r1 = await vote(a, A.shortCode, A.optionId);
    const c1 = extractCookie(r1);
    const r2 = await vote(a, B.shortCode, B.optionId, c1);
    const c2 = extractCookie(r2);
    const r3 = await vote(a, A.shortCode, A.optionId, c2);
    expect(r3.status).toBe(409);
  });
});
