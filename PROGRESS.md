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
| M2 | Booth Application (multi-step form) | 🔲 Stage 3 |
| M3 | Compliance & Documents (uploads) | 🔲 Stage 3 |
| M4 | Approval Workflow (staff review, approve/reject) | 🔲 Future |
| M5 | Booth Assignment (staff-driven) | 🔲 Future |
| M6 | Invoicing & Payment | 🔲 Future |
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

### 🔲 Stage 3 — Booth Application + Document Uploads (NEXT)
- Multi-step booth application form (`/vendor/applications/new`)
- Document upload (business license, seller's permit, health permit, insurance)
- Supabase Storage integration
- Application status tracking
- Staff queue showing submitted applications

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

## Open Decisions (resolve before Stage 3)

1. Should offline payment confirmation email be auto-sent or manually triggered by staff?
2. Should staff be able to add a rejection reason note when sending application back?
3. Does booth assignment happen before or after invoice generation?

---

## Known Issues & Fixes

| Issue | Fix |
|---|---|
| Next.js middleware must be `src/middleware.ts` | Claude Code had renamed it — always verify filename |
| Prisma v7 requires `@prisma/adapter-pg` | Use `DATABASE_URL` port 6543 (runtime), `DIRECT_URL` port 5432 (migrations) |
| shadcn v4 broke `asChild` Button pattern | Restored Slot pattern manually |
| Supabase free tier SMTP rate limit (3/hour) | Disabled email confirmation during dev; re-enable when Resend configured |
| Next.js 16 deprecates `middleware.ts` | Rename to `proxy.ts` — TODO before Stage 3 |
| Project was in Box/OneDrive (sync conflicts) | Moved to `C:\Users\vince\code-projects\fairhub-vms` |

---

## Infrastructure

| Service | Status | Notes |
|---|---|---|
| Vercel | ✅ Live | Auto-deploys on GitHub push |
| Supabase | ✅ Live | Project ID: jggxctktrpogbhktrsi, West US |
| GitHub | ✅ Live | https://github.com/litetrek/fairhub-vms |
| Resend | ✅ Account ready | Not yet configured in app |
| Twilio | ✅ Account ready | Not yet configured in app |
| Stripe | ✅ Account ready | Not yet configured in app |
| Google OAuth | ✅ Live | Reused existing Google Cloud project |

---

## Workflow

- **Claude.ai** → architecture decisions, planning, writing Claude Code prompts
- **Claude Code in VS Code terminal** → all code implementation
- Paste prompts from Claude.ai directly into Claude Code — no Cowork for coding tasks

---

*Last updated: Stage 2b complete — Google OAuth working*
