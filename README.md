# Digital Heroes ⛳

> Play with purpose. Golf performance, with a conscience.

Digital Heroes lets golfers track their rounds, enter monthly prize draws, and direct a portion of every subscription towards charitable causes they care about.

## Features

- **Golf Performance Tracking**: Log scores, track progress across courses, and follow performance stats.
- **Monthly Prize Draws**: Transparent, provably-fair monthly draws tiered across 3, 4, and 5-number matches.
- **Charitable Giving**: Dedicated charity partners receive direct contributions funded by subscriptions.
- **Admin & Charity Dashboards**: Comprehensive portals for platform management, draw execution, and charity reporting.
- **Stripe Subscriptions**: Seamless subscription and checkout handling.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (with Supabase migrations & local PGlite support)
- **Payments**: Stripe

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and configure your database and Stripe credentials:

```bash
cp .env.example .env.local
```

### 3. Local Database & Seeding

```bash
# Run local dev database (PGlite)
npm run db:local

# Seed test data
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
