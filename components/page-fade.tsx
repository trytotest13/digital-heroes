"use client";

import { usePathname } from "next/navigation";

/**
 * Route transition: re-mounts content on pathname change so the
 * `animate-fade-up` entrance replays for every page. CSS-only,
 * no new dependencies, respects prefers-reduced-motion via globals.css.
 */
export function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-up">
      {children}
    </div>
  );
}
