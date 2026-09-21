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

export const sql =
  globalThis.__dhSql ??
  postgres(process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:54329/postgres", {
    prepare: false,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalThis.__dhSql = sql;

export default sql;
