# CLAUDE.md

## Project

**fazer** — a collaborative todo list app with real-time updates.

## Product goals

- Feel calm, fast, and frictionless.
- Work reliably across devices and network conditions.
- Start simple, but do not block future growth.

---

## Stack

- **Frontend:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Realtime)
- **Hosting:** Vercel
- **Auth:** Google sign-in via Supabase Auth (email, name, avatar)
- **i18n:** next-intl (locale-agnostic URLs, browser detection)

---

## Core behaviors

- Lists are shareable via unguessable links.
- Anonymous users may **VIEW** shared lists.
- Only authenticated users may **EDIT** lists.
- List items update live for all connected users via Supabase Realtime.

---

## Design & UX principles

- Simple, minimal, calm UI.
- Frictionless and obvious UX.
- No visual noise or unnecessary ornamentation.
- Prefer clarity and whitespace over density.
- Fully responsive and usable on:
  - mobile
  - tablet
  - laptop
  - desktop
- Mobile-first layout and comfortable touch targets.
- Light and dark mode support.
- Default to the user’s system color scheme.
- UI should feel fast, unobtrusive, and predictable.

---

## PWA, responsiveness, and offline-first behavior

- The app must be installable as a **Progressive Web App (PWA)**:
  - “Add to Home Screen” on mobile devices
  - Runs in standalone / app-like mode
- The app shell must load offline:
  - routes, layout, UI, and static assets
- Offline behavior expectations:
  - Anonymous users can view shared lists offline *if previously opened*
  - Authenticated users can view recently opened lists offline
  - Authenticated users can create and edit list items offline
  - Offline edits are queued locally and synced when connectivity returns
- When offline:
  - Show a clear offline indicator
  - Disable realtime-dependent features
  - Never allow actions to silently fail
- Conflict handling:
  - Start with last-write-wins
  - Keep sync logic isolated and extensible

---

## Development rules

- Work incrementally; prefer clarity over cleverness.
- Explain architectural decisions briefly when they matter.
- Use Supabase-generated TypeScript types in the frontend.
- Use Row Level Security (RLS) for **all** access control.
- Never push directly to `main` — always use feature branches.
- Do not delete cloud resources.
- Avoid shortcuts that block future scaling or offline support.
- Prefer predictable, well-understood patterns over novelty.

### Components

- **Use shadcn/ui components** whenever possible (Button, Dialog, Input, etc.)
- Create **reusable custom components** in `components/` when:
  - No shadcn component exists for the use case
  - The design diverges significantly from shadcn defaults
- Keep custom components minimal and composable
- Follow shadcn patterns (variants, slots, cn() for className merging)

---

## Project structure

app/           # Next.js App Router pages and layouts
components/    # Reusable React components
lib/           # Shared utilities (e.g. cn(), helpers)
lib/i18n/      # i18n configuration
lib/supabase/  # Supabase client utilities
lib/sync/      # Offline queue, sync engine, reconciliation logic
messages/      # Translation files (en.json, pt.json, etc.)
i18n/          # next-intl request config
supabase/      # Supabase config, migrations, and types
pwa/           # PWA assets (manifest, icons, service worker config)
public/        # Static assets


---

## Commands

```bash
npm run dev       # Start dev server (Turbopack, hot reload)
npm run build     # Production build (webpack, for Serwist SW generation)
npm run dev:pwa   # Build + start for local PWA/service worker testing
npm run lint      # Run ESLint
```

---

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page / list overview for authenticated users |
| `/login` | Sign-in page |
| `/l/[id]` | View/edit a list (authenticated) |
| `/s/[token]` | Public share link (read-only for anonymous) |

---

## Internationalization (i18n)

- Uses **next-intl** for translations
- Supported locales: `en` (English), `pt` (Portuguese)
- URLs are locale-agnostic (no `/en/` or `/pt/` prefixes)
- Detects user's browser language by default
- User can override via Settings modal
- Override stored in localStorage (`fazer-locale`) only if different from browser default
- Translation files in `messages/` directory

---

## Versioning & releases

- Use **semantic versioning** (`0.MINOR.PATCH` while pre-1.0).
  - `0.MINOR.0` — new features (e.g., PWA support, offline sync)
  - `0.x.PATCH` — bug fixes, small improvements
- Create a **GitHub Release** for each feature PR merged to `main`.
- Workflow after merging a feature PR:
  1. Bump `version` in `package.json`
  2. Commit the bump to `main`
  3. Tag: `git tag vX.Y.Z`
  4. Push tag: `git push origin vX.Y.Z`
  5. Create release: `gh release create vX.Y.Z --title "vX.Y.Z — Short description" --generate-notes`

---

## Analytics (non-MVP)

- Add basic, privacy-conscious product analytics after MVP.
- Prefer a lightweight approach with event tracking (e.g., PostHog).
- Do not block MVP on analytics.
- Track only essential events (auth, list/item actions, share usage).
- Avoid collecting sensitive content (e.g., full todo text) in analytics events.