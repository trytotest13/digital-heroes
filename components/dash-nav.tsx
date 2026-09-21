"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Sidebar/inline nav used by both the user dashboard and the admin area. */
export function DashNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-[10px] px-3 py-2 text-[14px] font-medium transition duration-200 ${
              active ? "bg-pine text-cream" : "text-body hover:bg-mist/70"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
