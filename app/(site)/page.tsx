import Link from "next/link";
import { featuredCharities } from "@/lib/charities";
import { gbp, TIER_PCT } from "@/lib/format";
import { CharityCard } from "@/components/charity-card";

/**
 * Homepage. The PRD is explicit: no golf clichés, lead with the cause,
 * one prominent subscribe CTA. Section numbering ("§ 01") nods to the
 * PRD's own editorial system.
 */

const tiers = [
  { match: "5-number match", pct: TIER_PCT[5], note: "Jackpot — rolls over if unclaimed" },
  { match: "4-number match", pct: TIER_PCT[4], note: "Split equally between winners" },
  { match: "3-number match", pct: TIER_PCT[3], note: "Split equally between winners" },
];

export default async function HomePage() {
  const charities = await featuredCharities(3);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="kicker mb-4">§ 01 · Golf performance, with a conscience</p>
            <h1 className="font-display text-[40px] font-bold leading-[1.05] text-ink sm:text-[56px] lg:text-[64px]">
              Play with<br />purpose.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
              Track your golf scores, enter the monthly draw, and put part of every
              subscription behind a cause you actually care about.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary h-12 px-6 text-[15px]">Start playing</Link>
              <Link href="/charities" className="btn btn-outline h-12 px-6 text-[15px]">Explore charities</Link>
            </div>
            <p className="mt-4 text-[13px] text-muted">
              Your subscription funds prizes and charitable giving — you choose the cause.
            </p>
          </div>

          {/* Example month card — clearly labelled, no invented "live" numbers */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <p className="kicker">How a month works</p>
              <span className="badge-green">Monthly draw</span>
            </div>
            <p className="mt-4 font-display text-[26px] font-bold leading-tight text-ink">
              Your five latest scores are your draw numbers.
            </p>
            <div className="mt-4 flex gap-2">
              {[12, 27, 33, 38, 41].map((n) => (
                <span key={n} className="chip">{n}</span>
              ))}
            </div>
            <div className="mt-5 space-y-2.5 border-t border-line pt-5">
              {tiers.map((t) => (
                <div key={t.match} className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-body">{t.match}</p>
                    <p className="text-[12px] text-muted">{t.note}</p>
                  </div>
                  <p className="font-display text-[18px] font-bold text-pine">{Math.round(t.pct * 100)}%</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-muted">
              Prize tiers are fixed by the platform rules. Match more numbers, win a bigger share of the pool.
            </p>
          </div>
        </div>
      </section>

      {/* What you do */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="kicker mb-3">§ 02 · The idea</p>
          <h2 className="font-display text-[28px] font-bold sm:text-[36px]">Your game can do more.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { tag: "Play", title: "Enter your scores", body: "Add your latest Stableford scores in seconds. Your five most recent rounds are always in play." },
              { tag: "Win", title: "Enter the monthly draw", body: "Every subscriber is in. Match 3, 4 or 5 numbers to win a share of the month's prize pool." },
              { tag: "Give", title: "Back a cause", body: "Direct at least 10% of your subscription to a charity you pick — and raise it whenever you like." },
            ].map((c, i) => (
              <div key={c.tag} className="card p-6 transition duration-200 hover:-translate-y-0.5">
                <p className="kicker">0{i + 1} · {c.tag}</p>
                <h3 className="mt-3 font-display text-[19px] font-bold">{c.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where the money goes — labelled as an example, because the split is configurable */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="kicker mb-3">§ 03 · Transparency</p>
        <h2 className="font-display text-[28px] font-bold sm:text-[36px]">Where your subscription goes</h2>
        <div className="mt-8 overflow-hidden rounded-3xl border border-line">
          <div className="flex h-16 font-display text-[14px] font-bold">
            <div className="flex w-2/5 items-center justify-center bg-pine text-cream">Prize pool · 40%</div>
            <div className="flex w-[30%] items-center justify-center bg-amber text-ink">Your charity · 10%+</div>
            <div className="flex flex-1 items-center justify-center bg-mist text-pine">Platform · the rest</div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <p className="font-display text-[15px] font-bold text-pine">Prize pool</p>
            <p className="mt-1 text-[14px] text-muted">A fixed share of every fee funds the monthly prize tiers.</p>
          </div>
          <div className="card p-5">
            <p className="font-display text-[15px] font-bold text-pine">Charity — your choice</p>
            <p className="mt-1 text-[14px] text-muted">Minimum 10% goes to the cause you pick. You can raise it to 30% or more in your dashboard.</p>
          </div>
          <div className="card p-5">
            <p className="font-display text-[15px] font-bold text-pine">Platform</p>
            <p className="mt-1 text-[14px] text-muted">Keeps the lights on — hosting, payments and running the draws.</p>
          </div>
        </div>
        <p className="mt-4 text-[12px] text-muted">
          Example allocation for illustration — the exact split is configurable by the platform team.
        </p>
      </section>

      {/* Charities */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker mb-3">§ 04 · Giving back</p>
              <h2 className="font-display text-[28px] font-bold sm:text-[36px]">Choose a cause.</h2>
            </div>
            <Link href="/charities" className="btn btn-ghost">Explore all charities →</Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {charities.map((c) => (
              <CharityCard
                key={c.id}
                id={c.id}
                name={c.name}
                category={c.category}
                tagline={c.tagline}
                featured={c.featured}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Draw mechanics — dark section for contrast */}
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="kicker mb-3 text-sage">§ 05 · The draw</p>
          <h2 className="font-display text-[28px] font-bold text-cream sm:text-[36px]">One draw. Every month.</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#a9b3ae]">
            A fixed portion of every subscription feeds the prize pool. The split between tiers
            is fixed and enforced automatically — and if nobody claims the jackpot, it rolls over.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {tiers.map((t) => (
              <div key={t.match} className="rounded-2xl border border-[#2a3432] bg-[#161d1c] p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sage">{t.match}</p>
                <p className="mt-3 font-display text-[40px] font-bold text-cream">{Math.round(t.pct * 100)}%</p>
                <p className="mt-1 text-[13px] text-[#a9b3ae]">{t.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-[#2a3432] bg-[#161d1c] p-5 text-[14px] text-[#a9b3ae]">
            <span className="font-semibold text-cream">Prize splitting:</span> multiple winners in the
            same tier share it equally. Entry, draws and payouts are tracked in your dashboard.
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-[32px] font-bold sm:text-[44px]">Ready to play with purpose?</h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted">
          Pick a plan, choose your cause, and be in this month&apos;s draw.
          {charities.length > 0 && " There are " + charities.length + " featured causes waiting."}
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/signup" className="btn btn-primary h-12 px-8 text-[15px]">Subscribe</Link>
          <Link href="/how-it-works" className="btn btn-outline h-12 px-8 text-[15px]">How it works</Link>
        </div>
        <p className="mt-4 text-[13px] text-muted">
          Plans from {gbp(999)} a month · cancel anytime.
        </p>
      </section>
    </div>
  );
}
