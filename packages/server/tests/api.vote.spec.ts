import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

function makeApp() {
  const db = openDb(":memory:");
  return createApp(db);
}

async function createPoll(app: ReturnType<typeof createApp>) {
  const res = await app.fetch(
    new Request("http://x/api/polls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "T",
        options: ["A", "B"],
        mode: "single",
      }),
    }),
  );
  const j = (await res.json()) as { shortCode: string };
  const get = await app.fetch(new Request("http://x/api/polls/" + j.shortCode));
  const data = (await get.json()) as { options: { id: number; label: string }[] };
  return { shortCode: j.shortCode, options: data.options };
}

async function vote(
  app: ReturnType<typeof createApp>,
  shortCode: string,
  optionIds: number[],
) {
  return app.fetch(
    new Request("http://x/api/polls/" + shortCode + "/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ optionIds }),
    }),
  );
}

describe("POST /api/polls/:shortCode/vote", () => {
  it("I-7 happy single vote", async () => {
    const app = makeApp();
    const { shortCode, options } = await createPoll(app);
    const res = await vote(app, shortCode, [options[0]!.id]);
    expect(res.status).toBe(200);
    const j = (await res.json()) as { totalVotes: number; results: { optionId: number; count: number }[] };
    expect(j.totalVotes).toBe(1);
    const winner = j.results.find((r) => r.optionId === options[0]!.id)!;
    expect(winner.count).toBe(1);
  });

  it("I-8 empty optionIds → 400", async () => {
    const app = makeApp();
    const { shortCode } = await createPoll(app);
    const res = await vote(app, shortCode, []);
    expect(res.status).toBe(400);
    const j = (await res.json()) as { field: string };
    expect(j.field).toBe("optionIds");
  });

  it("I-9 optionId not in this poll → 400 option_mismatch", async () => {
    const app = makeApp();
    const { shortCode } = await createPoll(app);
    const res = await vote(app, shortCode, [9999]);
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe("option_mismatch");
  });

  it("I-10 unknown shortCode → 404", async () => {
    const app = makeApp();
    const res = await vote(app, "NOPE0000", [1]);
    expect(res.status).toBe(404);
  });

  it("I-11 three votes A,A,B → A ranks before B", async () => {
    const app = makeApp();
    const { shortCode, options } = await createPoll(app);
    await vote(app, shortCode, [options[0]!.id]);
    await vote(app, shortCode, [options[0]!.id]);
    const res = await vote(app, shortCode, [options[1]!.id]);
    const j = (await res.json()) as { results: { optionId: number; count: number }[] };
    expect(j.results[0]!.optionId).toBe(options[0]!.id);
    expect(j.results[0]!.count).toBe(2);
    expect(j.results[1]!.optionId).toBe(options[1]!.id);
    expect(j.results[1]!.count).toBe(1);
  });
});
