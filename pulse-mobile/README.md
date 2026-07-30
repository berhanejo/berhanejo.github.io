# Pulse

Pulse helps people consistently work toward personal goals. Users pick goals
(fitness, learning, reading, mindset), do daily check-ins with photo proof,
and stay accountable through a small private group.

Built with Expo Router, React Native, Supabase (auth, Postgres, storage,
realtime), and React Query.

## Requirements

- Node.js **20.19.4 or newer** (Expo SDK 54 / Metro requires it — `expo start`
  will crash on Node 18 with a `configs.toReversed is not a function` error).
- A Supabase project (free tier is fine).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then in the SQL Editor run the contents of
   [`supabase/schema.sql`](./supabase/schema.sql). This creates all tables
   (`profiles`, `groups`, `group_members`, `group_invites`, `goals`,
   `check_ins`, `reactions`), RLS policies, helper functions, and the private
   `check-in-photos` storage bucket.

3. Copy `.env.example` to `.env` and fill in your Supabase project URL and
   anon key:

   ```bash
   cp .env.example .env
   ```

4. Start the app:

   ```bash
   npx expo start
   ```

## GitHub Pages deployment

The GitHub Pages version must be rebuilt after app changes. Otherwise the live
site can still run an older JavaScript bundle even when the source code was
committed.

Expo puts the web JavaScript bundle into `_expo/`. GitHub Pages must receive a
`.nojekyll` file with the build, otherwise that underscore folder can be skipped
and the site stays stuck on the loading screen.

Recommended setup:

1. In GitHub, add these repository secrets:

   ```text
   EXPO_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

2. In GitHub Pages settings, use GitHub Actions as the publishing source.

3. Push to `main`. The workflow at
   `.github/workflows/deploy-pages.yml` builds `pulse-mobile/dist`, adds
   `.nojekyll`, and deploys that artifact to Pages.

Local/manual build:

1. Build the static web app:

   ```bash
   npm run export:web
   ```

2. Commit the source changes and the generated `dist/` files if you deploy
   manually without the GitHub Action.

3. Push to `main`, then wait for GitHub Pages to refresh. A hard refresh on the
   phone/browser may be needed because the old bundle can be cached.

## Project structure

- `app/` — Expo Router screens: `auth/`, `onboarding/` (welcome → group →
  category → program), `(tabs)/` (home, group, check-in, progress, goals,
  profile), `group/invite` (modal).
- `contexts/` — `auth-session` (Supabase auth) and `app-session` (composes
  the query hooks + derive functions below into the shape screens consume).
- `lib/queries/` — React Query hooks for groups, goals, check-ins, reactions,
  and profile, all backed by Supabase.
- `lib/derive/` — pure functions for streaks, week view, and coach messages.
- `lib/realtime/` — Supabase Realtime subscription for live group updates.
- `data/mock-data.ts` — the static goal catalog (categories + suggested
  programs), not user data.
- `stores/` — device-local UI state only (zustand): active-goal-limit /
  primary-goal preference, and the onboarding wizard's in-progress selection.
- `supabase/schema.sql` — full database schema, RLS policies, and storage
  bucket setup.
