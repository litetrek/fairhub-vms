@AGENTS.md

# FairHub VMS — Claude Code Project Briefing

> This file is read automatically by Claude Code on every session startup.
> It is the single source of truth for project conventions, constraints,
> and stack-specific rules. Both the main dev laptop and the QA laptop
> use this same file via Git. Do not delete or rename it.

---

## Project Identity

| Field | Value |
|---|---|
| Project name | FairHub VMS (also called VendorHub) |
| Purpose | Vendor management system for a yearly community fair event |
| Live URL | vendor.glowfest.com / vendor.cyber-tech.com |
| GitHub repo | https://github.com/litetrek/fairhub-vms |
| Local path (main) | C:\Users\vince\code-projects\fairhub-vms |
| Deployment | Vercel (auto-deploys on push to main) |
| Org identifier | NEXT_PUBLIC_ORG=glowfest |

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16, TypeScript | App Router, src/ directory layout |
| Styling | Tailwind CSS + shadcn/ui v4 | Two-layer theming system |
| ORM | Prisma v7 | Requires @prisma/adapter-pg |
| Database | Supabase PostgreSQL | Project ID: jggxctktrpogbhktrsi, West US |
| Auth | Supabase Auth | Vendors: email+Google OAuth; Staff/Admin: email only |
| Storage | Supabase Storage | Document uploads |
| Email | Resend | src/lib/email.ts — may be no-oping (key not set) |
| SMS | Twilio | Not yet wired |
| Payments | Stripe | Deferred — webhook-driven when live |
| DNS | GreenGeeks → Vercel | DNS only, no hosting |

---

## CRITICAL RULES — Never Violate These

### 1. Never modify src/proxy.ts
This is the Next.js 16 routing/middleware file. It controls all role-based
redirects and auth guards. Touching it breaks auth for all user roles.
- NEVER rename it
- NEVER add imports to it unless explicitly told to
- NEVER recreate middleware.ts alongside it (deprecated in Next.js 16)

### 2. Never add npm packages without explicit approval
Ask first. State the package name, purpose, and whether it is a devDependency.
Wait for a "yes" before running npm install.

### 3. Never put PrismaClient in prisma.config.ts
prisma.config.ts is a reserved Prisma 7 CLI config file. It must export
defineConfig only. The PrismaClient singleton lives exclusively in
src/lib/prisma.ts. Mixing these causes "Failed to parse config file" errors.

### 4. Never confirm Stripe payment from the client redirect
Payment confirmation MUST come from a Stripe webhook handler.
Never trust the client-side redirect URL as proof of payment.

### 5. Never use .env — all variables are in .env.local
The project has NO .env file. Every environment variable lives in .env.local.
This matters for Prisma CLI commands which won't auto-load .env.local.

### 6. Never break working Stage 1–5 flows
When adding new code, preserve all prior stage functionality:
auth flows, application form, staff queue, booth assignment, invoicing,
admin setup hub, and public /fair/[slug] discovery page.

---

## Prisma v7 — Specific Conventions

DATABASE_URL = port 6543  (pooled — used at runtime by the app)
DIRECT_URL   = port 5432  (direct — used by Prisma CLI for migrations)

prisma.config.ts (CLI config only — no PrismaClient here):
  - Loads env from .env.local via dotenv config({ path: '.env.local' })
  - datasource.url = DIRECT_URL

src/lib/prisma.ts (runtime client singleton):
  - PrismaClient with PrismaPg adapter and pg Pool
  - Includes dev hot-reload guard (globalThis pattern)

When adding a new updatedAt column to a table with existing rows, always
pair it with @default(now()) to allow Prisma to backfill existing rows.

Schema changes:
  npx prisma db push     (uses DIRECT_URL via prisma.config.ts)
  npx prisma generate    (regenerates client after schema changes)

---

## Next.js 16 — Specific Conventions

- Routing/middleware file: src/proxy.ts (exports async function proxy)
- middleware.ts does NOT exist and must NOT be created
- All pages use the App Router (app/ directory inside src/)
- Server Components by default; add 'use client' only when needed
- API routes live at src/app/api/

---

## shadcn/ui v4 — Specific Conventions

- Uses @base-ui/react Slot — NOT @radix-ui/react-slot
- If the asChild Button pattern breaks, restore the Slot import directly
- Component source lives in src/components/ui/
- Do not upgrade or reinstall shadcn without explicit approval

---

## Theming System

Two-layer architecture:
- data-theme attribute → brand colors (per org, e.g. data-theme="glowfest")
- data-surface attribute → treatment
  - festive = dark/glowing (vendor-facing pages, auth pages)
  - clean = near-white (staff dashboard, admin pages)

Theme config: src/themes/glowfest.ts
Reference doc: VendorHub_Theme_Redesign_Notes.md in repo root

