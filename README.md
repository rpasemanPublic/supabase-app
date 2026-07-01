# Supabase App

A Next.js frontend backed by Supabase (project `xtthlulxezteqtpnznoz`).

- **Frontend**: `app/` — reads data directly from Supabase (via `utils/supabase/`), using RLS for read access.
- **Backend**: `supabase/functions/` — Supabase Edge Functions. Used for writes/logic that need the service role key or server-side validation, rather than exposing that directly to the client.

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

## Edge functions (backend)

Edge functions live in `supabase/functions/<name>/index.ts` and are deployed independently of migrations (not via git push — deploy explicitly):

```bash
npx supabase functions deploy <name> --project-ref xtthlulxezteqtpnznoz
```

They run with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available as env vars automatically, so they can bypass RLS when needed — keep the service role key out of the frontend entirely. Frontend code calls them with `supabase.functions.invoke("<name>", { body: {...} })`. Remember to handle CORS (`OPTIONS` requests) in the function, since the browser will preflight cross-origin calls to `*.supabase.co`.

## Project links

- Repo: https://github.com/rpasemanPublic/supabase-app
- Supabase dashboard: https://supabase.com/dashboard/project/xtthlulxezteqtpnznoz
