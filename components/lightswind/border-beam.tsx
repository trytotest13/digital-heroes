"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderThickness?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

/**
 * Lightswind UI - BorderBeam component
 * An animated illuminated gradient border that travels smoothly around any card or container.
 */
export const BorderBeam = ({
  className,
  size = 140,
  duration = 7,
  borderThickness = 2,
  colorFrom = "#173d35",
  colorTo = "#d8a15d",
  delay = 0,
}: BorderBeamProps) => {
  return (
    <div
      aria-hidden="true"
      style={
        {
          "--size": `${size}px`,
          "--duration": `${duration}s`,
          "--delay": `-${delay}s`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--thickness": `${borderThickness}px`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:var(--thickness)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[var(--size)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[animation-duration:var(--duration)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--size)/2)_calc(var(--size)/2)] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)))]",
        className,
      )}
    />
  );
};
