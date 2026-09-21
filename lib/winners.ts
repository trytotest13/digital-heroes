import sql from "./db";
import { TIER_LABEL } from "./format";

/**
 * Winner verification: winners upload a screenshot of their scores as
 * proof, an admin approves or rejects, and payouts move pending → paid.
 */

export type WinnerRow = {
  id: string;
  draw_id: string;
  user_id: string;
  tier: number;
  amount_pence: number;
  verification: "pending" | "approved" | "rejected";
  payment_status: "pending" | "paid";
  proof_name: string | null;
  has_proof: boolean;
  created_at: Date;
  period: string;
  full_name: string;
  email: string;
};

export async function myWinners(userId: string) {
  return sql<WinnerRow[]>`
    select w.id, w.draw_id, w.user_id, w.tier, w.amount_pence, w.verification,
           w.payment_status, w.proof_name, (w.proof is not null) as has_proof, w.created_at,
           d.period, u.full_name, u.email
    from winners w
    join draws d on d.id = w.draw_id
    join users u on u.id = w.user_id
    where w.user_id = ${userId}
    order by d.period desc`;
}

export async function listWinnersAdmin() {
  return sql<WinnerRow[]>`
    select w.id, w.draw_id, w.user_id, w.tier, w.amount_pence, w.verification,
           w.payment_status, w.proof_name, (w.proof is not null) as has_proof, w.created_at,
           d.period, u.full_name, u.email
    from winners w
    join draws d on d.id = w.draw_id
    join users u on u.id = w.user_id
    order by w.created_at desc`;
}

export async function getProof(winnerId: string) {
  const [row] = await sql<{ proof: Buffer; proof_name: string | null; user_id: string }[]>`
    select proof, proof_name, user_id from winners where id = ${winnerId} and proof is not null limit 1`;
  return row;
}

export async function uploadProof(winnerId: string, userId: string, file: File) {
  const winner = await sql<{ user_id: string; verification: string; payment_status: string }[]>`
    select user_id, verification, payment_status from winners where id = ${winnerId} limit 1`;
  if (!winner.length || winner[0].user_id !== userId) return { error: "Winner record not found." };
  if (winner[0].verification === "approved" || winner[0].payment_status === "paid") {
    return { error: "This prize has already been verified." };
  }
  if (file.size === 0) return { error: "Choose a screenshot to upload." };
  if (file.size > 5 * 1024 * 1024) return { error: "Proof must be smaller than 5 MB." };
  const okTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!okTypes.includes(file.type)) {
    return { error: "Upload a PNG, JPEG, WebP or PDF file." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await sql`
    update winners
    set proof = ${buffer}, proof_name = ${file.name || "proof"}, verification = 'pending', updated_at = now()
    where id = ${winnerId}`;
  return {};
}

export async function setVerification(winnerId: string, value: "approved" | "rejected") {
  await sql`update winners set verification = ${value}, updated_at = now() where id = ${winnerId}`;
}

export async function markPaid(winnerId: string) {
  // Payouts can only complete on approved proofs — enforced here, not just UI.
  const [row] = await sql<{ verification: string }[]>`
    select verification from winners where id = ${winnerId} limit 1`;
  if (!row || row.verification !== "approved") {
    return { error: "Only approved winners can be marked as paid." };
  }
  await sql`update winners set payment_status = 'paid', updated_at = now() where id = ${winnerId}`;
  return {};
}

export async function winningsSummary(userId: string) {
  const [row] = await sql<{ total: number; pending: number; paid: number }[]>`
    select
      coalesce(sum(amount_pence), 0)::int as total,
      coalesce(sum(case when payment_status = 'pending' then amount_pence else 0 end), 0)::int as pending,
      coalesce(sum(case when payment_status = 'paid' then amount_pence else 0 end), 0)::int as paid
    from winners where user_id = ${userId}`;
  return row ?? { total: 0, pending: 0, paid: 0 };
}

export function tierLabel(tier: number): string {
  return TIER_LABEL[tier] ?? `${tier}-number match`;
}
