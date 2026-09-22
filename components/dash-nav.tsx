"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Sidebar/inline nav used by both the user dashboard and the admin area. */
export function DashNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar lg:flex-col lg:pb-0">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[13.5px] transition duration-150 ${
              active
                ? "bg-pine font-semibold text-white shadow-sm"
                : "font-medium text-slate-600 hover:bg-stone-200/60 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
