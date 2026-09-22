import sql from "./db";

export type Charity = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  website_url: string;
  featured: boolean;
  active: boolean;
  events: { title: string; date: string; location: string }[];
  created_at: Date;
};

export const FALLBACK_CHARITIES: Charity[] = [
  {
    id: "demo-hope",
    name: "Hope Foundation",
    category: "Children",
    tagline: "Safe homes and schooling for over a thousand children.",
    description: "Hope Foundation runs family shelters, after-school tutoring and holiday programmes across twelve cities. Every rupee goes into keeping children housed, fed and in school.",
    website_url: "https://example.org/hope",
    featured: true,
    active: true,
    events: [{ title: "Autumn Charity Golf Day", date: "2026-10-15", location: "Maplewood Golf Club" }],
    created_at: new Date(),
  },
  {
    id: "demo-green",
    name: "Green Earth Trust",
    category: "Environment",
    tagline: "Rivers, woodland and coastline restoration.",
    description: "Green Earth Trust coordinates volunteer restoration projects — river clean-ups, tree planting and coastal dune repair — with published results for every project it funds.",
    website_url: "https://example.org/green-earth",
    featured: true,
    active: true,
    events: [{ title: "River Wensum Clean-Up", date: "2026-10-02", location: "Norwich" }],
    created_at: new Date(),
  },
  {
    id: "demo-mind",
    name: "Mind & Body Wellness",
    category: "Health",
    tagline: "Community mental-health support, free at the point of need.",
    description: "Mind & Body Wellness funds counselling places, peer support groups and community exercise programmes for people who can't afford private care.",
    website_url: "https://example.org/mindbody",
    featured: true,
    active: true,
    events: [],
    created_at: new Date(),
  },
  {
    id: "demo-shelter",
    name: "Shelter Together",
    category: "Community",
    tagline: "Emergency housing and resettlement support.",
    description: "Shelter Together provides emergency beds, then walks alongside people through resettlement — deposits, furniture, and the boring paperwork that keeps a tenancy alive.",
    website_url: "https://example.org/shelter",
    featured: false,
    active: true,
    events: [],
    created_at: new Date(),
  },
];

export async function listCharities(opts: { search?: string; category?: string } = {}) {
  try {
    const countCheck = await sql`select count(*) as c from charities where active = true`;
    const total = Number(countCheck[0]?.c ?? 0);
    if (total > 0) {
      const search = opts.search?.trim();
      if (search && opts.category) {
        return await sql<Charity[]>`select * from charities where active = true and category = ${opts.category}
          and (name ilike ${"%" + search + "%"} or tagline ilike ${"%" + search + "%"})
          order by featured desc, name`;
      } else if (search) {
        return await sql<Charity[]>`select * from charities where active = true
          and (name ilike ${"%" + search + "%"} or tagline ilike ${"%" + search + "%"})
          order by featured desc, name`;
      } else if (opts.category) {
        return await sql<Charity[]>`select * from charities where active = true and category = ${opts.category}
          order by featured desc, name`;
      } else {
        return await sql<Charity[]>`select * from charities where active = true order by featured desc, name`;
      }
    }
  } catch (err) {
    console.error("Database query failed in listCharities:", err);
  }

  let list = FALLBACK_CHARITIES;
  if (opts.category) {
    list = list.filter((c) => c.category === opts.category);
  }
  if (opts.search?.trim()) {
    const q = opts.search.trim().toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q));
  }
  return list;
}

export async function listAllCharitiesAdmin() {
  try {
    return await sql`select * from charities order by created_at desc`;
  } catch (err) {
    console.error("Database query failed in listAllCharitiesAdmin:", err);
    return [];
  }
}

export async function getCharity(id: string) {
  try {
    const [row] = await sql<Charity[]>`select * from charities where id = ${id} limit 1`;
    if (row) return row;
  } catch (err) {
    console.error("Database query failed in getCharity:", err);
  }
  return FALLBACK_CHARITIES.find((c) => c.id === id);
}

export async function featuredCharities(limit = 3) {
  try {
    const rows = await sql<Charity[]>`select * from charities where active = true and featured = true order by name limit ${limit}`;
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.error("Database query failed in featuredCharities:", err);
  }
  return FALLBACK_CHARITIES.filter((c) => c.featured).slice(0, limit);
}

export async function createCharity(input: {
  name: string;
  category: string;
  tagline: string;
  description: string;
  website_url: string;
  featured: boolean;
}) {
  const [row] = await sql<{ id: string }[]>`
    insert into charities (name, category, tagline, description, website_url, featured)
    values (${input.name}, ${input.category}, ${input.tagline}, ${input.description},
            ${input.website_url}, ${input.featured})
    returning id`;
  return row.id;
}

export async function updateCharity(id: string, patch: Partial<{
  name: string;
  category: string;
  tagline: string;
  description: string;
  website_url: string;
  featured: boolean;
  active: boolean;
}>) {
  await sql`update charities set ${sql(patch)} where id = ${id}`;
}

export async function deleteCharity(id: string) {
  // Soft delete: historical contributions must keep pointing at something.
  await sql`update charities set active = false where id = ${id}`;
}
