"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps {
  name: string;
  className?: string;
  background?: React.ReactNode;
  Icon?: React.ElementType;
  description: string;
  href?: string;
  cta?: string;
  kicker?: string;
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  kicker,
}: BentoCardProps) {
  return (
    <div
      key={name}
      className={cn(
        "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-80">
        {background}
      </div>
      <div className="relative z-10 flex flex-col">
        {Icon && (
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-pine transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5" />
          </div>
        )}
        {kicker && <p className="kicker mb-1">{kicker}</p>}
        <h3 className="font-display text-[20px] font-bold text-ink transition-colors group-hover:text-pine">
          {name}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{description}</p>
      </div>

      {href && cta && (
        <div className="relative z-10 mt-6 flex items-center">
          <a
            href={href}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-pine transition-colors hover:text-pine-deep"
          >
            {cta} <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </a>
        </div>
      )}
    </div>
  );
}
