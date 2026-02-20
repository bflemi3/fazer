# fazer

A collaborative todo list app with real-time updates.

## Stack

- **Frontend:** Next.js 16 (App Router) + React + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Realtime)
- **Hosting:** Vercel
- **Auth:** Google sign-in via Supabase Auth
- **PWA:** Installable with offline support (Serwist)
- **i18n:** next-intl (English, Portuguese)

## Infrastructure

- **Hosting:** [Vercel](https://vercel.com) — deploys automatically from `main` via GitHub integration
- **Database & Auth:** [Supabase](https://supabase.com) (managed Postgres) — handles user authentication (Google OAuth), row-level security, and real-time subscriptions over WebSockets
- **Feedback:** Slack Bot Token posts user feedback (with optional screenshots) to a private Slack channel via the Slack Web API
- **Analytics:** [PostHog](https://posthog.com) — lightweight, privacy-conscious event tracking (optional, no-ops when unconfigured)
- **DNS/Domain:** Managed through Vercel

All secrets (Supabase keys, Slack token, PostHog key) are stored as environment variables in Vercel and never exposed to the client unless prefixed with `NEXT_PUBLIC_`.

## Getting started

```bash
npm install
cp .env.local.example .env.local  # Add your Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

```bash
npm run dev       # Start dev server (Turbopack, hot reload)
npm run build     # Production build (webpack, generates service worker)
npm run dev:pwa   # Build + start for local PWA/service worker testing
npm run lint      # Run ESLint
```

## Features

- Create and share todo lists via unguessable links
- Real-time updates across all connected users
- Installable as a PWA on mobile and desktop
- Offline support — the app shell loads without a network connection
- Light and dark mode (follows system preference)
- English and Portuguese language support
- In-app update notifications with release notes

## Releasing

We use [semantic versioning](https://semver.org/) (`0.MINOR.PATCH` while pre-1.0).

After merging a feature PR to `main`:

1. Update `CHANGELOG.md` with user-friendly release notes
2. Bump `version` in `package.json` (`minor` for features, `patch` for fixes)
3. Commit to `main`:
   ```bash
   git add CHANGELOG.md package.json package-lock.json
   git commit -m "Bump version to vX.Y.Z"
   ```
4. Tag and push:
   ```bash
   git tag vX.Y.Z
   git push origin main && git push origin vX.Y.Z
   ```
5. Create a GitHub Release:
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z — Short description" --generate-notes
   ```
