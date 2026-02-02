# CLAUDE.md

## Project

**fazer** — a collaborative todo list app with real-time updates.

## Stack

- **Frontend:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Realtime)
- **Hosting:** Vercel
- **Auth:** Google and Apple sign-in via Supabase Auth (email, name, avatar)

## Key behaviors

- Lists are shareable via unguessable links
- Anonymous users may VIEW shared lists
- Only authenticated users may EDIT lists
- List items update live for all connected users via Supabase Realtime

## Design principles

- Simple, minimal, calm UI
- Frictionless and obvious UX
- Light and dark mode (default to system preference)
- Prefer clarity and whitespace over density
- No visual noise or unnecessary ornamentation

## Development rules

- Work incrementally; prefer clarity over cleverness
- Use Supabase-generated TypeScript types in the frontend
- Use Row Level Security (RLS) for all access control
- Never push directly to `main` — always use feature branches
- Do not delete cloud resources
- Avoid shortcuts that block future scaling

## Project structure

```
app/          # Next.js App Router pages and layouts
lib/          # Shared utilities (e.g. cn() from shadcn)
components/   # React components (added as needed)
supabase/     # Supabase local config and migrations
public/       # Static assets
```

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
```
