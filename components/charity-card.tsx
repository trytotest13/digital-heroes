import Link from "next/link";

/**
 * Charity card used across home, directory and admin previews.
 * Abstract duotone headers instead of stock photography — no fake imagery.
 */
const categoryStyle: Record<string, { bg: string; fg: string }> = {
  Health: { bg: "bg-[#e7ddcf]", fg: "text-[#6d4f2a]" },
  Children: { bg: "bg-mist", fg: "text-pine" },
  Environment: { bg: "bg-[#dfe6d3]", fg: "text-[#3d5231]" },
  Community: { bg: "bg-[#e9dfe0]", fg: "text-[#7a3d44]" },
};

export function CharityCard({
  id,
  name,
  category,
  tagline,
  featured,
}: {
  id: string;
  name: string;
  category: string;
  tagline: string;
  featured?: boolean;
}) {
  const style = categoryStyle[category] ?? categoryStyle.Community;
  return (
    <Link
      href={`/charities/${id}`}
      className="card group block overflow-hidden transition duration-200 hover:-translate-y-0.5"
    >
      <div className={`relative flex h-28 items-center justify-center ${style.bg}`}>
        <span className={`font-display text-[34px] font-bold ${style.fg}`}>{name.slice(0, 1)}</span>
        <span className={`absolute left-4 top-4 badge ${style.fg} bg-white/70`}>{category}</span>
        {featured && <span className="absolute right-4 top-4 badge-amber">Featured</span>}
      </div>
      <div className="p-5">
        <h3 className="font-display text-[17px] font-bold transition group-hover:text-pine">{name}</h3>
        <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">{tagline}</p>
        <p className="mt-3 text-[13px] font-semibold text-pine transition group-hover:translate-x-0.5">Learn more →</p>
      </div>
    </Link>
  );
}
