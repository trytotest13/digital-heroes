/**
 * Local development database — an in-process Postgres (PGlite) speaking the
 * real wire protocol on 127.0.0.1:54329. Lets the full app run and be tested
 * without Docker or a hosted Supabase project. Production uses Supabase's
 * Postgres via DATABASE_URL; nothing else changes.
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(here, "..", "supabase", "migrations", "001_init.sql");

const db = new PGlite();
await db.exec(readFileSync(schemaPath, "utf8"));
console.log("Schema applied.");

const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 54329, maxConnections: 10 });
await server.start();
console.log("Postgres listening on postgres://postgres:postgres@127.0.0.1:54329/postgres");
