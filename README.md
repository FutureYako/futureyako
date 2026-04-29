# SaveWise — Automated Savings & Investments

A complete user journey built with **Next.js 16** (App Router) and **Tailwind CSS v4**, implementing every screen from the user journey overview: sign up → login → link funding sources → wallet creation → portfolio setup (autosaving, goals, routing, review, success) → dashboard → bank/mobile wallets → investments.

## Stack

- **Next.js 16** (App Router, Server Components, TypeScript)
- **Tailwind CSS v4** (using new `@theme` directive and CSS-first config)
- **React 19**

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/signup`.

## Routes

| Route                  | Screen                              |
| ---------------------- | ----------------------------------- |
| `/signup`              | Sign Up                             |
| `/login`               | Login                               |
| `/link-sources`        | Link Funding Sources                |
| `/wallet-created`      | Wallet Created success              |
| `/setup/autosaving`    | Autosaving preferences (Step 1/5)   |
| `/setup/goals`         | Goals setup (Step 2/5)              |
| `/setup/routing`       | Savings routing (Step 3/5)          |
| `/setup/review`        | Review & confirm (Step 4/5)         |
| `/setup/success`       | Setup success (Step 5/5)            |
| `/dashboard`           | Main dashboard with portfolio chart |
| `/wallet/bank`         | Bank wallet detail                  |
| `/wallet/mobile`       | Mobile money wallet detail          |
| `/investments`         | Investment opportunities            |

## Project structure

```
app/
  layout.tsx               # Root layout (Inter font, globals)
  globals.css              # Tailwind v4 @import + @theme tokens
  page.tsx                 # Redirects to /signup
  signup/page.tsx
  login/page.tsx
  link-sources/page.tsx
  wallet-created/page.tsx
  setup/
    layout.tsx             # AppShell wrapper
    autosaving/page.tsx
    goals/page.tsx
    routing/page.tsx
    review/page.tsx
    success/page.tsx
  dashboard/
    layout.tsx
    page.tsx
  wallet/
    layout.tsx
    bank/page.tsx
    mobile/page.tsx
  investments/
    layout.tsx
    page.tsx
components/
  icons/index.tsx          # All inline SVG icons
  layout/
    AppShell.tsx           # Sidebar + Topbar + main wrapper
    Sidebar.tsx
    Topbar.tsx
  ui/
    Stepper.tsx            # 5-step progress indicator
    Charts.tsx             # DonutChart + SparkLine (pure SVG)
lib/
  constants.ts             # SETUP_STEPS
```

## Tailwind v4 setup

The `@theme` directive in `app/globals.css` defines design tokens — brand colors, semantic colors, fonts, radii — that auto-generate utility classes (e.g. `bg-brand-500`, `text-success`).

```css
@import "tailwindcss";

@theme {
  --color-brand-500: #6c63ff;
  /* … */
}
```

PostCSS uses `@tailwindcss/postcss` (the v4 plugin).

## Notes

- All pages are Client Components where state/navigation is needed (`"use client"`).
- Charts are pure SVG — no external chart library required.
- The Stepper, Sidebar, and form patterns are fully reusable across the setup flow.
- Dashboard navigation links cross-link the wallet detail pages and back to setup.
