# Fairway & Good — Golf Charity Subscription Platform

> Built for the Digital Heroes Full-Stack Development Trainee Selection Process

A subscription-driven web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine. Built with Next.js 14 App Router, Tailwind CSS, Prisma ORM, Supabase (PostgreSQL), and Stripe.

---

## Live Demo Credentials (after seeding)

| Role      | Email                         | Password   |
|-----------|-------------------------------|------------|
| Admin     | admin@fairwayandgood.com      | admin123!  |
| Subscriber| golfer@test.com               | test1234!  |

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Framework    | Next.js 14 (App Router, RSC)        |
| Styling      | Tailwind CSS + custom design system |
| Database     | PostgreSQL via Supabase             |
| ORM          | Prisma                              |
| Auth         | Custom JWT (jose) + httpOnly cookie |
| Payments     | Stripe Checkout + Webhooks          |
| Deployment   | Vercel                              |
| Language     | TypeScript (strict mode)            |

---

## Architecture Overview

```
src/
├── app/
│   ├── page.tsx                  # Public homepage
│   ├── login/                    # Auth pages
│   ├── subscribe/                # Multi-step signup + plan selection
│   ├── charities/                # Public charity directory
│   ├── dashboard/                # Subscriber dashboard (protected)
│   │   └── ScoreManager.tsx      # Client: rolling 5-score entry
│   ├── admin/                    # Admin panel (protected + role-gated)
│   │   ├── draws/                # Draw creation, simulation, publish
│   │   ├── winners/              # Verify + mark payouts
│   │   ├── users/                # User management
│   │   └── charities/            # Charity CRUD
│   └── api/
│       ├── auth/                 # signup · login · logout
│       ├── scores/               # CRUD with rolling-5 logic
│       ├── charities/            # Public charity list
│       ├── subscribe/checkout/   # Stripe checkout session
│       ├── webhooks/stripe/      # Stripe lifecycle events
│       ├── dashboard/            # Aggregated dashboard data
│       └── admin/                # draws · winners · charities · analytics
├── components/
│   ├── ui/                       # Button · Badge · Card · Input · StatCard
│   └── layout/                   # Navbar
├── lib/
│   ├── db.ts                     # Prisma singleton
│   ├── auth.ts                   # JWT · session · hash · guards
│   ├── scores.ts                 # Score business logic (rolling 5)
│   ├── draw-engine.ts            # Random · algorithmic · prize calc · match detection
│   └── stripe.ts                 # Checkout · webhook · cancel
├── middleware.ts                 # Route protection + role guards
└── prisma/
    ├── schema.prisma             # Full data model
    └── seed.ts                   # Dev seed with admin + test user
```

---

## Database Schema (Key Design Decisions)

### Rolling 5-Score Window
Scores are enforced at the **application layer** in `src/lib/scores.ts`. When a user adds a 6th score, the oldest is deleted before insertion. This keeps the DB clean and the query fast.

### Draw Engine
Two modes supported:
- **RANDOM**: 5 unique numbers from 1–45 using Fisher-Yates shuffle
- **ALGORITHMIC**: Weighted selection — numbers with lower historical frequency across all users get higher probability, increasing engagement for active scorers

### Prize Distribution
Hard-coded at model creation time:
- 5-match = 40% (jackpot — rolls over)
- 4-match = 35%
- 3-match = 25%

Prizes split equally per tier. Jackpot rollover is tracked via `jackpotRolledOver` + `rolledOverAmount` fields on the Draw model, and is automatically folded into the next draw's `fiveMatchPool`.

### Draw Lifecycle
`DRAFT → SIMULATED → PUBLISHED`

Admin can simulate (preview winners without committing) then publish when ready. This prevents accidental early reveals.

### Subscription Validation
Every authenticated API route calls `getSession()` which reads the httpOnly JWT cookie. The middleware additionally validates and redirects at the edge before any route renders.

