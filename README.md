# Golf-Charity

# Fairway & Good — Golf Charity Subscription Platform

> Built for the Digital Heroes Full-Stack Development Trainee Selection Process · 2026

[![Live Demo](https://img.shields.io/badge/Live%20Demo-golf--charity--roz5.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://golf-charity-roz5.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)

---

A subscription-driven web application combining **golf performance tracking**, **charity fundraising**, and a **monthly draw-based reward engine**. Built with Next.js 14 App Router, Tailwind CSS, Prisma ORM, Supabase (PostgreSQL), and Stripe.

---

## 🌐 Live Demo

**URL**: [https://golf-charity-roz5.vercel.app/](https://golf-charity-roz5.vercel.app/)

| Role       | Email                        | Password   |
|------------|------------------------------|------------|
| Admin      | admin@fairwayandgood.com     | admin123!  |
| Subscriber | golfer@test.com              | test1234!  |

---

## ✨ Features

- 🏌️ **Golf Score Tracking** — Rolling 5-score window (1–45 range), reverse-chronological display, full CRUD
- 💳 **Stripe Subscriptions** — Monthly (£9.99) and Yearly (£99) plans with full webhook lifecycle
- 🎰 **Monthly Draw Engine** — Random + Algorithmic modes, 5/4/3 match detection, jackpot rollover
- 🏆 **Prize Pool System** — Auto-calculated pools, multi-winner splitting, pending → paid payout tracking
- ❤️ **Charity Integration** — Min 10% contribution, charity directory, featured spotlight, events listing
- 🔐 **Auth & Security** — Custom JWT with httpOnly cookies, role-based access control, middleware route protection
- 🛠️ **Admin Panel** — Draw simulation & publishing, winner verification, user management, charity CRUD, analytics dashboard
- 📱 **Mobile-First Design** — Responsive, emotion-driven UI with micro-animations

---

## 🛠 Tech Stack

| Layer       | Technology                           |
|-------------|--------------------------------------|
| Framework   | Next.js 14 (App Router, RSC)         |
| Styling     | Tailwind CSS + custom design system  |
| Database    | PostgreSQL via Supabase              |
| ORM         | Prisma                               |
| Auth        | Custom JWT (jose) + httpOnly cookie  |
| Payments    | Stripe Checkout + Webhooks           |
| Deployment  | Vercel                               |
| Language    | TypeScript (strict mode)             |

---

## 🏗 Architecture

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

## 🧠 Key Design Decisions

### Rolling 5-Score Window
Enforced at the application layer in `src/lib/scores.ts`. When a user adds a 6th score, the oldest is deleted before insertion — keeping the DB clean and queries fast.

### Draw Engine
Two modes supported:
- **RANDOM** — 5 unique numbers from 1–45 using Fisher-Yates shuffle
- **ALGORITHMIC** — Weighted selection where numbers with lower historical frequency get higher probability, increasing engagement for active scorers

### Prize Distribution
- 5-match → 40% (jackpot — rolls over if no winner)
- 4-match → 35%
- 3-match → 25%

Prizes split equally per tier. Jackpot rollover tracked via `jackpotRolledOver` + `rolledOverAmount` fields, automatically folded into the next draw's pool.

### Draw Lifecycle
`DRAFT → SIMULATED → PUBLISHED`

Admin simulates first (preview without committing), then publishes when ready — preventing accidental early reveals.

---

## 🚀 Local Development

### 1. Clone & Install

```bash
git clone https://github.com/Akshit568/Golf-Charity.git
cd golf-charity
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL pooler connection string |
| `JWT_SECRET` | Random 32+ character string |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_MONTHLY_PRICE_ID` | Stripe price ID for £9.99/month plan |
| `STRIPE_YEARLY_PRICE_ID` | Stripe price ID for £99/year plan |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

### 3. Database Setup

```bash
# Push schema to Supabase
npm run db:push

# Seed with test data
npm run db:seed

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Stripe Webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5. Run Dev Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deployment

Deployed on **Vercel** with **Supabase** as the database.

After deploying, register a Stripe webhook pointing to:
```
https://golf-charity-roz5.vercel.app/api/webhooks/stripe
```

Events to listen for:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`

---

## ✅ Feature Checklist

| Requirement | Status |
|-------------|--------|
| Monthly + Yearly subscription plans | ✅ |
| Stripe checkout + webhooks | ✅ |
| Subscription lifecycle management | ✅ |
| 5-score rolling window (1–45 range) | ✅ |
| Reverse-chronological score display | ✅ |
| Score CRUD with date | ✅ |
| Random draw engine | ✅ |
| Algorithmic draw engine | ✅ |
| 5/4/3 match detection | ✅ |
| Prize pool auto-calculation | ✅ |
| Jackpot rollover | ✅ |
| Multi-winner prize splitting | ✅ |
| Charity selection at signup | ✅ |
| Min 10% charity contribution | ✅ |
| Adjustable charity percentage | ✅ |
| Charity directory with search | ✅ |
| Charity events listing | ✅ |
| Featured charity spotlight | ✅ |
| Draw simulation (preview mode) | ✅ |
| Admin: publish draw results | ✅ |
| Winner verification workflow | ✅ |
| Pending → Paid payout tracking | ✅ |
| Admin: user management | ✅ |
| Admin: charity CRUD | ✅ |
| Admin: analytics dashboard | ✅ |
| JWT auth with httpOnly cookies | ✅ |
| Role-based access control | ✅ |
| Middleware route protection | ✅ |
| Mobile-first responsive design | ✅ |
| Non-traditional golf aesthetics | ✅ |
| Emotion-driven UI/UX | ✅ |
| Micro-animations + transitions | ✅ |

---

## 🎨 Design System

**Font Pairing**: Cormorant Garamond (display) + DM Sans (body) + DM Mono (data)

**Palette**:

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-dark` | `#0D0D0B` | Base background |
| `brand-green` | `#1A4A2E` | Primary actions |
| `brand-gold` | `#C9A84C` | Accent / CTA |
| `brand-cream` | `#F5F0E8` | Body text |
| `brand-muted` | `#6B7066` | Secondary text |

**Design Philosophy**: Deliberately non-golf. Leads with emotion — charitable impact and community — not sport. Clean, editorial typographic hierarchy. Warm neutrals over greens and plaids.

---

## 📈 Scalability

- **Multi-country** — Currency and locale are parameterisable. Stripe handles international payments natively.
- **Teams/Corporate** — Add `teamId` to `User` + `Subscription` tables to share draw entries across a team.
- **Mobile App** — API routes are fully REST-compatible. Swap Next.js pages for React Native.
- **Campaign Module** — Add a `Campaign` model with date range + custom prize multipliers per charity.

---

*Built by **Akshit Thakur** for Digital Heroes Selection Process · 2026*
