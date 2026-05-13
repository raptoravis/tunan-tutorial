import { serve } from "@hono/node-server";
import { openDb } from "./db.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 4123);
const db = openDb(process.env.DB_FILE ?? "./data.sqlite");
const app = createApp(db);

console.log(`[server] node ${process.version} pid=${process.pid} db=${process.env.DB_FILE ?? "./data.sqlite"}`);
serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[server] listening on http://localhost:${info.port}`);
});
