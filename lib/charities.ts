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

export async function listCharities(opts: { search?: string; category?: string } = {}) {
  const search = opts.search?.trim();
  if (search && opts.category) {
    return sql`select * from charities where active = true and category = ${opts.category}
      and (name ilike ${"%" + search + "%"} or tagline ilike ${"%" + search + "%"})
      order by featured desc, name`;
  }
  if (search) {
    return sql`select * from charities where active = true
      and (name ilike ${"%" + search + "%"} or tagline ilike ${"%" + search + "%"})
      order by featured desc, name`;
  }
  if (opts.category) {
    return sql`select * from charities where active = true and category = ${opts.category}
      order by featured desc, name`;
  }
  return sql`select * from charities where active = true order by featured desc, name`;
}

export async function listAllCharitiesAdmin() {
  return sql`select * from charities order by created_at desc`;
}

export async function getCharity(id: string) {
  const [row] = await sql<Charity[]>`select * from charities where id = ${id} limit 1`;
  return row;
}

export async function featuredCharities(limit = 3) {
  return sql`select * from charities where active = true and featured = true order by name limit ${limit}`;
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
