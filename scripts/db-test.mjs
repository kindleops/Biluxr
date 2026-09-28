#!/usr/bin/env node
/**
 * Spins up a throwaway local Postgres, applies the Supabase auth shim, every
 * migration, and the seed, then runs the database test suite (RLS, triggers,
 * RPCs) against it. Requires PostgreSQL 15+ server binaries on the machine.
 *
 *   npm run test:db
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, chownSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const port = Number(process.env.BILUXR_TEST_PG_PORT ?? 54329);

function findBin(name) {
  const candidates = [
    "/usr/lib/postgresql/17/bin",
    "/usr/lib/postgresql/16/bin",
    "/usr/lib/postgresql/15/bin",
    "/opt/homebrew/bin",
    "/usr/local/bin",
  ];
  for (const dir of candidates) if (existsSync(path.join(dir, name))) return path.join(dir, name);
  return name;
}

const isRoot = typeof process.getuid === "function" && process.getuid() === 0;
function run(bin, args) {
  if (isRoot)
    return execFileSync("runuser", ["-u", "postgres", "--", bin, ...args], { stdio: "pipe" });
  return execFileSync(bin, args, { stdio: "pipe" });
}

const dataDir = mkdtempSync(path.join(tmpdir(), "biluxr-pg-"));
if (isRoot) {
  const uid = Number(execFileSync("id", ["-u", "postgres"]).toString().trim());
  const gid = Number(execFileSync("id", ["-g", "postgres"]).toString().trim());
  chownSync(dataDir, uid, gid);
}

let started = false;
async function main() {
  run(findBin("initdb"), [
    "-D",
    dataDir,
    "-U",
    "postgres",
    "--auth=trust",
    "--no-sync",
    "-E",
    "UTF8",
  ]);
  run(findBin("pg_ctl"), [
    "-D",
    dataDir,
    "-w",
    "-o",
    `-p ${port} -k ${dataDir} -c listen_addresses='' -c fsync=off`,
    "-l",
    path.join(dataDir, "log"),
    "start",
  ]);
  started = true;

  const admin = new pg.Client({ host: dataDir, port, user: "postgres", database: "postgres" });
  await admin.connect();
  await admin.query("drop database if exists biluxr_test");
  await admin.query("create database biluxr_test");
  await admin.end();

  const db = new pg.Client({ host: dataDir, port, user: "postgres", database: "biluxr_test" });
  await db.connect();
  const apply = async (file) => {
    try {
      await db.query(readFileSync(file, "utf8"));
    } catch (error) {
      console.error(`\n✗ Failed applying ${path.relative(root, file)}\n`);
      throw error;
    }
  };
  await apply(path.join(root, "supabase/tests/auth_shim.sql"));
  const migrations = readdirSync(path.join(root, "supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of migrations) {
    await apply(path.join(root, "supabase/migrations", file));
    console.log(`✓ migration ${file}`);
  }
  await apply(path.join(root, "supabase/seed.sql"));
  console.log("✓ seed");
  await db.end();

  if (process.argv.includes("--gen-types")) {
    const result = spawnSync(process.execPath, [path.join(root, "scripts/gen-db-types.mjs")], {
      stdio: "inherit",
      env: {
        ...process.env,
        PGHOST: dataDir,
        PGPORT: String(port),
        PGUSER: "postgres",
        PGDATABASE: "biluxr_test",
      },
    });
    return result.status ?? 1;
  }

  const testFiles = readdirSync(path.join(root, "tests/db"))
    .filter((f) => f.endsWith(".test.mjs"))
    .map((f) => path.join(root, "tests/db", f));
  const result = spawnSync(process.execPath, ["--test", "--test-concurrency=1", ...testFiles], {
    stdio: "inherit",
    env: {
      ...process.env,
      PGHOST: dataDir,
      PGPORT: String(port),
      PGUSER: "postgres",
      PGDATABASE: "biluxr_test",
    },
  });
  return result.status ?? 1;
}

let code = 1;
try {
  code = await main();
} catch (error) {
  console.error(error);
  code = 1;
} finally {
  if (started) {
    try {
      run(findBin("pg_ctl"), ["-D", dataDir, "-m", "immediate", "stop"]);
    } catch {
      /* already stopped */
    }
  }
  rmSync(dataDir, { recursive: true, force: true });
}
process.exit(code);
