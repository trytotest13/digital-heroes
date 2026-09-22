import Link from "next/link";
import { CHARITY_CATEGORIES } from "@/lib/format";

/**
 * Charity directory filters — a native GET form, no client JavaScript.
 * Category buttons submit immediately; search submits via Enter/Search.
 */
export function CharityFilters({ q = "", category = "" }: { q?: string; category?: string }) {
  return (
    <form
      action="/charities"
      method="get"
      className="mt-8 flex flex-col gap-3 sm:flex-row"
      role="search"
    >
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="Search charities…"
        className="input sm:max-w-xs"
        aria-label="Search charities"
      />
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth" role="group" aria-label="Filter by category">
        <Link
          href={q ? `/charities?q=${encodeURIComponent(q)}` : "/charities"}
          aria-pressed={!category}
          className={`flex h-10 items-center whitespace-nowrap rounded-[10px] border px-4 text-[13px] font-semibold transition cursor-pointer select-none ${
            !category
              ? "border-pine bg-pine text-cream"
              : "border-line bg-white/70 text-body hover:border-pine/50 hover:bg-white"
          }`}
        >
          All
        </Link>
        {CHARITY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="submit"
            name="category"
            value={cat}
            aria-pressed={category === cat}
            className={`flex h-10 items-center whitespace-nowrap rounded-[10px] border px-4 text-[13px] font-semibold transition cursor-pointer select-none ${
              category === cat
                ? "border-pine bg-pine text-cream"
                : "border-line bg-white/70 text-body hover:border-pine/50 hover:bg-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <button type="submit" className="btn btn-primary shrink-0">
        Search
      </button>
    </form>
  );
}
