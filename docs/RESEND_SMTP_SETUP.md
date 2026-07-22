# Email Verification via Resend Custom SMTP (Supabase)

VendorHub keeps **Supabase Auth** for registration and sessions. Verification emails
are delivered through **Resend SMTP** configured in the Supabase Dashboard, bypassing
Supabase's built-in SMTP limit (3 emails/hour on the free tier).

Transactional emails (invoices, payment confirmations) continue to use the Resend API
via `src/lib/email.ts` and `RESEND_API_KEY`.

---

## Prerequisites

1. Resend account: https://resend.com
2. Verified sending domain (recommended: `vendor.cyber-tech.com`) or Resend test domain for dev
3. Supabase project: `jggxctktrpogbhktrsi`

---

## Step 1 — Resend: API key + domain

1. Resend Dashboard → **Domains** → add `vendor.cyber-tech.com` (or use test domain in dev)
2. Add the DNS records Resend provides (SPF, DKIM) in Dynadot/GreenGeeks
3. Resend Dashboard → **API Keys** → create key → copy `re_...`
4. Add to `.env.local` and Vercel:
   ```
   RESEND_API_KEY=re_...
   ```

---

## Step 2 — Supabase: Custom SMTP (Resend)

Supabase Dashboard → **Project Settings** → **Authentication** → **SMTP Settings**

| Field | Value |
|---|---|
| Enable custom SMTP | ON |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your Resend API key (`re_...`) |
| Sender email | `noreply@vendor.cyber-tech.com` (must match verified domain) |
| Sender name | `VendorHub` |

Save settings.

---

## Step 3 — Supabase: Enable email confirmation

Authentication → **Providers** → **Email**:

- ✅ Enable email confirmations
- Confirm email template: customize if desired (link goes to `/auth/callback`)

Authentication → **URL Configuration**:

| Setting | Value |
|---|---|
| Site URL | `https://vendor.cyber-tech.com` (or `http://localhost:3000` for local) |
| Redirect URLs | Add `https://vendor.cyber-tech.com/auth/callback` and `http://localhost:3000/auth/callback` |

---

## Step 4 — App env vars

Ensure these are set in `.env.local` and Vercel:

```
NEXT_PUBLIC_APP_URL=https://vendor.cyber-tech.com
RESEND_API_KEY=re_...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Registration flow (with confirmation enabled)

1. Vendor submits `/auth/register` → Supabase sends verification email via Resend SMTP
2. No session yet → vendor sees `/auth/verify-email?email=...` (can resend)
3. Vendor clicks link → `/auth/callback` → session created
4. Callback runs `ensureVendorUser()` → creates Prisma `User` + `VendorProfile` from signup metadata
5. Redirect to profile onboarding if incomplete → `/vendor/profile/complete?setup=true`

When confirmation is **disabled** (local dev), register returns a session immediately
and creates the profile via `/api/auth/create-profile` as before.

---

## Testing locally

1. Configure Resend SMTP in Supabase (same project used by local `.env.local`)
2. `npm run dev`
3. Register a new vendor email at `/auth/register`
4. Check inbox — email should come from `noreply@vendor.cyber-tech.com`
5. Click verify link → should land on profile onboarding
6. Test resend on `/auth/verify-email`

---

## Troubleshooting

| Symptom | Check |
|---|---|
| No email received | Resend Dashboard → Logs; Supabase Auth logs; spam folder |
| "Error sending confirmation email" | SMTP password = API key; sender domain verified in Resend |
| Verify link → login error | Redirect URL whitelisted in Supabase; `NEXT_PUBLIC_APP_URL` correct |
| Login works but redirect loop | Prisma `User` row missing — callback should create it; check server logs |
| Still hitting 3/hour limit | Custom SMTP not enabled — still using Supabase built-in mailer |

---

## Resend sending limits

- Free tier: 100 emails/day, 3,000/month (sufficient for fair vendor onboarding)
- Upgrade Resend plan if volume exceeds limits during peak registration
