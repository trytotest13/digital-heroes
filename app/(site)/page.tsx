import Link from "next/link";
import { featuredCharities } from "@/lib/charities";
import { inr, TIER_PCT } from "@/lib/format";
import { CharityCard } from "@/components/charity-card";
import { Reveal } from "@/components/reveal";
import { BorderBeam } from "@/components/lightswind/border-beam";
import { ShineButton } from "@/components/lightswind/shine-button";
import { NumberTicker } from "@/components/lightswind/number-ticker";
import { Marquee } from "@/components/lightswind/marquee";
import { BentoGrid, BentoCard } from "@/components/lightswind/bento-grid";

/**
 * Homepage. Leads with the cause, one prominent subscribe CTA.
 * The hero plays a short load sequence: copy fades up, then the five
 * example draw numbers pop in one by one, like balls being drawn.
 */

const tiers = [
  { match: "5-number match", pct: TIER_PCT[5], note: "Jackpot — rolls over if unclaimed" },
  { match: "4-number match", pct: TIER_PCT[4], note: "Split equally between winners" },
  { match: "3-number match", pct: TIER_PCT[3], note: "Split equally between winners" },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const charities = await featuredCharities(3);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-pine/20 bg-mist/60 px-3.5 py-1 text-[12px] font-semibold text-pine">
              <span className="h-2 w-2 rounded-full bg-pine animate-pulse" />
              Golf performance, with a conscience
            </div>
            <h1 className="animate-fade-up [animation-delay:80ms] mt-4 font-display text-[38px] font-bold leading-[1.06] text-ink sm:text-[54px] lg:text-[62px]">
              Play with<br />
              <span className="bg-gradient-to-r from-pine via-pine to-pine-light bg-clip-text text-transparent">
                purpose.
              </span>
            </h1>
            <p className="animate-fade-up [animation-delay:160ms] mt-5 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
              Track your golf scores, enter the monthly draw, and put part of every
              subscription behind a cause you actually care about.
            </p>
            <div className="animate-fade-up [animation-delay:240ms] mt-7 flex flex-wrap items-center gap-3">
              <ShineButton href="/signup" variant="primary" className="h-12 px-7 text-[15px]">
                Start playing
              </ShineButton>
              <Link href="/charities" className="btn btn-outline h-12 px-6 text-[15px]">
                Explore charities
              </Link>
            </div>
            <p className="animate-fade-up [animation-delay:320ms] mt-4 text-[13px] text-muted">
              Your subscription funds prizes and charitable giving — you choose the cause.
            </p>
          </div>

          {/* Example month card with Lightswind BorderBeam */}
          <div className="animate-fade-up [animation-delay:350ms] card relative overflow-hidden p-6 shadow-sm sm:p-7">
            <BorderBeam size={160} duration={8} colorFrom="#173d35" colorTo="#d8a15d" />
            <div className="flex items-center justify-between">
              <p className="kicker">How a month works</p>
              <span className="badge-green">Monthly draw</span>
            </div>
            <p className="mt-4 font-display text-[24px] font-bold leading-tight text-ink sm:text-[26px]">
              Your five latest scores are your draw numbers.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" aria-hidden="true">
              {[12, 27, 33, 38, 41].map((n, i) => (
                <span
                  key={n}
                  className="chip animate-pop-in shadow-sm"
                  style={{ animationDelay: `${750 + i * 90}ms` }}
                >
                  {n}
                </span>
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

      {/* Live Animated Platform Metrics */}
      <section className="border-y border-line bg-white/70 py-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6">
          <div className="text-center sm:text-left">
            <p className="font-display text-[26px] font-bold text-pine sm:text-[32px]">
              <NumberTicker value={52000} prefix="₹" />
            </p>
            <p className="text-[12px] font-medium text-muted">Current Prize Pool</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-display text-[26px] font-bold text-ink sm:text-[32px]">
              <NumberTicker value={1250} suffix="+" />
            </p>
            <p className="text-[12px] font-medium text-muted">Active Golfers</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-display text-[26px] font-bold text-gold sm:text-[32px]">
              <NumberTicker value={10} suffix=" Causes" />
            </p>
            <p className="text-[12px] font-medium text-muted">Partner Charities</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-display text-[26px] font-bold text-success sm:text-[32px]">
              <NumberTicker value={100} suffix="%" />
            </p>
            <p className="text-[12px] font-medium text-muted">Verified Payouts</p>
          </div>
        </div>
      </section>

      {/* Marquee Ticker: Featured Causes Across India */}
      <section className="overflow-hidden border-b border-line bg-paper/60 py-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="kicker mb-2 text-center text-muted">Supported Causes &amp; Partners</p>
        </div>
        <Marquee className="[--duration:28s]" pauseOnHover={true}>
          {[
            { name: "Green Earth Trust", cat: "Environment", icon: "🌱" },
            { name: "Hope Foundation", cat: "Children", icon: "🏫" },
            { name: "Girls Into Golf", cat: "Sports", icon: "⛳" },
            { name: "Mind & Body Wellness", cat: "Health", icon: "🧠" },
            { name: "Fair Play Sports", cat: "Athletics", icon: "🏅" },
            { name: "Wildlife Corridors", cat: "Conservation", icon: "🦌" },
            { name: "Warm Homes Project", cat: "Community", icon: "🏡" },
            { name: "Clean Rivers Initiative", cat: "Ecology", icon: "💧" },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 text-[13px] font-medium text-body shadow-xs transition hover:border-pine hover:text-pine"
            >
              <span>{item.icon}</span>
              <span className="font-semibold">{item.name}</span>
              <span className="rounded-md bg-mist/60 px-1.5 py-0.5 text-[11px] text-pine">{item.cat}</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* What you do — Responsive Bento Grid */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <p className="kicker mb-3">The idea</p>
            <h2 className="font-display text-[28px] font-bold sm:text-[36px]">Your game can do more.</h2>
            <p className="mt-2 max-w-xl text-[15px] text-muted">
              Designed for ease and purpose: everything happens automatically with each round you play.
            </p>
          </Reveal>
          <div className="mt-8">
            <BentoGrid className="auto-rows-[16rem] sm:auto-rows-[18rem]">
              <BentoCard
                kicker="01 · Play"
                name="Enter your scores"
                description="Add your latest Stableford scores in seconds. Your five most recent rounds are always active and automatically snapshot for every monthly draw."
                href="/dashboard"
                cta="View score tracker"
              />
              <BentoCard
                kicker="02 · Win"
                name="Enter the monthly draw"
                description="Every active subscriber is entered automatically. Match 3, 4, or 5 numbers to win a share of the platform's prize pool, with rollovers when jackpots go unclaimed."
                href="/how-it-works"
                cta="How the draw works"
              />
              <BentoCard
                kicker="03 · Give"
                name="Back a cause"
                description="Direct at least 10% of your subscription to a charity of your choice. Adjust your contribution percentage anytime directly from your dashboard."
                href="/charities"
                cta="Browse charities"
              />
            </BentoGrid>
          </div>
        </div>
      </section>

      {/* Where the money goes — labelled as an example, because the split is configurable */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <p className="kicker mb-3">Transparency</p>
          <h2 className="font-display text-[28px] font-bold sm:text-[36px]">Where your subscription goes</h2>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-8 overflow-hidden rounded-3xl border border-line">
            <div className="flex h-16 font-display text-[14px] font-bold">
              <div className="flex w-2/5 items-center justify-center bg-pine text-cream">Prize pool · 40%</div>
              <div className="flex w-[30%] items-center justify-center bg-gold text-ink">Your charity · 10%+</div>
              <div className="flex flex-1 items-center justify-center bg-mist text-pine">Platform · the rest</div>
            </div>
          </div>
        </Reveal>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { title: "Prize pool", body: "A fixed share of every fee funds the monthly prize tiers." },
            { title: "Charity — your choice", body: "Minimum 10% goes to the cause you pick. You can raise it to 30% or more in your dashboard." },
            { title: "Platform", body: "Keeps the lights on — hosting, payments and running the draws." },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 90}>
              <div className="card card-hover h-full p-5">
                <p className="font-display text-[15px] font-bold text-pine">{c.title}</p>
                <p className="mt-1 text-[14px] text-muted">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-4 text-[12px] text-muted">
            Example allocation for illustration — the exact split is configurable by the platform team.
          </p>
        </Reveal>
      </section>

      {/* Charities */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="kicker mb-3">Giving back</p>
                <h2 className="font-display text-[28px] font-bold sm:text-[36px]">Choose a cause.</h2>
              </div>
              <Link href="/charities" className="btn btn-ghost">Explore all charities →</Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {charities.map((c, i) => (
              <Reveal key={c.id} delay={i * 90}>
                <CharityCard
                  id={c.id}
                  name={c.name}
                  category={c.category}
                  tagline={c.tagline}
                  featured={c.featured}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Draw mechanics — dark section for contrast */}
      <section className="bg-ink-surface text-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <p className="kicker mb-3 text-pine-muted">The draw</p>
            <h2 className="font-display text-[28px] font-bold text-cream sm:text-[36px]">One draw. Every month.</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
              A fixed portion of every subscription feeds the prize pool. The split between tiers
              is fixed and enforced automatically — and if nobody claims the jackpot, it rolls over.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {tiers.map((t, i) => (
              <Reveal key={t.match} delay={i * 90}>
                <div className="h-full rounded-2xl border border-ink-border bg-ink-surface p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-pine-muted">{t.match}</p>
                  <p className="mt-3 font-display text-[40px] font-bold text-cream">{Math.round(t.pct * 100)}%</p>
                  <p className="mt-1 text-[13px] text-ink-muted">{t.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="mt-8 rounded-2xl border border-ink-border bg-ink-surface p-5 text-[14px] text-ink-muted">
              <span className="font-semibold text-cream">Prize splitting:</span> multiple winners in the
              same tier share it equally. Entry, draws and payouts are tracked in your dashboard.
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <Reveal>
          <h2 className="font-display text-[32px] font-bold sm:text-[44px]">Ready to play with purpose?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted">
            Pick a plan, choose your cause, and be in this month&apos;s draw.
            {charities.length > 0 && ` ${charities.length} featured causes are waiting.`}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ShineButton href="/signup" variant="primary" className="h-12 px-8 text-[15px]">
              Subscribe Now
            </ShineButton>
            <Link href="/how-it-works" className="btn btn-outline h-12 px-8 text-[15px]">
              How it works
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-muted">
            Plans from {inr(49900)} a month · cancel anytime.
          </p>
        </Reveal>
      </section>
    </div>
  );
}
