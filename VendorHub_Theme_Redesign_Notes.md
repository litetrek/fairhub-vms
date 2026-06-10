# VendorHub — Theming Redesign Notes

**Date:** June 9, 2026
**Project:** VendorHub (vendor management system)
**This deployment:** Official Glowfest site — `vendor.glowfest.com`
**Stack:** Next.js 14 (App Router, `src/`), TypeScript, Tailwind CSS, shadcn/ui, Prisma
**Goal of this work:** Restyle the vendor-facing app toward a dark night-market light-festival look (à la glowfest.com), built as a **reusable, themeable system** so other organizations can be re-skinned later. Glowfest is the first theme.

---

## 1. Architecture — the two-layer model

The theming is driven entirely by CSS variables, scoped by two HTML attributes, so shadcn components inherit everything automatically and are never hardcoded per page.

**Layer 1 — Theme (brand colors).** `<html data-theme="glowfest">` sets the brand palette globally: magenta primary, amber secondary, teal accent, magenta focus ring. Every shadcn component picks these up.

**Layer 2 — Surface (treatment).** Each area's layout sets a surface mode:
- `data-surface="festive"` → dark purple backgrounds/cards/borders + ambient radial glows (vendor + auth)
- `data-surface="clean"` → near-white / dark-slate, high legibility (staff). Inherits the magenta primary but stays restrained.

The active theme is selected at deploy time by the `NEXT_PUBLIC_ORG` env var (defaults to `glowfest`).

**Net effect:** vendor-facing pages get the festive glow; the staff dashboard stays clean; one codebase serves multiple orgs by config.

---

## 2. What changed (by stage)

### Stage 1 — Foundation (theme architecture, tokens, fonts)

| File | Change |
|------|--------|
| `src/themes/types.ts` | `Theme` interface — `id`, `displayName`, logo/hero paths, font family names |
| `src/themes/glowfest.ts` | Glowfest config object (the values for the above) |
| `src/themes/index.ts` | `getActiveTheme()` — reads `NEXT_PUBLIC_ORG`, falls back to `glowfest` |
| `src/app/globals.css` | Added `--font-display` to `@theme inline`; three scoped token blocks (`[data-theme="glowfest"]`, `[data-surface="festive"]`, `[data-surface="clean"]`); glow utility classes; `h1–h6` default to the display font |
| `src/app/layout.tsx` | Two variable-mode `next/font` families (Inter + Cinzel); `data-theme={theme.id}` on `<html>`; font vars on `className` |
| `src/app/vendor/layout.tsx` | `bg-background` + `data-surface="festive"` |
| `src/app/staff/layout.tsx` | `bg-background` + `data-surface="clean"` |
| `src/app/auth/layout.tsx` | `bg-background` + `data-surface="festive"` |

**Glow hooks:** three CSS variables (`--glow-primary` / `--glow-secondary` / `--glow-accent`) and matching utility classes (`glow-primary` / `glow-secondary` / `glow-accent`), defined only on the festive surface — no-ops (`none`) on clean.

### Stage 2 — Landing hero

- `/` shows the festive landing page for unauthenticated visitors; logged-in users still auto-redirect to their dashboard.
- CTAs: **"Apply for a Booth"** → `/auth/register`; **"Already applied? Sign in"** → `/auth/login`.
- All brand text / logo / hero pulled from `getActiveTheme()` — nothing hardcoded.
- Hero background uses `theme.heroImagePath` = `/images/glowfest-hero.jpg`. The page renders fine without it (gradient overlay covers the gap), but the photo only appears once the file is in `public/images/`.

### Stage 3 — Component glow polish (festive-scoped)

`globals.css` rules (all scoped to `[data-surface="festive"]`, so staff is untouched):

| Rule | Effect |
|------|--------|
| `[data-slot="button"].bg-primary` | Magenta glow shadow on primary buttons |
| `[data-slot="card"]` | 1px magenta-tinted ring + ambient glow |
| `[data-slot="input/select-trigger/textarea"]` | Explicit dark background (`oklch(0.11 0.04 280)`) — needed because the `dark:bg-input/30` fallback only fires on `.dark`, not our attribute |
| `.status-badge-*` | Defined once for the light surface; festive surface overrides with solid dark bg + high-lightness text (WCAG AA) |

