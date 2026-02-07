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
