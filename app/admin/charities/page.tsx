export const dynamic = "force-dynamic";
import { listAllCharitiesAdmin } from "@/lib/charities";
import { CharityAddForm, CharityEditRow } from "@/components/admin-forms";
import { adminDeleteCharityAction } from "@/actions/admin";
import { SubmitButton } from "@/components/bits";
import { BackButton } from "@/components/back-button";

export const metadata = { title: "Admin · Charities" };

export default async function AdminCharitiesPage() {
  const charities = await listAllCharitiesAdmin();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <BackButton href="/admin" label="Back to overview" className="mb-2" />
          <h1 className="font-display text-[26px] font-bold">Charities</h1>
          <p className="mt-1 text-[14px] text-muted">{charities.length} records · deleting hides a charity but keeps contribution history intact.</p>
        </div>
        <CharityAddForm />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">Name</th>
                <th className="th">Category</th>
                <th className="th">Tagline</th>
                <th className="th">Featured</th>
                <th className="th">State</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {charities.length === 0 ? (
                <tr><td colSpan={6} className="td text-center text-muted">No charities yet - add the first one.</td></tr>
              ) : (
                charities.map((c) => (
                  <CharityEditRow
                    key={c.id}
                    charity={{
                      id: c.id, name: c.name, category: c.category, tagline: c.tagline,
                      description: c.description, website_url: c.website_url,
                      featured: c.featured, active: c.active,
                    }}
                  >
                    <div className="flex gap-1">
                      <a href={`/charities/${c.id}`} className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer">Public page</a>
                      {c.active && (
                        <form action={adminDeleteCharityAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <SubmitButton className="btn btn-ghost btn-sm text-danger" pendingLabel="…">Delete</SubmitButton>
                        </form>
                      )}
                    </div>
                  </CharityEditRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