Component files (hardcoded `slate-*` → semantic tokens):

| File | Changes |
|------|---------|
| `ApplicationWizard.tsx` | Stepper dots/connectors/labels → `border-primary` / `bg-primary` / `text-primary-foreground` (active), `border-border` / `bg-muted` (pending) |
| `StepWeeks.tsx` | Selection buttons → `border-primary bg-primary/10` (selected), `border-border bg-card hover:border-primary/50` (unselected); text → semantic |
| `StepBoothType.tsx` | Same selection pattern; doc-type pills → `bg-muted text-muted-foreground`; removed `bg-slate-50 border-slate-200` from summary card |
| `vendor/applications/[id]/page.tsx` | `STATUS_COLORS` + `INVOICE_STATUS_COLORS` → `.status-badge-*`; all `text-slate-*` / `border-slate-*` → semantic; doc status badges → `.status-badge-*` |

**Staff side:** intentionally unchanged. Still uses hardcoded light-surface classes (`bg-slate-100`, `bg-blue-50`, etc.), which read correctly on the clean white surface and are unaffected by any `[data-surface="festive"]` rule.

---

## 3. The Glowfest theme

- **Brand roles:** magenta = primary, amber = secondary, teal = accent, magenta = focus ring.
- **Fonts:** Cinzel (display / headings), Inter (body). *Note: these were chosen as strong on-brand defaults — if exact Glowfest matching is wanted, sample their real fonts and swap.*
- **Assets:** logo + hero image referenced by path in `glowfest.ts`; files live under `public/images/`.

> **Source of truth for exact values:** `src/themes/glowfest.ts` and the scoped blocks in `src/app/globals.css`. Treat those files as canonical rather than any hex listed in notes.

---

## 4. Playbook — re-theming for another org

Adding a new organization (example: `summerfair`) is a config job, not a refactor:

1. **Create the theme config.** Copy `src/themes/glowfest.ts` → `src/themes/summerfair.ts`; change the values (colors, font names, logo/hero paths, display name).
2. **Register it.** In `src/themes/index.ts`, add it to the registry: `summerfair: summerfairTheme`.
3. **Add the token block.** In `src/app/globals.css`, add a `[data-theme="summerfair"]` block (and any new surface variants if their treatment differs from festive/clean).
4. **Add assets.** Drop the org's logo + hero image into `public/images/`, matching the paths set in the config.
5. **Fonts (if different).** If they don't use Inter/Cinzel, add the extra `next/font` imports in `src/app/layout.tsx` and variable-assign them.
6. **Point the deployment at it.** Set `NEXT_PUBLIC_ORG=summerfair` in that deployment's `.env.local`.

### Quick checklist
- [ ] `src/themes/<org>.ts` created with all values filled
- [ ] Registered in `src/themes/index.ts`
- [ ] `[data-theme="<org>"]` block added to `globals.css`
- [ ] Logo + hero files in `public/images/` matching config paths
- [ ] Fonts imported in `layout.tsx` if non-default
- [ ] `NEXT_PUBLIC_ORG=<org>` set in `.env.local`
- [ ] Verify festive (vendor/auth) and clean (staff) surfaces both render correctly

---

## 5. Open items / known issues

- [ ] **Contrast issues — to fix later.** Some elements on the festive surface still need contrast tuning for full legibility / WCAG AA. (Flagged during this chat; not yet resolved.)
- [ ] **Hero photo + logo files** — confirm the real `public/images/glowfest-hero.jpg` and logo files are in place (page degrades gracefully without them, but the photo/logo won't show).
- [ ] **Stripe payment surface** — verify Stripe's embedded Elements read well on the dark festive surface; if they clash, theme them via Stripe's Appearance API or use a lighter container for that card.
- [ ] **Font decision** — confirm whether to keep Cinzel/Inter or swap in Glowfest's actual sampled fonts.

---

*Sequence used this chat: foundation → landing hero → component polish, with the staff dashboard kept clean and the theme kept reusable throughout.*
