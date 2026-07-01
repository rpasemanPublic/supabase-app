# Supabase App

A Next.js app backed by Supabase (project `xtthlulxezteqtpnznoz`).

## Setup

```bash
npm install
```

Environment variables live in `.env.local` (not committed):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Running the app

```bash
npm run dev
```

Starts the dev server at [http://localhost:3000](http://localhost:3000). Edit `app/page.tsx` and it hot-reloads.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint
```

## Database changes

Schema changes are managed with the Supabase CLI and deployed automatically via the GitHub integration on push to `master`.

1. Create a migration file:
   ```bash
   npx supabase migration new <name>
   ```
2. Write the SQL into the generated file under `supabase/migrations/`.
3. Push to `master`. The Supabase GitHub integration applies it to the live project.
4. Verify it applied:
   ```bash
   npx supabase migration list --linked
   ```

Do not run migrations directly against production outside of this flow — the GitHub integration is the source of truth for what's applied.

## Project links

- Repo: https://github.com/rpasemanPublic/supabase-app
- Supabase dashboard: https://supabase.com/dashboard/project/xtthlulxezteqtpnznoz