---

## Setup & Local Development

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd golf-charity
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `NEXTAUTH_SECRET` / `JWT_SECRET` — random 32+ char strings
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the PostgreSQL connection string from Settings → Database
3. Paste into `DATABASE_URL` in `.env.local`

### 4. Stripe Setup

1. Create a new Stripe account / project
2. Create two products in Stripe Dashboard:
   - Monthly: £9.99/month recurring → copy Price ID
   - Yearly: £99.00/year recurring → copy Price ID
3. Add both Price IDs to `.env.local`
4. For webhooks locally, install Stripe CLI and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### 5. Database Migration & Seed

```bash
# Push schema to Supabase
npm run db:push

# Seed with test data
npm run db:seed

# (Optional) Open Prisma Studio
npm run db:studio
```

### 6. Run Dev Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel + Supabase)

### Vercel

1. Create a **new** Vercel account (as per PRD requirements)
2. Import this repository
3. Set all environment variables in Vercel dashboard → Settings → Environment Variables
4. Deploy

### Post-Deploy Stripe Webhook

After deploying, add a webhook in Stripe Dashboard:
- URL: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`

---

## Feature Checklist (PRD Coverage)

| Requirement                        | Status |
|------------------------------------|--------|
| Monthly + Yearly subscription plans| ✅     |
| Stripe checkout + webhooks         | ✅     |
| Subscription lifecycle management  | ✅     |
| 5-score rolling window (1–45 range)| ✅     |
| Reverse-chronological score display| ✅     |
| Score CRUD with date               | ✅     |
| Random draw engine                 | ✅     |
| Algorithmic draw engine            | ✅     |
| 5/4/3 match detection              | ✅     |
| Prize pool auto-calculation        | ✅     |
| Jackpot rollover                   | ✅     |
| Multi-winner prize splitting       | ✅     |
| Charity selection at signup        | ✅     |
| Min 10% charity contribution       | ✅     |
| Adjustable charity percentage      | ✅     |
| Charity directory with search      | ✅     |
| Charity events listing             | ✅ (model + API) |
| Featured charity spotlight         | ✅     |
| Draw simulation (preview mode)     | ✅     |
| Admin: publish draw results        | ✅     |
| Winner verification workflow       | ✅     |
| Pending → Paid payout tracking     | ✅     |
| Admin: user management             | ✅     |
| Admin: charity CRUD                | ✅     |
| Admin: analytics dashboard         | ✅     |
| JWT auth with httpOnly cookies     | ✅     |
| Role-based access control          | ✅     |
| Middleware route protection        | ✅     |
| Mobile-first responsive design     | ✅     |
| Non-traditional golf aesthetics    | ✅     |
| Emotion-driven UI/UX               | ✅     |
| Micro-animations + transitions     | ✅     |

---

## Design System

**Font Pairing**: Cormorant Garamond (display/editorial) + DM Sans (body) + DM Mono (data)

**Palette**:
- `#0D0D0B` — brand dark (base)
- `#1A4A2E` — brand green (primary action)
- `#C9A84C` — brand gold (accent/CTA)
- `#F5F0E8` — brand cream (text)
- `#6B7066` — brand muted (secondary text)

**Design Philosophy**: Deliberately non-golf. Leads with emotion — charitable impact and community — not sport. Clean, editorial typographic hierarchy. Warm neutrals over greens and plaids.

---

## Scalability Notes

- **Multi-country**: Currency and locale are parameterisable. Stripe handles international payments natively.
- **Teams/Corporate**: Add `teamId` to `User` + `Subscription` tables. Share draw entries and prize pools across a team.
- **Mobile App**: API routes are fully REST-compatible. Replace Next.js pages with React Native.
- **Campaign Module**: Add a `Campaign` model referencing `Charity` with date range + custom prize multipliers.

---

*Built by Akshit Thakur for Digital Heroes Selection Process · 2026*
