"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * Lightswind UI - NumberTicker component
 * Smooth easing counter that counts up to the target number when visible.
 */
export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  prefix = "",
  suffix = "",
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(direction === "down" ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const timer = setTimeout(() => {
      const startTime = performance.now();
      const duration = 1400; // 1.4s ease out

      const start = direction === "down" ? value : 0;
      const end = value;

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.round(start + (end - start) * ease);

        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [hasStarted, value, direction, delay]);

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)}>
      {prefix}
      {displayValue.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
