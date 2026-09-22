"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

/**
 * Lightswind UI - Marquee component
 * Continuous, smooth infinite scrolling banner with touch and hover support.
 */
export const Marquee = ({
  className,
  reverse = false,
  pauseOnHover = true,
  children,
  vertical = false,
  repeat = 4,
}: MarqueeProps) => {
  return (
    <div
      className={cn(
        "group flex overflow-hidden p-2 [--duration:32s] [--gap:1rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 justify-around [gap:var(--gap)]",
            vertical
              ? "animate-marquee-vertical flex-col"
              : "animate-marquee flex-row",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
};
