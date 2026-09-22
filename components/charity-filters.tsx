"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CHARITY_CATEGORIES } from "@/lib/format";

/**
 * Charity directory filters.
 * - Category buttons toggle: clicking an active category deselects it (returns to All).
 * - Clicking an inactive category selects it and immediately filters.
 * - Clicking "All" clears the category filter.
 * - Search query can be typed and submitted (via Enter or the Search button).
 * - Client-side navigation updates the URL searchParams smoothly without full page reload.
 */
export function CharityFilters({ q = "", category = "" }: { q?: string; category?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(q ?? "");
  const [isPending, startTransition] = useTransition();

  // Keep search input in sync if URL parameter changes
  useEffect(() => {
    setSearch(q ?? "");
  }, [q]);

  function applyFilters(targetCategory: string, targetQuery: string) {
    const params = new URLSearchParams();
    const cleanQ = targetQuery.trim();
    if (cleanQ) params.set("q", cleanQ);
    if (targetCategory) params.set("category", targetCategory);

    const qs = params.toString();
    const url = qs ? `/charities?${qs}` : "/charities";

    startTransition(() => {
      router.push(url, { scroll: false });
    });
  }

  function handleCategoryToggle(cat: string) {
    // If the category is already active, clicking it again toggles it off (deselects)
    const nextCategory = category === cat ? "" : cat;
    applyFilters(nextCategory, search);
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    applyFilters(category ?? "", search);
  }

  return (
    <form
      className="mt-8 flex flex-col gap-3 sm:flex-row"
      onSubmit={handleSearchSubmit}
      role="search"
    >
      <input
        name="q"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search charities…"
        className="input sm:max-w-xs"
        aria-label="Search charities"
      />
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
        <button
          type="button"
          onClick={() => applyFilters("", search)}
          aria-pressed={!category}
          className={`flex h-10 items-center whitespace-nowrap rounded-[10px] border px-4 text-[13px] font-semibold transition cursor-pointer select-none ${
            !category
              ? "border-pine bg-pine text-cream"
              : "border-line bg-white/70 text-body hover:border-pine/50 hover:bg-white"
          }`}
        >
          All
        </button>
        {CHARITY_CATEGORIES.map((cat) => {
          const isSelected = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryToggle(cat)}
              aria-pressed={isSelected}
              className={`flex h-10 items-center whitespace-nowrap rounded-[10px] border px-4 text-[13px] font-semibold transition cursor-pointer select-none ${
                isSelected
                  ? "border-pine bg-pine text-cream"
                  : "border-line bg-white/70 text-body hover:border-pine/50 hover:bg-white"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
      <button
        type="submit"
        className="btn btn-primary shrink-0"
        disabled={isPending}
      >
        {isPending ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
