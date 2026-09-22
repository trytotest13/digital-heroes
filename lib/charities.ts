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
  {
    id: "demo-golf",
    name: "Girls Into Golf",
    category: "Sports",
    tagline: "Free equipment and coaching for girls in underserved communities.",
    description: "Girls Into Golf breaks down access barriers to the fairway by partnering with local academies to provide free lessons, sets of clubs, and competitive junior tournament entries.",
    website_url: "https://example.org/girls-into-golf",
    featured: true,
    active: true,
    events: [{ title: "Junior Fairway Invitational", date: "2026-11-12", location: "Royal Palms Golf Resort" }],
    created_at: new Date(),
  },
  {
    id: "demo-sports",
    name: "Fair Play Sports",
    category: "Sports",
    tagline: "Accessible athletics facilities and kits for community youth teams.",
    description: "Fair Play Sports renovates inner-city turf fields and supplies protective athletic gear so every child gets to experience the joy of team athletics regardless of family income.",
    website_url: "https://example.org/fair-play",
    featured: false,
    active: true,
    events: [],
    created_at: new Date(),
  },
  {
    id: "demo-wildlife",
    name: "Wildlife Corridors",
    category: "Environment",
    tagline: "Protecting native animal habitats and biodiversity corridors.",
    description: "Connecting fragmented forest patches through safe wildlife passes and reforestation corridors to ensure endangered species thrive safely across expanding urban frontiers.",
    website_url: "https://example.org/wildlife-corridors",
    featured: false,
    active: true,
    events: [{ title: "Wildflower Planting Day", date: "2026-10-18", location: "Western Ghats Trailhead" }],
    created_at: new Date(),
  },
  {
    id: "demo-nutrition",
    name: "First Steps Nutrition",
    category: "Health",
    tagline: "Hot balanced meals and nutritional literacy for young families.",
    description: "Partnering with pediatric wellness centers to deliver nutritious food boxes and hands-on culinary workshops that ensure every newborn receives an optimal start in life.",
    website_url: "https://example.org/first-steps",
    featured: false,
    active: true,
    events: [],
    created_at: new Date(),
  },
  {
    id: "demo-warmth",
    name: "Warm Homes Project",
    category: "Community",
    tagline: "Winter heating relief, insulation, and home repairs for vulnerable elders.",
    description: "Deploying certified energy auditors and emergency relief grants to ensure low-income pensioners stay safely warm and dignified throughout winter months.",
    website_url: "https://example.org/warm-homes",
    featured: false,
    active: true,
    events: [],
    created_at: new Date(),
  },
  {
    id: "demo-rivers",
    name: "Clean Rivers Initiative",
    category: "Environment",
    tagline: "Water filtration barriers and catchment basin preservation.",
    description: "Deploying solar-powered cleanup skimmers and engaging local community volunteers to eradicate single-use plastics from waterways before they hit ocean ecosystems.",
    website_url: "https://example.org/clean-rivers",
    featured: false,
    active: true,
    events: [{ title: "Yamuna Catchment Sweep", date: "2026-10-25", location: "Sector 14 Ghats" }],
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
