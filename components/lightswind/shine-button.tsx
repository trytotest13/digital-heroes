"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ShineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "amber" | "outline";
  children: React.ReactNode;
  className?: string;
}

/**
 * Lightswind UI - ShineButton component
 * Interactive button featuring an animated high-gloss shine reflection on hover.
 */
export const ShineButton = React.forwardRef<HTMLButtonElement, ShineButtonProps>(
  ({ href, variant = "primary", children, className, ...props }, ref) => {
    const baseVariant =
      variant === "primary"
        ? "bg-pine text-cream hover:bg-pine-deep shadow-[0_4px_14px_rgba(23,61,53,0.35)]"
        : variant === "amber"
        ? "bg-amber text-ink hover:brightness-95 shadow-[0_4px_14px_rgba(216,161,93,0.35)]"
        : "border border-line bg-white/80 backdrop-blur text-body hover:border-pine hover:text-pine";

    const content = (
      <>
        {/* Animated glossy reflection line */}
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          aria-hidden="true"
        >
          <span className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-all duration-1000 ease-out group-hover:left-full group-hover:translate-x-full" />
        </span>
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      </>
    );

    const classes = cn(
      "group relative inline-flex h-11 cursor-pointer select-none items-center justify-center overflow-hidden rounded-[12px] px-6 text-[14px] font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50",
      baseVariant,
      className,
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {content}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {content}
      </button>
    );
  },
);

ShineButton.displayName = "ShineButton";
