export const dynamic = "force-dynamic";
import Link from "next/link";
import { listCharities } from "@/lib/charities";
import { CharityCard } from "@/components/charity-card";
import { Reveal } from "@/components/reveal";
import { CharityFilters } from "@/components/charity-filters";

export const metadata = { title: "Charities" };

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const charities = await listCharities({ search: q, category });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="kicker animate-fade-up mb-3">Directory</p>
      <h1 className="animate-fade-up [animation-delay:80ms] font-display text-[36px] font-bold sm:text-[48px]">Causes worth playing for.</h1>
      <p className="animate-fade-up [animation-delay:160ms] mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
        Every subscriber directs part of their fee to one of these organisations.
        Pick the one that means something to you.
      </p>

      <Reveal delay={200}>
        <CharityFilters q={q} category={category} />
      </Reveal>

      {charities.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="font-display text-[18px] font-bold">No charities match that search.</p>
          <p className="mt-1 text-[14px] text-muted">Try a different term or clear the filters.</p>
          <Link href="/charities" className="btn btn-outline btn-sm mt-4">Clear filters</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {charities.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 70}>
              <CharityCard id={c.id} name={c.name} category={c.category} tagline={c.tagline} featured={c.featured} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
