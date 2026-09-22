import Link from "next/link";
import { BorderBeam } from "@/components/lightswind/border-beam";

/**
 * Charity card used across home, directory and admin previews.
 * Abstract duotone headers instead of stock photography — no fake imagery.
 */
const categoryStyle: Record<string, { bg: string; fg: string }> = {
  Health: { bg: "bg-[#e7ddcf]", fg: "text-[#6d4f2a]" },
  Children: { bg: "bg-mist", fg: "text-pine" },
  Environment: { bg: "bg-[#dfe6d3]", fg: "text-[#3d5231]" },
  Community: { bg: "bg-[#e9dfe0]", fg: "text-[#7a3d44]" },
  Sports: { bg: "bg-[#e2eaf5]", fg: "text-[#284a75]" },
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
      className="card card-hover group relative block h-full overflow-hidden"
    >
      {featured && <BorderBeam size={130} duration={9} colorFrom="#173d35" colorTo="#d8a15d" />}
      <div className={`relative flex h-28 items-center justify-center overflow-hidden ${style.bg}`}>
        <span className={`font-display text-[34px] font-bold transition-transform duration-300 ease-out group-hover:scale-110 ${style.fg}`}>
          {name.slice(0, 1)}
        </span>
        <span className={`absolute left-4 top-4 badge ${style.fg} bg-white/70`}>{category}</span>
        {featured && <span className="absolute right-4 top-4 badge-amber">Featured</span>}
      </div>
      <div className="p-5">
        <h3 className="font-display text-[17px] font-bold transition-colors duration-200 group-hover:text-pine">{name}</h3>
        <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">{tagline}</p>
        <p className="mt-3 text-[13px] font-semibold text-pine transition-transform duration-200 group-hover:translate-x-1">Learn more →</p>
      </div>
    </Link>
  );
}
