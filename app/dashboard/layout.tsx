import { requireUser } from "@/lib/auth";
import { DashNav } from "@/components/dash-nav";
import { LogoutButton } from "@/components/user-forms";
import { PageFade } from "@/components/page-fade";
import { BackButton } from "@/components/back-button";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/scores", label: "Scores" },
  { href: "/dashboard/draws", label: "Draws" },
  { href: "/dashboard/winnings", label: "Winnings" },
  { href: "/dashboard/charity", label: "Charity" },
  { href: "/dashboard/profile", label: "Profile" },
];

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="kicker">Your dashboard</p>
          <p className="mt-1 font-display text-[18px] font-bold text-ink">{user.full_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <BackButton href="/" label="Back to site" variant="button" />
          <LogoutButton />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[190px_1fr]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <DashNav items={items} />
        </aside>
        <div className="min-w-0"><PageFade>{children}</PageFade></div>
      </div>
    </div>
  );
}
