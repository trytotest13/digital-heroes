export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharity } from "@/lib/charities";
import { fmtDate } from "@/lib/format";
import { Reveal } from "@/components/reveal";
import { BackButton } from "@/components/back-button";

export default async function CharityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const charity = await getCharity(id);
  if (!charity || !charity.active) notFound();

  const events = Array.isArray(charity.events) ? charity.events : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <BackButton href="/charities" label="Back to charities" className="mb-4" />

      <Reveal>
        <div className="card mt-6 overflow-hidden">
          <div className="flex h-40 items-center justify-center bg-mist">
            <span className="font-display text-[56px] font-bold text-pine">{charity.name.slice(0, 1)}</span>
            <span className="ml-4 badge bg-white/70 text-pine">{charity.category}</span>
          </div>
        <div className="p-6 sm:p-8">
          <h1 className="font-display text-[30px] font-bold sm:text-[38px]">{charity.name}</h1>
          <p className="mt-1 text-[15px] font-medium text-[#8a5f27]">{charity.tagline}</p>
          <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-body">
            {charity.description}
          </p>

          {charity.website_url && (
            <a
              href={charity.website_url}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-outline btn-sm mt-5"
            >
              Visit website ↗
            </a>
          )}

          {events.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <p className="kicker mb-3">Upcoming events</p>
              <ul className="space-y-2">
                {events.map((e, i) => (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 rounded-[10px] bg-cream/70 px-4 py-3">
                    <span className="text-[14px] font-semibold text-body">{e.title}</span>
                    <span className="text-[13px] text-muted">
                      {fmtDate(e.date)} · {e.location}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-[14px] text-muted">
              Support {charity.name} by directing part of your subscription to it - you choose the share.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary">Choose this charity</Link>
              <Link href="/dashboard/charity" className="btn btn-outline">Already a member? Change in dashboard</Link>
            </div>
          </div>
        </div>
      </div>
      </Reveal>
    </div>
  );
}
