import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { runFullSeed } from "@/lib/full-seed";

export const dynamic = "force-dynamic";

/**
 * Re-seeds the demo data. Open in development; in production this must
 * never be callable anonymously, so it requires an admin session.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }
  try {
    await runFullSeed(sql);
    const [users] = await sql<{ count: string }[]>`select count(*)::text as count from users`;
    const [charities] = await sql<{ count: string }[]>`select count(*)::text as count from charities`;
    const [draws] = await sql<{ count: string }[]>`select count(*)::text as count from draws`;
    const [winners] = await sql<{ count: string }[]>`select count(*)::text as count from winners`;

    return NextResponse.json({
      success: true,
      message: "Database successfully seeded with comprehensive demo data!",
      stats: {
        users: Number(users?.count ?? 0),
        charities: Number(charities?.count ?? 0),
        draws: Number(draws?.count ?? 0),
        winners: Number(winners?.count ?? 0),
      },
    });
  } catch (error: any) {
    console.error("Seed API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
