"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

export function MobileNav({ user }: { user: { role: string } | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open navigation menu"}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white/80 text-ink shadow-sm transition hover:bg-mist/50 focus:outline-none"
      >
        {isOpen ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-down / Dropdown drawer */}
      <div
        className={`fixed inset-x-0 top-16 z-50 transform border-b border-line bg-cream p-5 shadow-2xl transition-all duration-300 ease-out ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 pointer-events-none opacity-0"
        }`}
      >
        <div className="flex flex-col space-y-3">
          <div className="border-b border-line/60 pb-2">
            <Logo href="/" size="sm" />
          </div>
          <Link
            href="/"
            className={`rounded-lg px-3 py-2.5 text-[15px] font-semibold transition ${
              pathname === "/" ? "bg-pine text-cream" : "text-ink hover:bg-mist/60"
            }`}
          >
            Home
          </Link>
          <Link
            href="/how-it-works"
            className={`rounded-lg px-3 py-2.5 text-[15px] font-semibold transition ${
              pathname === "/how-it-works" ? "bg-pine text-cream" : "text-ink hover:bg-mist/60"
            }`}
          >
            How it works
          </Link>
          <Link
            href="/charities"
            className={`rounded-lg px-3 py-2.5 text-[15px] font-semibold transition ${
              pathname === "/charities" ? "bg-pine text-cream" : "text-ink hover:bg-mist/60"
            }`}
          >
            Charities
          </Link>

          <div className="mt-2 border-t border-line pt-4">
            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href={user.role === "admin" ? "/admin" : "/dashboard"}
                  className="btn btn-outline w-full justify-center"
                >
                  {user.role === "admin" ? "Admin Portal" : "Player Dashboard"}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" className="btn btn-outline w-full justify-center">
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-primary w-full justify-center">
                  Start Playing · Subscribe
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
