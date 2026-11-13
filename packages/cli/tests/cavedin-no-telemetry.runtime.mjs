// [cavedin] Telemetry is stripped from this fork. These tests fail loudly if an
// upstream merge brings any sender back.
import { test } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "dist", "index.js");

function run(argv, env) {
  return new Promise((resolve) => {
    const child = spawn("node", [cli, ...argv], { env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ code, out }));
  });
}

test("no telemetry request leaves the CLI, even when asked to turn it on", async () => {
  const hits = [];
  const server = createServer((req, res) => { hits.push(`${req.method} ${req.url}`); res.end(); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const home = mkdtempSync(join(tmpdir(), "cavedin-home-"));
  const env = { ...process.env, HOME: home, CAVEMAN_HOME: join(home, ".caveman"),
    CAVEMAN_TELEMETRY_URL: `http://127.0.0.1:${server.address().port}/t`, CAVEMAN_TELEMETRY: "1" };
  delete env.DO_NOT_TRACK; delete env.CI;
  for (const argv of [["telemetry", "on"], ["version"], ["telemetry", "status"]]) await run(argv, env);
  await new Promise((r) => setTimeout(r, 1500)); // detached senders would land here
  server.close();
  assert.deepStrictEqual(hits, []);
  const status = JSON.parse((await run(["telemetry", "status"], env)).out);
  assert.strictEqual(status.enabled, false);
});

test("the built CLI contains no telemetry endpoint", () => {
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  for (const file of walk(join(root, "dist"))) {
    assert.ok(!/supabase\.co\/functions\/v1\/(cli|blocks)-telemetry/.test(readFileSync(file, "utf8")), file);
  }
});
