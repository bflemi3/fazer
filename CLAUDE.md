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
- All buttons and interactive elements must provide **touch feedback** (e.g., active/pressed state via `active:scale-95` or similar) so the user has tactile confirmation of taps.
- Light and dark mode support.
- Default to the user's system color scheme.
- UI should feel fast, unobtrusive, and predictable.

### Responsive modal pattern

All modal-style interactions must use **bottom drawer on mobile** and **centered modal on desktop**. Use shadcn/ui `Drawer` (Vaul) for mobile and `Dialog` for desktop, with a responsive wrapper that switches based on viewport. This applies to all existing and new modals (settings, share, create list, feedback, etc.).

### Theme colors

- **Brand color:** Electric Violet `#8B5CF6` — used for PWA theme, manifest, icons
- **Light mode:** shadcn/ui neutral palette (oklch-based CSS variables in `globals.css`)
- **Dark mode:** shadcn/ui neutral dark palette
- Colors are defined as CSS custom properties in `:root` and `.dark` selectors
- Use semantic tokens (`--foreground`, `--muted-foreground`, `--border`, etc.) — never hardcode hex values in components

---

## PWA, responsiveness, and offline-first behavior

- The app must be installable as a **Progressive Web App (PWA)**:
  - "Add to Home Screen" on mobile devices
  - Runs in standalone / app-like mode
- **Install prompt** should be a **toast notification** (not a passive banner) to more strongly nudge users to install. Show it persistently until dismissed or installed.
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

- Use **semantic versioning** (`MAJOR.MINOR.PATCH`).
  - `MAJOR` — breaking or milestone releases
  - `MINOR` — new features
  - `PATCH` — bug fixes, small improvements
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

## Completed items management (complete — v0.8.0)

- Completed todos are hidden by default behind a collapsible "N completed" section.
- Users can uncomplete individual items, uncomplete all, or delete all completed items.

---

## Owner avatar on shared lists (complete — v0.7.2)

- On the home page, any list created by another user displays the **owner's avatar** to the left of the menu button so users can distinguish their own lists from shared ones.

---

## Feedback (complete — v1.0.0)

Authenticated users can submit feedback directly from the app. Feedback is sent to the Fazer Slack workspace `#feedback` channel via the Slack Bot API.

### What gets captured

**User-provided:**
- **Type** — bug, feature request, or general (picker, not free text)
- **Message** — free-form text description
- **Screenshot** — optional auto-captured page screenshot (via `html-to-image`, excludes the feedback modal)

**Auto-captured (no user effort):**
- Current route, app version, user identity, device context, timestamp, online/offline status

### How feedback is surfaced to users

1. **Fixed footer** — persistent footer on every page: *"Got a thought? We'd love to hear it."* Opens feedback form.
2. **Contextual "Report this" on errors** — link in error page pre-fills feedback type as "bug".
3. **One-time nudge** — after the user's 5th session, a toast: *"How's Fazer working for you?"* (tracked in localStorage, shown once).

### Integration

- **Slack Bot Token** (`SLACK_BOT_TOKEN`) and **Channel ID** (`SLACK_FEEDBACK_CHANNEL_ID`) stored as environment variables, never exposed to the client.
- **API route** at `/api/feedback` — accepts form data, attaches auto-captured context, posts to Slack via Bot API (with screenshot upload support).
- Rate limit: max 5 submissions per hour per user.

---

## Analytics (complete — v0.9.0)

- PostHog for privacy-conscious product analytics.
- Tracks page views, page leaves, and essential events (auth, list/item actions, share usage).
- Does not collect sensitive content (e.g., full todo text).

### Tracked events

| Event | Properties | When it fires |
|---|---|---|
| `user_signed_up` | `referral_token`, `referral_list_id`, `referred_by_user_id` (empty if organic) | New user signup (via `?new_user=1` param) |
| `list_created` | `list_id`, `list_name`, `is_first_list` | User creates a list |
| `list_deleted` | `list_id`, `list_name` | User deletes a list |
| `list_shared` | `list_id`, `list_name`, `share_token` (link only), `method` (`link` or `direct`) | A user gains access to a list — via share link visit (deduplicated per user per token) or direct share by owner |
| `item_created` | `list_id`, `list_name`, `item_id`, `item_name`, `added_by_role` (`owner` or `collaborator`) | User adds a todo item |
| `item_completed` | `list_id`, `list_name`, `item_id`, `item_name`, `added_by_role` (`owner` or `collaborator`) | User completes a todo item (not uncomplete) |
| `item_deleted` | `list_id`, `list_name`, `item_id`, `item_name`, `deleted_by_role` (`owner` or `collaborator`) | User deletes a todo item |
| `pwa_prompt_shown` | _(none)_ | Browser fires `beforeinstallprompt` (user eligible to install) |
| `pwa_installed` | _(none)_ | User installs the PWA |
| `$exception` | `$exception_message`, `$exception_source` | Unhandled error in error boundary |

---

## Direct share with known contacts (planned)

Share a list directly with someone you've previously collaborated with, without sending a link. The list appears on their home page automatically.

### UX

- Share modal gains a **"Share with people"** section below the existing copy-link section
- Shows avatars + names of users who are collaborators on any list the current user owns, excluding people already on this list
- Tapping a contact immediately adds them as a collaborator on this list
- Once added, they appear in the existing "People with access" section
- If no known contacts exist, the section is hidden
- No notifications — the list appears silently on the recipient's home page

### Data layer

- **Known contacts query** — distinct profiles from `list_collaborators` joined with `profiles`, filtered to lists owned by the current user, excluding collaborators already on the target list
- **Direct share mutation** — insert into `list_collaborators` (same as link-based share, but triggered by the owner)
- **RLS** — owner needs INSERT permission on `list_collaborators` for their own lists; verify existing policies or add a new one

### Analytics

- No new events required for collaboration rate metric — it depends only on `item_added` and `item_completed`, which fire regardless of how a user gained access
- `list_shared` event with `method: 'direct'` fires when owner adds a contact directly

---

## Native apps (future consideration)

Publish Fazer as native iOS and Android apps to gain App Store/Play Store presence, native push notifications, and voice assistant integration.

### Recommended approach

- **React Native (Expo)** — best fit given existing TypeScript/React stack.
- **Monorepo** (Turborepo) with shared packages for types, Supabase client, business logic, and validation.
- ~30-40% code reuse from the web app (logic layer, not UI layer).
- UI components must be rewritten (React Native uses `View`/`Text`/`FlatList`, not HTML/CSS).

### Estimated timeline

~2-3 weeks with Claude Code (~8-10 weeks without). The dev work compresses significantly; the fixed overhead is Apple review, device testing, and store provisioning.

### Voice assistant integration (unlocked by native apps)

| Assistant | What's needed | Effort |
|---|---|---|
| Alexa | Server-side Skill (API endpoint) — no native app required | Low |
| Google Assistant | Android App Actions + `shortcuts.xml` native module | Low-moderate |
| Siri | Swift Intents Extension (runs outside main RN app process) | Moderate |

### When to pursue

- When App Store discoverability matters for growth.
- When native push notifications are needed for engagement.
- When voice assistant integration becomes a user priority.
- Not urgent while the PWA covers mobile use cases well.

### Costs

- Apple Developer Program: $99/year
- Google Play Developer: $25 one-time
- Expo EAS Build: free tier likely sufficient
