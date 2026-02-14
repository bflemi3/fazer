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

### Theme colors

- **Brand color:** Electric Violet `#8B5CF6` — used for PWA theme, manifest, icons
- **Light mode:** shadcn/ui neutral palette (oklch-based CSS variables in `globals.css`)
- **Dark mode:** shadcn/ui neutral dark palette
- Colors are defined as CSS custom properties in `:root` and `.dark` selectors
- Use semantic tokens (`--foreground`, `--muted-foreground`, `--border`, etc.) — never hardcode hex values in components

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

### Frontend component patterns

These patterns are **mandatory** for all new and refactored components.

#### Primitives-only props
Components receive **primitive values** (strings, booleans, numbers) and **callbacks** — never objects or arrays. This makes `memo` effective and keeps components decoupled from parent data shapes.

```tsx
// Good
<ListTitle listId={listId} />

// Bad — passing an object defeats memo and couples child to parent's data shape
<ListTitle list={list} />
```

#### Components own their data
Each component fetches exactly the data it needs using `useSuspenseQuery` (via hooks like `useSuspenseList`) with a **selector**. Data is co-located with its only consumer. Parents do not fetch data and pass it down.

```tsx
const selectName = (list: { name: string }) => list.name

const ListTitle = memo(function ListTitle({ listId }: { listId: string }) {
  const { data: name } = useSuspenseList(listId, { select: selectName })
  // ...
})
```

#### Selectors for render isolation
Use the `select` option on query hooks to narrow the subscribed data slice. React Query's structural sharing means the component only re-renders when its selected value actually changes — not when unrelated fields on the same query update.

- Define selectors as **stable module-level functions** (outside the component) so they don't break memoization.
- Prefer `useSuspenseQuery` / `useSuspenseList` over `useQuery` / `useList` — suspense guarantees `data` is never `undefined`, producing cleaner component code.

#### Thin orchestrator parents
Parent "orchestrator" components own **layout** and **shared state** that multiple children need (e.g., a modal open flag triggered by different children). They should have minimal or no data hooks — only what's needed for coordination. Push all other data and state into children.

#### Suspense boundaries with skeleton fallbacks
Every component that uses `useSuspenseQuery` must have a `<Suspense>` boundary above it. The fallback must be a **skeleton that matches the real content's dimensions** to prevent layout shift. Use the shadcn `Skeleton` component (`@/components/ui/skeleton`).

```tsx
<Suspense fallback={<ListHeaderSkeleton />}>
  <ListHeader listId={listId} />
</Suspense>
```

#### Memo + stable props
- Wrap all components that receive props in `memo`.
- All callback props must use `useCallback`.
- All data props must be primitives.
- This ensures re-renders stay local — a state change in one component never cascades to siblings or children.

#### Derived state from existing data
When a component needs a computed value (e.g., `isOwner`), derive it from data the component already fetches rather than accepting extra props from a parent.

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
types/         # Custom TypeScript declarations (e.g. serwist.d.ts)
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
| `/changelog` | Full changelog rendered from `CHANGELOG.md` |

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
  1. If there are new Supabase migrations, push them to production: `npx supabase db push --linked`
  2. Bump `version` in `package.json`
  3. Commit the bump to `main`
  4. Tag: `git tag vX.Y.Z`
  5. Push tag: `git push origin vX.Y.Z`
  6. Create release: `gh release create vX.Y.Z --title "vX.Y.Z — Short description" --generate-notes`

---

## Changelog & update notifications

- **`CHANGELOG.md`** lives at the project root and is the single source of truth for release notes.
- Write changelog entries for **lay users**, not developers (e.g., "Install Fazer to your home screen" instead of "PWA support with Serwist").
- Each version gets a `## vX.Y.Z` heading followed by bullet points.
- At build time, `next.config.ts` parses `CHANGELOG.md` to extract notes for the current `package.json` version and exposes them as `NEXT_PUBLIC_APP_VERSION` and `NEXT_PUBLIC_RELEASE_NOTES`.
- When the service worker activates an update, `SwUpdateNotifier` shows a toast with the current version's release notes and a "View past updates" link to `/changelog`.
- The `/changelog` route is a static page that renders the full `CHANGELOG.md` with `react-markdown`.
- When releasing a new version, update `CHANGELOG.md` **before** bumping the version in `package.json`.

---

## Completed items management (planned)

- Completed todos should be **hidden by default** to keep long lists clean.
- Provide a way to reveal completed items (e.g., expandable "N completed" section).
- Users should be able to:
  - View completed items
  - Uncomplete individual items (move them back to the active list)
  - Uncomplete all completed items at once
  - Delete all completed items at once
- Details TBD — discuss UX approach when implementing.

---

## Analytics (non-MVP)

- Add basic, privacy-conscious product analytics after MVP.
- Prefer a lightweight approach with event tracking (e.g., PostHog).
- Do not block MVP on analytics.
- Track only essential events (auth, list/item actions, share usage).
- Avoid collecting sensitive content (e.g., full todo text) in analytics events.