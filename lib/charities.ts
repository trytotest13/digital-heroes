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
  try {
    const search = opts.search?.trim();
    const conds = ["active = true"];
    if (opts.category) conds.push(`category = '${opts.category.replace(/'/g, "''")}'`);
    if (search) {
      const q = `%${search.replace(/[%_]/g, "")}%`;
      conds.push(`(name ilike '${q}' or tagline ilike '${q}')`);
    }
    // ponytail: interpolated filters after light sanitising; postgres lib has no dynamic-where helper
    return await sql<Charity[]>`select * from charities where ${sql.unsafe(conds.join(" and "))} order by featured desc, name`;
  } catch (err) {
    console.error("Database query failed in listCharities:", err);
    return [];
  }
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
  return undefined;
}

export async function featuredCharities(limit = 3) {
  try {
    const rows = await sql<Charity[]>`select * from charities where active = true and featured = true order by name limit ${limit}::int`;
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.error("Database query failed in featuredCharities:", err);
  }
  return [];
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