Glowfest palette: deep purple/navy base, neon magenta + amber/gold + teal accents
Fonts: Cinzel (display), Inter (body)

Known issue: contrast problems on festive (dark) surface throughout the app.
Fix incrementally as encountered. Must resolve before public launch.

---

## Eight Functional Modules — Build Status

| Module | Name | Status |
|---|---|---|
| M1 | Identity & Account / Auth | Complete |
| M2 | Booth Application (multi-step form) | Complete |
| M3 | Compliance & Documents (uploads) | Complete |
| M4 | Approval Workflow (staff review) | Complete |
| M5 | Booth Assignment (staff-driven) | Complete |
| M6 | Invoicing & Payment (Stripe deferred) | Complete |
| M7 | Communication (email/SMS) | Future |
| M8 | Admin Dashboard / Event Check-in | Future |

Pre-Event Setup + Public Discovery (Stage 5) complete and smoke-tested.

---

## Application Status Flow

DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → (booth assigned) → (invoice generated)
                                 → REJECTED → (vendor re-edits) → SUBMITTED

Rejection clears the rejectionNote on resubmit.
Vendors re-edit their existing application — they do not start fresh.

---

## Invoice & Payment Rules

Order of operations (enforced):
1. Application must be APPROVED before booth can be assigned
2. Booth must be assigned before invoice can be generated
3. Offline payment recorded by staff (method, amount, date, reference, notes)
4. Invoice status: DRAFT → SENT → PARTIALLY_PAID → PAID

Stripe: PLACEHOLDER only. When built, confirmation comes from webhook only —
never from the client redirect. Webhook handler: /api/webhooks/stripe

---

## Auth & Role Routing

| Role | Login method | Landing page |
|---|---|---|
| VENDOR | Email/password OR Google OAuth | /vendor/dashboard |
| STAFF | Email/password only | /staff/queue |
| ADMIN | Email/password only | /admin/events |

First-time Google OAuth vendors → /vendor/profile/complete
Staff/Admin accounts: created by Admin only, not via public /auth/register
Supabase email confirmation: disabled during dev, re-enable when Resend configured

---

## Key Page Routes

/auth/login                     Vendor + staff login
/auth/register                  Vendor self-registration
/auth/callback                  Supabase OAuth callback
/vendor/profile/complete        First-time Google vendor profile capture
/vendor/dashboard               Vendor home
/vendor/applications/new        New application form (multi-step)
/vendor/applications/[id]       Vendor view of their application
/fair/[slug]                    Public event discovery page (no auth required)
/staff/queue                    Staff review queue
/staff/applications/[id]        Staff review + approve/reject + assign + invoice
/admin/events                   Admin event list
/admin/events/new               Create new event
/admin/events/[id]/setup        4-tab setup hub (Booth Types, Add-Ons, Weeks, Docs)
/admin/events/[id]/edit         Edit event details

---

## QA Laptop — Additional Rules

The QA laptop runs the same repo cloned from GitHub. Its only job is tests.

- Only create or edit files inside tests/ — never touch src/
- Never run prisma db push or prisma migrate from the QA laptop
- Run npm run dev in one terminal before running Playwright E2E tests
- Vitest unit tests run standalone: npm run test:unit (no dev server needed)
- Playwright E2E tests need the dev server: npm run test:e2e in second terminal

Test folder structure:
  tests/
    unit/
      lib/           tests for src/lib/* (invoices, email, etc.)
      api/           tests for API route handlers
        auth/
        vendor/
        staff/
        admin/
      __mocks__/     Prisma and Supabase mock factories
    e2e/             Playwright browser tests
      auth.spec.ts
      vendor-application.spec.ts
      staff-review.spec.ts
      booth-assignment.spec.ts
      invoicing.spec.ts
      admin-setup.spec.ts
      public-discovery.spec.ts

---

## Known Issues (as of Stage 5)

- Dark surface text contrast on festive theme: ongoing, fix incrementally
- RESEND_API_KEY not configured: emails are silently no-oping
- Stripe not configured: online payment is placeholder only
- Twilio not configured: SMS not yet wired
- "All" queue tab includes DRAFT applications: known, not yet resolved
- Supabase email confirmation disabled: re-enable when Resend is ready

---

## Workflow

- Claude.ai (chat) → architecture decisions, planning, prompt authorship
- Claude Code (VS Code, main laptop) → all app code in src/
- Claude Code (VS Code, QA laptop) → all test code in tests/
- Paste prompts from Claude.ai into Claude Code
- Never use Cowork for coding tasks
- Commit PROGRESS.md and CLAUDE.md updates at the end of each stage

---

Last updated: Stage 5 complete — Stage 6 QA test suite starting
