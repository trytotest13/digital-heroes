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
  process.env.DATABASE_URL ||
  process.env.data_POSTGRES_URL ||
  process.env.data_DATABASE_URL ||
  Object.entries(process.env).find(
    ([k]) => (k.endsWith("POSTGRES_URL") || k.endsWith("DATABASE_URL")) && !k.includes("PRISMA_DATABASE_URL")
  )?.[1] ||
  process.env.data_PRISMA_DATABASE_URL;

const connectionString = rawUrl?.replace(/^prisma\+postgres:/, "postgres:");
const isLocal = !connectionString || connectionString.includes("127.0.0.1") || connectionString.includes("localhost");

// When deployed on Vercel or in production without a remote database configured,
// do not attempt connecting to 127.0.0.1 (which doesn't exist in serverless environments).
// Instead, provide a fallback SQL client that immediately rejects queries so the app
// instantly falls back to its built-in demo data without hanging or timing out.
const isServerlessWithoutDb =
  (Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production") && !rawUrl;

function createFallbackSql(): postgres.Sql {
  const handler: any = (..._args: any[]) =>
    Promise.reject(new Error("No database connection configured in production. Using demo data fallback."));

  return new Proxy(handler, {
    get(_target, prop) {
      if (prop === "then") return undefined;
      return handler;
    },
    apply(_target, _thisArg, _argArray) {
      return Promise.reject(new Error("No database connection configured in production. Using demo data fallback."));
    },
  }) as unknown as postgres.Sql;
}

export const sql =
  globalThis.__dhSql ??
  (isServerlessWithoutDb
    ? createFallbackSql()
    : postgres(connectionString || "postgres://postgres:postgres@127.0.0.1:54329/postgres", {
        prepare: false,
        max: 10,
        ssl: isLocal ? false : "require",
        connect_timeout: 4,
        idle_timeout: 20,
      }));

if (process.env.NODE_ENV !== "production") globalThis.__dhSql = sql;

export default sql;
