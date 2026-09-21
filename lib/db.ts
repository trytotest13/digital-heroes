import postgres from "postgres";

/**
 * Single shared Postgres client.
 *
 * `prepare: false` keeps this compatible with Supabase's transaction-mode
 * connection pooler, which is what serverless deployments (Vercel) should use.
 */
declare global {
  // eslint-disable-next-line no-var
  var __dhSql: postgres.Sql | undefined;
}

const rawUrl =
  process.env.DATABASE_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

const connectionString = rawUrl?.replace(/^prisma\+postgres:/, "postgres:");
const isLocal = !connectionString || connectionString.includes("127.0.0.1") || connectionString.includes("localhost");

export const sql =
  globalThis.__dhSql ??
  postgres(connectionString || "postgres://postgres:postgres@127.0.0.1:54329/postgres", {
    prepare: false,
    max: 10,
    ssl: isLocal ? false : "require",
    connect_timeout: 10,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") globalThis.__dhSql = sql;

export default sql;
