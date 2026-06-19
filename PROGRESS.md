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
| M6 | Invoicing & Payment | ✅ Complete (Stripe live — Stage 7) |
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
| Stripe key placeholder in .env.local | Replace with real `sk_test_...` key; restart dev server |
| Supabase session lost on Stripe redirect | Route success/cancel URLs through /auth/login with `redirect` param |
| `useSearchParams()` requires Suspense | Wrap page default export in `<Suspense>`; extract inner client component |

---

## Infrastructure

| Service | Status | Notes |
|---|---|---|
| Vercel | ✅ Live | Auto-deploys on GitHub push |
| Supabase | ✅ Live | Project ID: jggxctktrpogbhktrsi, West US |
| GitHub | ✅ Live | https://github.com/litetrek/fairhub-vms |
| Resend | ✅ Account ready | Not yet configured in app (RESEND_API_KEY not set) |
| Twilio | ✅ Account ready | Not yet configured in app |
| Stripe | ✅ Live (test mode) | Checkout live as of Stage 7 |
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
- Status: ✅ FIXED — `requireStaffOrAdmin()` in `src/lib/guards.ts` now
  checks session first (401 if absent) then role (403 if VENDOR).
  All /api/admin/* routes use the centralized guard.

**DEV-4 — Staff can access admin routes (no admin-only guard)**
- requireStaffOrAdmin passes for both STAFF and ADMIN roles
- Admin-only routes (/api/admin/*) have no staff exclusion
- Staff could accidentally create/delete events
- Status: ✅ FIXED — Added `requireAdmin()` to `src/lib/guards.ts` that
  rejects any role that is not strictly ADMIN (returns 403 for STAFF and
  VENDOR). All 10 /api/admin/* route files now import and call
  `requireAdmin()`. `requireStaffOrAdmin()` retained for future
  /api/staff/* routes. No known security fixes remain outstanding.

#### Known Security Fixes Required Before Production
~~DEV-3~~ ✅ Resolved  
~~DEV-4~~ ✅ Resolved  
No outstanding security fixes.

### Deployment — vendor.cyber-tech.com Live (June 10, 2026)
- DNS: CNAME record added in Dynadot pointing to Vercel
- All environment variables configured in Vercel (DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, NEXT_PUBLIC_ORG, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY)
- Fixed: TypeScript build failure — excluded tests/ and config files from tsconfig.json
- Fixed: Supabase URL typo in Vercel env vars (jggxctktrpogbhkttrsi)
- Fixed: Connection string quotes removed in Vercel env vars
- Google OAuth working end-to-end on production
- Stripe test keys added to .env.local and Vercel
- Site live at https://vendor.cyber-tech.com — QA smoke test passed
- Resend: deferred (not yet configured)
- Stripe webhook: added in Stage 7

### ✅ Stage 7 — Stripe Checkout Integration (COMPLETE)
Commit: d09a565

#### New files
- `src/lib/stripe.ts` — Stripe singleton (apiVersion `2026-05-27.dahlia`, Stripe v22)
- `src/app/api/vendor/invoices/[id]/checkout/route.ts` — creates Checkout Session;
  reuses open sessions; guards invoice ownership and status (SENT or PARTIALLY_PAID only)
- `src/app/api/webhooks/stripe/route.ts` — handles `checkout.session.completed`;
  creates Payment record (method=STRIPE); recalculates invoice status; fully idempotent
- `src/app/vendor/invoices/[id]/PayButton.tsx` — client component with loading state
  and inline error display
- `src/app/vendor/invoices/[id]/PaymentBanner.tsx` — dismissible green/yellow banners
  for `payment=success` and `payment=cancelled` return params

#### Modified files
- `prisma/schema.prisma` — added `stripeCheckoutSessionId String? @unique` and
  `stripePaymentIntentId String? @unique` to Invoice model; added STRIPE to
  PaymentMethod enum; db push + prisma generate run
- `src/app/vendor/invoices/[id]/page.tsx` — replaced disabled placeholder button
  with live PayButton; added PaymentBanner; added STRIPE to METHOD_LABELS display map

#### Environment variables added
- `NEXT_PUBLIC_APP_URL` — set to `http://localhost:3000` in .env.local
- `STRIPE_WEBHOOK_SECRET` — set via `stripe listen` output in .env.local

#### Vercel action items (pending before production go-live)
- Add `NEXT_PUBLIC_APP_URL=https://vendor.cyber-tech.com` to Vercel env vars
- Create webhook in Stripe Dashboard:
  - URL: `https://vendor.cyber-tech.com/api/webhooks/stripe`
  - Event: `checkout.session.completed` (only)
  - Copy `whsec_...` signing secret to Vercel as `STRIPE_WEBHOOK_SECRET`

#### Local test procedure
```
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Test card: `4242 4242 4242 4242`, any future expiry, any CVC

#### Known limitation
Resend email confirmation after Stripe payment not yet implemented.
TODO comment left in `src/app/api/webhooks/stripe/route.ts` at the point
where the payment confirmation email would be sent.

### ✅ Stage 7 — Bug Fixes (COMPLETE)

#### Bug 1 — Stripe secret key not loaded (env var placeholder)
- **Symptom:** "Invalid API Key provided: your_str**********_key" on first
  Stripe Checkout attempt; client received empty response body causing
  "Unexpected end of JSON input"
- **Root cause:** STRIPE_SECRET_KEY in .env.local contained the placeholder
  string from the template, not the real sk_test_... key
- **Fix:** Updated .env.local with real Stripe test secret key; restarted dev server
- No code changes required

#### Bug 2 — Vendor session lost after Stripe Checkout redirect
- **Symptom:** After completing Stripe payment, vendor returned to /auth/login
  instead of their invoice page; Supabase session cookie lost during cross-origin
  redirect (domain → stripe.com → domain)
- **Fix:** Changed `success_url` and `cancel_url` in `checkout/route.ts` to route
  through /auth/login with redirect and payment params:
  ```
  success_url: /auth/login?redirect=/vendor/invoices/[id]&payment=success
  cancel_url:  /auth/login?redirect=/vendor/invoices/[id]&payment=cancelled
  ```
- Updated `auth/login/page.tsx` to read `redirect` and `payment` from
  `useSearchParams()` and push to the redirect destination after successful
  sign-in (when redirect starts with `/vendor/`)
- Updated `auth/callback/route.ts` to honour `?next` and `?payment` params
  through the Google OAuth round-trip

#### Bug 3 — Post-login redirect param not honored
- **Symptom:** After re-login, vendor landed on /vendor/dashboard instead of
  /vendor/invoices/[id]?payment=success
- **Root cause:** `useSearchParams()` can return null during SSR hydration when
  not wrapped in `<Suspense>`, leaving `redirectPath` null inside the handler closure
- **Fix:** Added `new URLSearchParams(window.location.search)` read inside
  `handleLogin` at submit time — guaranteed accurate since the handler only
  runs client-side after form submission

#### Bug 4 — useSearchParams() Suspense boundary missing (build failure)
- **Symptom:** Vercel build failed with "useSearchParams() should be wrapped
  in a suspense boundary at page /auth/login"
- **Root cause:** Next.js 15/16 cannot statically prerender a page that calls
  `useSearchParams()` directly in the page component without a Suspense boundary
- **Fix:** Extracted login form into `LoginContent` client component; wrapped in
  `<Suspense fallback={<div />}>` in the default export `LoginPage`; `'use client'`
  retained at top of file. Build now passes; `/auth/login` shows as `○ (Static)`

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

### Stage 8+ — Remaining Modules
- **M7 Communication:** vendor messaging (email/SMS via Resend + Twilio)
- **M8 Event Check-in:** staff marks vendor present with auto timestamp

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

### ✅ Stage 8A — Admin Panel (COMPLETE)
- Admin dashboard `/admin`: 4 stat cards (Applications, Vendors, Payments, Events) + quick-link buttons to Event Setup and Manage Users
- User management `/admin/users`: full user list table with inline role-change dropdown, self-role-change protection, create staff/admin form (email + password + role)
- Admin Panel nav link in staff layout — visible only when `user.role === 'ADMIN'`, visually distinct (rose colour + shield icon)
- New API routes:
  - `GET  /api/admin/users`            — list all users (returns `currentUserId` for self-guard in UI)
  - `POST /api/admin/users`            — create Supabase auth user + Prisma row (`email_confirm: true`)
  - `PATCH /api/admin/users/[id]/role` — update role; rejects if target === current admin

### ✅ Stage 8B — Event Day Check-In (Complete)

#### Schema changes
Added to `BoothAssignment`:
  - `checkedIn     Boolean   @default(false)`
  - `checkedInAt   DateTime?`
  - `checkedInById String?`
  - `checkedInBy   User?     @relation("CheckedInAssignments", ...)`

Added to `User`:
  - `checkIns  BoothAssignment[]  @relation("CheckedInAssignments")`

Note: The existing unnamed `assignedBy`/`boothAssignments` relation between
User and BoothAssignment was renamed to `"AssignedBoothAssignments"` (required
by Prisma when two relations exist between the same two models).

#### New files
  src/app/api/staff/checkin/route.ts
  src/app/staff/(portal)/checkin/page.tsx
  src/app/staff/(portal)/checkin/[eventId]/page.tsx
  src/app/staff/(portal)/checkin/[eventId]/CheckInClient.tsx

#### Modified files
  prisma/schema.prisma
  src/app/staff/(portal)/layout.tsx

#### How to access
  /staff/checkin → event selector (auto-redirects if one active event)
  /staff/checkin/[eventId] → main check-in screen

#### Stage 9 — Next
  M7 Communication: Resend confirmation emails + vendor instructions
  Prerequisite: RESEND_API_KEY must be configured in Vercel env vars

---

### ✅ Stage 8C — Vendor Self-Service + Document Reuse + Activity Logging (COMPLETE)

#### Feature 1 — Document Reuse

Vendors can reuse previously uploaded documents when starting a new application,
skipping re-upload entirely. Documents are scoped per doc type with labels and
signed-URL preview before reusing.

New API routes:
- `GET  /api/vendor/documents/previous` — all vendor documents grouped by docType,
  most recent first, excluding docs already on the current application
- `POST /api/vendor/documents/reuse` — copies an existing Document row onto the
  current application (same file URL, new applicationId, status=PENDING);
  replaces any existing row of the same docType on the target application

Modified: `src/app/vendor/applications/new/steps/StepDocuments.tsx`
- "Previously uploaded" panel above the upload button for each docType when prior
  docs exist, with doc type label and signed-URL preview link
- "Reuse" button calls the reuse API and marks the docType as uploaded
- Uploading a new file clears the active reuse selection for that docType
- First-time vendors see no change (panel hidden when no prior docs)

#### Feature 2 — Vendor Self-Service (Withdrawal, Deletion, Document Management)

**Schema change:** `WITHDRAWN` added to `ApplicationStatus` enum (`prisma db push` run)

**Application withdrawal / deletion** — business rules enforced server-side:
- `DRAFT` → vendor can permanently delete (child records cascade-deleted first)
- `SUBMITTED` / `UNDER_REVIEW` / `CONDITIONALLY_APPROVED` → vendor can withdraw
- `APPROVED` → withdraw allowed only if invoice not yet PAID or PARTIALLY_PAID
- `APPROVED` + invoice paid → API returns 400; no UI button shown
- `WITHDRAWN` / `REJECTED` → no action available

New API routes:
- `DELETE /api/vendor/applications/[id]` — deletes DRAFT application + all child records
- `PATCH  /api/vendor/applications/[id]/withdraw` — sets status to WITHDRAWN

New component: `src/components/vendor/ApplicationActions.tsx` (client)
- Renders Delete (red) or Withdraw (outline) button based on status + invoice state
- Confirmation dialog before any destructive action
- Delete → redirects to /vendor/applications; Withdraw → router.refresh()

Updated pages:
- `/vendor/applications` — WITHDRAWN status badge; ApplicationActions rendered per row;
  invoice status included in query so button logic works
- `/vendor/applications/[id]` — ApplicationActions in header; WITHDRAWN shows
  read-only detail view (no redirect to edit)

**My Documents page enhancements:**
- Filenames are clickable signed URLs (1-hour expiry) — vendor can preview documents
- Trash icon per row — deletes doc record + removes file from Supabase Storage;
  blocked if doc is attached to a live (submitted/approved) application
- New "Upload a document" panel — vendor picks doc type + file, uploads standalone
  (applicationId = null); immediately available in the reuse panel for future applications

New API routes:
- `POST   /api/vendor/documents`      — creates standalone Document record
- `DELETE /api/vendor/documents/[id]` — deletes DB record + Supabase Storage file

New component: `src/app/vendor/documents/DocumentsClient.tsx` (client)
- Manages local doc state (optimistic delete)
- Upload form uses browser Supabase client for storage, then calls POST API
- `src/app/vendor/documents/page.tsx` converted to thin server component —
  fetches docs + generates signed URLs, passes serialized data to DocumentsClient

#### Feature 3 — UX Refactor: Application List + Detail Consolidation

- `/vendor/applications` — table rows are now fully clickable (navigate to detail page);
  per-row action buttons removed; cleaner layout
- `/vendor/applications/[id]` — all actions (Withdraw, Delete, Edit, Resubmit) consolidated
  on the detail page where vendor has full context before deciding

#### Feature 4 — Vendor Activity Logging

All vendor-initiated portal actions logged to a new `VendorActivityLog` table with
timestamp, action type, optional detail string, application context, and IP address.

**Schema changes:**
- New model `VendorActivityLog` (id, vendorId, applicationId?, action, detail?, ipAddress?, createdAt)
- `application` relation uses `onDelete: SetNull` — when an application is deleted,
  log entries are preserved as account-level records (applicationId nullified by Postgres)
- Back-relations added to `VendorProfile` and `Application`
- `prisma db push` + `prisma generate` run (SetNull is Prisma's default for nullable FK fields;
  the annotation makes it explicit)

New helper: `src/lib/vendor-activity.ts`
- `logVendorActivity()` — wrapped in try/catch; a log failure never breaks the main request
- `getIpFromRequest()` — reads `x-forwarded-for` / `x-real-ip` headers; returns null for server actions

**11 actions logged across 8 call sites:**

| Action | Where |
|---|---|
| LOGIN | auth/callback (OAuth) + auth/actions.ts (email/password) |
| APPLICATION_CREATED | `createDraftApplication()` in applications.ts |
| APPLICATION_SUBMITTED | `submitApplication()` when previous status was DRAFT |
| APPLICATION_RESUBMITTED | `submitApplication()` when previous status was REJECTED |
| APPLICATION_WITHDRAWN | withdraw route |
| APPLICATION_DELETED | delete route (written with applicationId=null after app is gone) |
| DOCUMENT_UPLOADED | `createDocumentRecord()` in applications.ts |
| DOCUMENT_REUSED | reuse route |
| DOCUMENT_DELETED | document delete route (application-scoped) |
| STANDALONE_DOCUMENT_UPLOADED | documents POST route |
| STANDALONE_DOCUMENT_DELETED | document delete route (standalone) |

**Staff view:** `/staff/applications/[id]` — single unified "Activity log" card merging
vendor actions and staff approval actions into one chronological timeline (newest first).
Vendor entries shown in blue labelled "Vendor"; staff entries show reviewer email.
Applications predating the activity log get a synthetic "Application created" entry
from `application.createdAt` so the timeline always has an anchor. `take: 10` limit
removed from approvalLogs query.

**Admin view:**
- New page `/admin/users/[id]` — full account-level activity log for any vendor,
  including IP address and truncated application ID reference
- `/admin/users` — "Activity" column added; VENDOR rows link to the detail page

**Notes:**
- IP is null for server actions (no `Request` object available in that context)
- LOGOUT is not logged server-side; Supabase sign-out is client-side (TODO for future)

#### Bug fixes (same session)
- Back button invisible on dark festive surface in application wizard steps (Booth Type,
  Documents, Review) — changed from `variant="outline"` (transparent) to
  `variant="secondary"` (solid background) on all three steps

*Last updated: unified activity log on staff detail page; Back button contrast fix.*
