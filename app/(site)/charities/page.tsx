import Link from "next/link";
import { listCharities } from "@/lib/charities";
import { CHARITY_CATEGORIES } from "@/lib/format";
import { CharityCard } from "@/components/charity-card";

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
      <p className="kicker mb-3">§ Directory</p>
      <h1 className="font-display text-[36px] font-bold sm:text-[48px]">Causes worth playing for.</h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
        Every subscriber directs part of their fee to one of these organisations.
        Pick the one that means something to you.
      </p>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search charities…"
          className="input sm:max-w-xs"
          aria-label="Search charities"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <label className="cursor-pointer">
            <input type="radio" name="category" value="" defaultChecked={!category} className="peer sr-only" />
            <span className="flex h-10 items-center rounded-[10px] border border-line px-4 text-[13px] font-semibold transition peer-checked:border-pine peer-checked:bg-pine peer-checked:text-cream">
              All
            </span>
          </label>
          {CHARITY_CATEGORIES.map((cat) => (
            <label key={cat} className="cursor-pointer">
              <input type="radio" name="category" value={cat} defaultChecked={category === cat} className="peer sr-only" />
              <span className="flex h-10 items-center whitespace-nowrap rounded-[10px] border border-line px-4 text-[13px] font-semibold transition peer-checked:border-pine peer-checked:bg-pine peer-checked:text-cream">
                {cat}
              </span>
            </label>
          ))}
        </div>
        <button type="submit" className="btn btn-primary shrink-0">Search</button>
      </form>

      {charities.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="font-display text-[18px] font-bold">No charities match that search.</p>
          <p className="mt-1 text-[14px] text-muted">Try a different term or clear the filters.</p>
          <Link href="/charities" className="btn btn-outline btn-sm mt-4">Clear filters</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {charities.map((c) => (
            <CharityCard key={c.id} id={c.id} name={c.name} category={c.category} tagline={c.tagline} featured={c.featured} />
          ))}
        </div>
      )}
    </div>
  );
}
