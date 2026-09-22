import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { DashNav } from "@/components/dash-nav";
import { LogoutButton } from "@/components/user-forms";
import { PageFade } from "@/components/page-fade";
import { BackButton } from "@/components/back-button";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/draws", label: "Draws" },
  { href: "/admin/charities", label: "Charities" },
  { href: "/admin/winners", label: "Winners" },
  { href: "/admin/reports", label: "Reports" },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-ink">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-[15px] font-bold text-cream transition hover:opacity-90">
              digital.<span className="text-pine-muted">HEROES.</span>
            </Link>
            <span className="badge-amber">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <BackButton href="/" label="Back to site" variant="header" />
            <LogoutButton className="btn btn-ghost btn-sm text-cream hover:bg-ink-border" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <DashNav items={items} />
          </aside>
          <div className="min-w-0"><PageFade>{children}</PageFade></div>
        </div>
      </div>
    </div>
  );
}
