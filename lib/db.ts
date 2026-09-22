import postgres from "postgres";

/**
 * Single shared Postgres client.
 *
 * Configured for maximum compatibility with Supabase (both Direct and Connection Pooler)
 * as well as Vercel Postgres and local PGlite.
 *
 * - `prepare: false` is required for Supabase transaction-mode poolers (port 6543 / Supavisor).
 * - `ssl: { rejectUnauthorized: false }` ensures TLS connections don't fail certificate chain verification in serverless runtimes.
 * - `connect_timeout: 15` allows enough time for cloud database cold starts.
 */
declare global {
  // eslint-disable-next-line no-var
  var __dhSql: postgres.Sql | undefined;
}

function resolveDatabaseUrl(): string | undefined {
  // Check known connection string variables
  const direct =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_POSTGRES_URL ||
    process.env.data_POSTGRES_URL ||
    process.env.data_DATABASE_URL ||
    Object.entries(process.env).find(
      ([k]) =>
        (k.endsWith("POSTGRES_URL") || k.endsWith("DATABASE_URL")) &&
        !k.includes("PRISMA_DATABASE_URL")
    )?.[1] ||
    process.env.data_PRISMA_DATABASE_URL;

  if (direct) return direct;

  // Check individual Vercel Postgres / Supabase parameters
  if (process.env.POSTGRES_HOST && process.env.POSTGRES_USER) {
    const host = process.env.POSTGRES_HOST;
    const user = encodeURIComponent(process.env.POSTGRES_USER);
    const pass = encodeURIComponent(process.env.POSTGRES_PASSWORD || "");
    const db = process.env.POSTGRES_DATABASE || "postgres";
    const port = process.env.POSTGRES_PORT || 5432;
    return `postgres://${user}:${pass}@${host}:${port}/${db}?sslmode=require`;
  }

  return undefined;
}

const rawUrl = resolveDatabaseUrl();
const connectionString = rawUrl?.replace(/^prisma\+postgres:/, "postgres:");
const isLocal =
  !connectionString ||
  connectionString.includes("127.0.0.1") ||
  connectionString.includes("localhost");

const isServerlessWithoutDb =
  (Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production") && !rawUrl;

function createFallbackSql(): postgres.Sql {
  const handler: any = (..._args: any[]) =>
    Promise.reject(
      new Error("No database connection configured in production. Using demo data fallback.")
    );

  return new Proxy(handler, {
    get(_target, prop) {
      if (prop === "then") return undefined;
      return handler;
    },
    apply(_target, _thisArg, _argArray) {
      return Promise.reject(
        new Error("No database connection configured in production. Using demo data fallback.")
      );
    },
  }) as unknown as postgres.Sql;
}

export const sql =
  globalThis.__dhSql ??
  (isServerlessWithoutDb
    ? createFallbackSql()
    : postgres(connectionString || "postgres://postgres:postgres@127.0.0.1:54321/postgres", {
        prepare: false,
        max: isLocal ? 1 : 10,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        connect_timeout: 15,
        idle_timeout: 20,
      }));

if (process.env.NODE_ENV !== "production") globalThis.__dhSql = sql;

// If connected to a remote database (e.g. Supabase on Vercel), lazily ensure schema is initialized
if (!isLocal && !isServerlessWithoutDb && typeof window === "undefined") {
  import("./init-db")
    .then((m) => m.ensureDbInitialized())
    .catch((err) => console.error("Initial schema check notice:", err));
}

export default sql;
