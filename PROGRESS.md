# VendorHub — Project Progress

**Project:** Vendor Management System for yearly community fair event
**Domain:** vendor.cyber-tech.com
**Repo:** https://github.com/litetrek/fairhub-vms
**Local path:** C:\Users\vince\code-projects\fairhub-vms

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, TypeScript |
| Styling | Tailwind CSS, shadcn/ui v4 |
| ORM | Prisma v7 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Deployment | Vercel |
| Email | Resend |
| SMS | Twilio |
| Payments | Stripe |
| DNS | GreenGeeks → Vercel |

---

## Eight Functional Modules

| Module | Name | Status |
|---|---|---|
| M1 | Identity & Account / Registration & Email Verification | ✅ Complete |
| M2 | Booth Application (multi-step form) | ✅ Complete |
| M3 | Compliance & Documents (uploads) | ✅ Complete |
| M4 | Approval Workflow (staff review, approve/reject) | ✅ Complete |
| M5 | Booth Assignment (staff-driven) | ✅ Complete |
| M6 | Invoicing & Payment | ✅ Complete (Stripe deferred) |
| M7 | Communication | 🔲 Future |
| M8 | Admin Dashboard / Event Check-in | 🔲 Future |

---

## Stage Progress

### ✅ Stage 1 — Project Scaffold
- Next.js 14 project created with TypeScript, Tailwind, shadcn/ui
- Prisma schema with all 8 modules' tables created
- Supabase connected (database, auth, storage)
- GitHub repo initialized
- Vercel auto-deploy pipeline live

### ✅ Stage 2 — Authentication System
- `/auth/login` — email/password login page with VendorHub branding
- `/auth/register` — vendor registration form
- `/auth/verify` — email verification flow
- Role-based middleware routing (vendor → dashboard, staff → queue, admin → admin)
- Vendor profile auto-created on first login
- Protected routes with unauthenticated redirect
- `/vendor/dashboard` shell
- `/staff/queue` shell

### ✅ Stage 2b — Google OAuth for Vendors
- "Continue with Google" button added to login page (below email/password form)
- `/auth/callback` checks for VendorProfile after OAuth exchange
- `/vendor/profile/complete` page for first-time Google vendors
- Collects: Business Name, Contact Name, Phone
- Supabase Google provider configured
- Google Cloud OAuth 2.0 credentials created and connected

### ✅ Stage 3 — Booth Application & Review (COMPLETE)
- Multi-step booth application form (week(s), booth type/size, product category)
- Document upload via Supabase Storage (M3)
- Vendor application status tracking; staff review queue with approve/reject
- Staff can add an optional rejection note; rejected vendors fully re-edit & resubmit
  (resubmit clears rejectionNote) — no fresh start
- Schema was extended toward Pre-Event Setup pre-Stage-3 (booth types & weeks exist);
  full Pre-Event Setup schema NOT yet confirmed complete

