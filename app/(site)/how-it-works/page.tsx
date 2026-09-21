import Link from "next/link";

export const metadata = { title: "How it works" };

const steps = [
  {
    n: "01",
    title: "Subscribe",
    body: "Pick monthly or yearly. Yearly works out cheaper. Payments run through Stripe in test mode — no real money in this build.",
  },
  {
    n: "02",
    title: "Choose a charity",
    body: "At signup you pick the cause that receives part of your fee. The minimum is 10%, and you can raise it any time in your dashboard.",
  },
  {
    n: "03",
    title: "Add your scores",
    body: "Enter your Stableford scores — one per date, always the latest five. Your five most recent scores become your draw numbers.",
  },
  {
    n: "04",
    title: "Enter the monthly draw",
    body: "When a draw opens, every active subscriber is entered automatically with the numbers from their scores.",
  },
  {
    n: "05",
    title: "Check your results",
    body: "The team runs the draw each month — randomly or weighted by score frequency — simulates it first, then publishes the winning numbers.",
  },
  {
    n: "06",
    title: "Verify your win",
    body: "If you match 3, 4 or 5 numbers, you upload a screenshot of your scores as proof. Once an admin approves it, your payout is marked as paid.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="kicker mb-3">§ Guide</p>
      <h1 className="font-display text-[36px] font-bold sm:text-[48px]">How it works</h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
        Six steps from signup to payout. The short version: play golf, log five scores,
        and your subscription funds both the prize pool and a cause you chose.
      </p>

      <ol className="mt-12 space-y-4">
        {steps.map((s) => (
          <li key={s.n} className="card flex gap-5 p-6">
            <span className="font-mono text-[13px] font-semibold text-[#8a5f27]">{s.n}</span>
            <div>
              <h2 className="font-display text-[19px] font-bold">{s.title}</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-2xl bg-ink p-6 text-cream">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sage">Prize tiers</p>
        <div className="mt-3 grid gap-2 text-[14px] sm:grid-cols-3">
          <p><span className="font-display font-bold">40%</span> · 5-number match</p>
          <p><span className="font-display font-bold">35%</span> · 4-number match</p>
          <p><span className="font-display font-bold">25%</span> · 3-number match</p>
        </div>
        <p className="mt-3 text-[13px] text-[#a9b3ae]">
          A fixed portion of every subscription funds the pool. Prizes split equally within a tier,
          and an unclaimed jackpot rolls into the next draw.
        </p>
      </div>

      <div className="mt-10 text-center">
        <Link href="/signup" className="btn btn-primary h-12 px-8 text-[15px]">Start playing</Link>
      </div>
    </div>
  );
}
