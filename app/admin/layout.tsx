import { requireAdmin } from "@/lib/auth";
import { DashNav } from "@/components/dash-nav";
import { LogoutButton } from "@/components/user-forms";

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
            <span className="font-display text-[15px] font-bold text-cream">
              digital.<span className="text-sage">HEROES.</span>
            </span>
            <span className="badge-amber">Admin</span>
          </div>
          <LogoutButton className="btn btn-ghost btn-sm text-cream hover:bg-[#1c2624]" />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <DashNav items={items} />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