### ✅ Stage 4 — Booth Assignment, Invoicing & Payment (COMPLETE; Stripe deferred)
- Staff-driven booth assignment by booth type (M5), on /staff/applications/[id]
- Invoice generation; order = approve → assign booth → generate invoice (M6)
- Offline payment recording (method, amount, date, reference #, optional notes)
- Invoice + payment-confirmation emails via Resend (src/lib/email.ts)
  ⚠ Resend may not be fully wired (RESEND_API_KEY) — transactional emails may be no-oping
- Online Stripe = PLACEHOLDER, deferred until account keys are set.
  When built, confirmation MUST come from a Stripe webhook, not the client redirect.

### ✅ Stage 4 — Navigation Fix (COMPLETE)
- Detail [id] pages existed but list/index pages were never built → most nav links 404'd
- Queue "All" filter was hardcoded to [SUBMITTED, UNDER_REVIEW], hiding APPROVED apps
  → there was no UI path to assign a booth or generate an invoice

### ✅ Stage 5 — Pre-Event Setup + Public Discovery (COMPLETE)

#### Schema changes (pushed via `prisma db push`)
- `Event`: added `mapEmbedUrl String?`, `updatedAt DateTime @default(now()) @updatedAt`
- `BoothType`: added `whatsIncluded String?`
- New model: `EventAddOn` (id, eventId, boothTypeId?, name, description?, price,
  sortOrder, createdAt) — boothTypeId null = available for all booth types
- `ApplicationAddOn`: FK rerouted from `boothAddOnId → eventAddOnId` (EventAddOn)
- `BoothAddOn` (physical booth level) retained unchanged — not used in application flow
- `Event.updatedAt` required `@default(now())` to backfill one existing row during push

#### Part 1 — Pre-Event Setup (`/admin/events`)
- 10 API routes under `/api/admin/` — full CRUD for events, booth types, add-ons,
  weeks, and doc requirements; all with staff/admin auth guards
- Delete guards: blocks deletes that would break existing application references
- `/admin/layout.tsx` — mirrors staff layout with DB-based role check; "Event Setup"
  nav link added to staff/admin navigation
- `/admin/events` — event list with status badges, date ranges, booth type counts,
  application counts
- `EventForm.tsx` — shared create/edit client component with:
  - Slug auto-suggested from event name (lowercase, spaces → hyphens)
  - Public URL preview: `vendor.cyber-tech.com/fair/[slug]`
  - Publish button guards against missing slug
- `/admin/events/[id]/setup` — 4-tab setup hub:
  - **Booth Types tab:** list with Edit/Delete, link to create/edit forms
  - **Add-Ons tab:** list with per-booth-type or "all" availability indicator
  - **Weeks tab:** fully inline CRUD (add/edit/delete rows)
  - **Doc Requirements tab:** grouped by booth type, inline add/delete per group
- Separate create/edit form pages for booth types and add-ons

#### Part 2 — Public Discovery (`/fair/[slug]`)
- Server-side render; only shows events where `status = OPEN`
- Graceful "not available" message for unpublished or missing slugs (no crash)
- Banner hero: `bannerImageUrl` if set, dark text hero fallback
- Map section: renders `mapEmbedUrl` in sandboxed iframe when set
- Booth type card grid: name, price, size, description, whatsIncluded, applicable
  add-ons (boothTypeId match + null/all), required document list
- Add-ons summary section with pricing
- Application deadline callout when set
- "Request a Booth" CTA — per booth type card + floating button:
  - Guest → redirect to `/auth/login?redirect=/vendor/apply`
  - Vendor (logged in) → `/vendor/applications/new`
  - Staff/Admin → informational message only

#### Bug fix (caught during Stage 5 implementation)
- `src/lib/invoices.ts` had stale references to `boothAddOn` (renamed to `eventAddOn`
  in the Stage 5 schema); corrected includes and all property accesses

### Stage 5 — Smoke Test Results (all passed)
- ✅ Step 1: Create event — form works, slug auto-suggests from name
- ✅ Step 2: Setup hub — booth types, add-ons, weeks, doc requirements
  all create and save correctly
- ✅ Step 3: Publish — blocks without slug, succeeds with slug, status
  flips to OPEN
- ✅ Step 4: Public page — renders without login, booth cards correct,
  "Request a Booth" redirects to /auth/login when logged out
- ✅ Step 5: Vendor application — booth type dropdown populates from
  admin-created data, eventId correctly pre-selected from /fair/[slug]
- ✅ Step 6: Invoice page — loads without boothAddOn reference errors

### Stage 5 — Bugs Found and Fixed During Testing
- /fair/[slug] redirected to login — fixed by whitelisting /fair/* as
  public in src/proxy.ts
- "Request a Booth" defaulted to wrong event — fixed by passing eventId
  as query parameter from /fair/[slug] to /vendor/applications/new
- Document labels invisible on Step 3 (Documents) — contrast fix applied
- Review card text invisible on Step 4 (Review) — contrast fix applied

### Stage 5 — Known Ongoing Issue
- Dark surface text contrast problems exist throughout the app on the
  festive (dark) surface. Being fixed incrementally as encountered.
  Not blocking. Track and resolve before public launch.

#### Convention established
- Different booth sizes = different `BoothType` rows (Option A — no `BoothTypeWeek`
  join table; all weeks available for all booth types)

---

## Workflow Decisions Confirmed

| Decision | Choice |
|---|---|
| Rejected vendor flow | Can fully re-edit and resubmit (not start fresh) |
| Booth assignment | Staff-driven based on booth type; vendor preferences handled offline |
| Online payment | Stripe |
| Offline payment | Check/Zelle — staff manually records method, amount, date, reference, notes |
| Vendor check-in | Physical sign-in; staff marks present with auto timestamp (no QR codes) |
| Staff account creation | Admin-only, not through public /auth/register |
| Google OAuth | Vendors only; staff/admin use email/password |
| Booth size variants | Different sizes = separate BoothType rows (no size join table) |
| Week availability | All weeks available for all booth types (Option A — no BoothTypeWeek join table) |
| Add-on scope | boothTypeId null = available to all booth types; set = specific type only |

## Open Decisions

1. Should offline payment confirmation email be auto-sent or manually triggered by staff?
2. Final font decision: Cinzel/Inter vs. Glowfest's actual brand fonts?

---

## Known Issues & Fixes

| Issue | Fix |
|---|---|
| Next.js middleware must be `src/middleware.ts` | Claude Code had renamed it — always verify filename |
| Prisma v7 requires `@prisma/adapter-pg` | Use `DATABASE_URL` port 6543 (runtime), `DIRECT_URL` port 5432 (migrations) |
| shadcn v4 broke `asChild` Button pattern | Restored Slot pattern manually |
| Supabase free tier SMTP rate limit (3/hour) | Disabled email confirmation during dev; re-enable when Resend configured |
| Next.js 16 deprecates `middleware.ts` | Renamed to `proxy.ts` — enforced in all prompts |
| Project was in Box/OneDrive (sync conflicts) | Moved to `C:\Users\vince\code-projects\fairhub-vms` |
| Prisma config/client split | `prisma.config.ts` must be `defineConfig` only; PrismaClient singleton in `src/lib/prisma.ts` |
| `Event.updatedAt` backfill error on db push | Added `@default(now())` alongside `@updatedAt` to allow backfill of existing rows |
| `invoices.ts` stale `boothAddOn` references | Updated to `eventAddOn` after Stage 5 schema rename |

---

## Infrastructure

| Service | Status | Notes |
|---|---|---|
| Vercel | ✅ Live | Auto-deploys on GitHub push |
| Supabase | ✅ Live | Project ID: jggxctktrpogbhktrsi, West US |
| GitHub | ✅ Live | https://github.com/litetrek/fairhub-vms |
| Resend | ✅ Account ready | Not yet configured in app (RESEND_API_KEY not set) |
| Twilio | ✅ Account ready | Not yet configured in app |
| Stripe | ✅ Account ready | Not yet configured in app |
| Google OAuth | ✅ Live | Reused existing Google Cloud project |

---

## On the Horizon

### ✅ Stage 6A — QA Framework Setup (COMPLETE)

#### Test Framework
- Vitest — unit and API route tests (no browser, fast)
- Playwright — E2E browser tests (full user flows)
- Two-laptop workflow established:
  - Main laptop: app code in src/ (Claude Code)
  - QA laptop: test code in tests/ (Claude Code)

#### Packages Added (devDependencies)
- vitest, @vitest/coverage-v8, @vitejs/plugin-react
- vitest-mock-extended
- @playwright/test

#### Configuration Files Created
- vitest.config.ts — unit test runner config
- playwright.config.ts — E2E browser test config

#### Test Infrastructure Created
- tests/unit/setup.ts — global Prisma + Supabase mocks
- tests/unit/__mocks__/prisma.ts — reusable mock data factories
- tests/unit/__mocks__/supabase.ts — Supabase auth mock
- 4 unit stub files ready (auth, vendor, staff, admin API)
- 7 E2E stub files ready (all major flows)

#### Tests Written and Passing
Unit (Vitest): 10 passed, 0 failed
  - invoices.test.ts — full generateInvoice() coverage:
    1. Invoice number format INV-YYYY-0001
    2. Sequence increment (0005 → 0006)
    3. Booth line item — single week price
    4. Booth line item — multi-week price calculation
    5. Add-on line items — correct description and price
    6. Total calculation — subtotal + tax = total
    7. Zero add-ons case — base price only
    8. Error path — application not found
    9. Error path — invoice already exists
    10. Error path — no booth assignment

E2E (Playwright): 3 passed, 0 failed
  - public-discovery.spec.ts:
    1. Valid slug loads without 500, shows <h1>
    2. Invalid slug shows graceful "not available" message
    3. Guest CTA redirects to /auth/login

#### npm Scripts Added
- npm run test:unit — run unit tests once
- npm run test:unit:watch — watch mode
- npm run test:unit:coverage — with coverage report
- npm run test:e2e — run E2E tests
- npm run test:e2e:ui — interactive Playwright UI
- npm run test:e2e:report — view HTML report
- npm run test — run all tests

#### Infrastructure Discovery (Fixed During Setup)
- Found that Stages 3–5 code was never committed to GitHub
- 91 files (8,902 lines) committed in one batch
- Vercel production now has complete codebase
- middleware.ts stale file found and removed from repo
- .env.example to be added in Stage 6B

#### Stage 6A — Commit History
- e4952eb  test: Stage 6A — Vitest + Playwright setup,
           invoices unit tests, public discovery E2E
- 5fd8c14  feat: commit all Stage 2-5 work
- b2c8eff  fix: remove deprecated middleware.ts
- 4bae683  docs: expand CLAUDE.md with full project briefing

### ✅ Stage 6B — API Unit Tests (COMPLETE)

#### Results
53 tests passing, 0 failed (includes 10 carried over from 6A)

| File | Tests | Coverage |
|---|---|---|
| auth/register.test.ts | 7 | POST /api/auth/create-profile (OAuth profile completion) |
| vendor/applications.test.ts | 9 | Server actions: createDraft, submit, updateBoothType, updateWeeks |
| staff/applications.test.ts | 6 | updateApplicationStatus approve/reject flows |
| admin/events.test.ts | 13 | POST events, PATCH/publish, DELETE booth-type, POST weeks |
| lib/payments.test.ts | 6 | recordPayment — CHECK/ZELLE, PAID/PARTIALLY_PAID, overpayment, referenceNumber |
| lib/invoices.test.ts | 10 | Full generateInvoice() coverage (carried from 6A) |
| **Total** | **53** | **0 failed** |

#### Stage 6B — Commit
- 7f96d78  test: Stage 6B — API unit tests, 53 passing

#### Spec Deviations Found (Real App Behavior Documented)

These deviations from the original test plan reveal actual app
behavior and require decisions/fixes before production launch:

**DEV-1 — Vendor/staff logic is server actions, not REST routes**
- auth, vendor, and staff flows use Next.js server actions
- not traditional REST API route handlers
- Tests updated to reflect actual implementation
- Status: Documented, no fix needed

**DEV-2 — Duplicate email returns 200 {existing:true} not 409**
- OAuth profile completion endpoint returns 200 with
  {existing: true} flag instead of standard 409 conflict
- Missing fields return 400 (not 422 as originally planned)
- Decision: Keep as-is — appropriate for OAuth flow context
- Status: Documented

**DEV-3 — Auth guard returns 401 for vendor callers (not 403)**
- Vendor hitting a staff/admin route gets 401 (unauthenticated)
  instead of correct 403 (authenticated but unauthorized)
- 401 = not authenticated; 403 = authenticated, not authorized
- A vendor IS authenticated — this is a bug
- Status: ⚠ Fix needed on main laptop before production

**DEV-4 — Staff can access admin routes (no admin-only guard)**
- requireStaffOrAdmin passes for both STAFF and ADMIN roles
- Admin-only routes (/api/admin/*) have no staff exclusion
- Staff could accidentally create/delete events
- Status: ⚠ Security fix needed on main laptop before production

#### Known Security Fixes Required Before Production
1. Fix 401→403 for authenticated vendor hitting staff/admin routes
2. Add admin-only guard to /api/admin/* routes
   (currently allows STAFF role through)

### Stage 6C — E2E Auth Flows (NEXT)
- Login flow (email/password vendor)
- Register flow (new vendor)
- Role-based redirects (vendor→dashboard, staff→queue, admin→events)
- Unauthenticated redirect to /auth/login
- Google OAuth callback with no profile → /vendor/profile/complete
- Target: ~8 E2E tests in tests/e2e/auth.spec.ts

### Stage 6D — E2E Vendor Journey (PLANNED)
- Full application flow: apply → submit → view status
- Rejected vendor re-edit and resubmit flow
- Target: ~7 E2E tests in tests/e2e/vendor-application.spec.ts

### Stage 6E — E2E Staff Journey (PLANNED)
- Review queue → approve/reject → assign booth → generate invoice
- Record offline payment → invoice status updates
- Target: ~8 E2E tests in tests/e2e/staff-review.spec.ts +
  tests/e2e/booth-assignment.spec.ts + tests/e2e/invoicing.spec.ts

### Stage 6F — E2E Admin Journey (PLANNED)
- Create event → setup booth types/add-ons/weeks → publish
- Confirm public page appears at /fair/[slug]
- Target: ~6 E2E tests in tests/e2e/admin-setup.spec.ts

### Stage 7+ — Remaining Modules
- **M7 Communication:** vendor messaging (email/SMS via Resend + Twilio)
- **M8 Event Check-in:** staff marks vendor present with auto timestamp
- **Stripe live integration:** webhook-driven payment confirmation
  (must come from Stripe webhook, never the client redirect)

---

## Workflow

- **Claude.ai** → architecture decisions, planning, writing Claude Code prompts
- **Claude Code in VS Code terminal** → all code implementation
- Paste prompts from Claude.ai directly into Claude Code — no Cowork for coding tasks

---

## ⚠ Prisma 7 — prisma.config.ts vs the client (fixed this session)
- The Prisma CLIENT singleton (PrismaClient + @prisma/adapter-pg Pool, runtime pooled
  connection = DATABASE_URL) lives in `src/lib/prisma.ts` with the dev hot-reload guard;
  all app imports point there. NEVER put client instantiation in `prisma.config.ts`.
- `prisma.config.ts` is a RESERVED Prisma 7 config file, required for db pull/push/migrate.
  It must export `defineConfig` (NOT a PrismaClient). Correct shape:
  - Loads env from `.env.local` (project has NO `.env`; Prisma 7 CLI doesn't auto-load env)
  - `datasource.url = env("DIRECT_URL")` ← CLI uses this for migrations (port 5432 direct,
    not the pooled 6543 connection)
- Symptom if broken: "Failed to parse syntax of config file at ...prisma.config.ts"
  on any prisma CLI command.

---

*Last updated: Stage 6B complete — 53 unit tests passing, deviations documented, Stage 6C E2E auth flows next*
