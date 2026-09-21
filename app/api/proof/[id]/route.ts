import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProof } from "@/lib/winners";

/**
 * Serves a winner's proof screenshot. Accessible to the winner themselves
 * and to admins — nobody else.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const proof = await getProof(id);
  if (!proof) return new NextResponse("Not found", { status: 404 });
  if (user.role !== "admin" && user.id !== proof.user_id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const name = proof.proof_name ?? "proof";
  const ext = name.split(".").pop()?.toLowerCase();
  const type =
    ext === "pdf" ? "application/pdf" : ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";

  return new NextResponse(new Uint8Array(proof.proof), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `inline; filename="${name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
