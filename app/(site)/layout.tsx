import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/user-forms";
import { PageFade } from "@/components/page-fade";
import { MobileNav } from "@/components/mobile-nav";

/**
 * Shared chrome for all public pages. The wordmark intentionally echoes
 * the PRD's own "digital.HEROES." identity.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-display text-[17px] font-bold tracking-tight text-ink">
            digital.<span className="text-pine">HEROES.</span>
          </Link>
          <nav className="hidden items-center gap-6 text-[14px] font-medium text-body md:flex">
            <Link href="/how-it-works" className="nav-link transition-colors hover:text-pine">How it works</Link>
            <Link href="/charities" className="nav-link transition-colors hover:text-pine">Charities</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"} className="btn btn-outline btn-sm">
                  {user.role === "admin" ? "Admin" : "Dashboard"}
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link href="/signup" className="btn btn-primary btn-sm">Subscribe</Link>
              </>
            )}
            <MobileNav user={user ? { role: user.role } : null} />
          </div>
        </div>
      </header>

      <main className="flex-1"><PageFade>{children}</PageFade></main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            <span className="font-display font-bold text-ink">digital.HEROES.</span>{" "}
            © 2026 · Play with purpose. Demo build — payments run in test mode.
          </p>
          <div className="flex gap-5">
            <Link href="/how-it-works" className="nav-link transition-colors hover:text-pine">How it works</Link>
            <Link href="/charities" className="nav-link transition-colors hover:text-pine">Charities</Link>
            <Link href="/login" className="nav-link transition-colors hover:text-pine">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
