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

## Auth

- `/signup` — create an account with email, username, and password. `username` is stored via `raw_user_meta_data` and copied into `public."User"` (the profile table) by a `handle_new_user` trigger on `auth.users`.
- `/login` — email + password login.
- `/` — protected; redirects to `/login` if not authenticated, otherwise shows "Hello `<username>`" and a log out button.

This project has email confirmation enabled, so a new signup won't get a session immediately — the user has to click the confirmation link in their email before they can log in. Some domains (e.g. `example.com`) are rejected outright as known-fake addresses.

### Roles

Every profile row in `public."User"` has a `role` column (`'user'` by default, or `'admin'`). There's no self-service way to become an admin — no INSERT/UPDATE policy grants regular users write access to this table at all, so the only way in is a direct database update:

```sql
update public."User" set role = 'admin' where username = '<username>';
```

The home page shows `(admin)` next to the username when applicable, but nothing is currently gated behind the role — it's just the underlying infrastructure for now.

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

Edge functions live in `supabase/functions/<name>/index.ts` and, like migrations, deploy automatically via the GitHub integration on push to `master`.

**The integration only deploys functions declared in `supabase/config.toml`** — it does not scan `supabase/functions/` on its own. So for each new function, add a block there in addition to the function's `index.ts`:

```toml
[functions.<name>]
enabled = true
verify_jwt = true
entrypoint = "./functions/<name>/index.ts"
```

Then push to `master`. Verify it deployed by checking the function's version bumped (ask Claude to check via the Supabase MCP `get_edge_function` tool, or check the dashboard).

They run with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available as env vars automatically, so they can bypass RLS when needed — keep the service role key out of the frontend entirely. Frontend code calls them with `supabase.functions.invoke("<name>", { body: {...} })`. Remember to handle CORS (`OPTIONS` requests) in the function, since the browser will preflight cross-origin calls to `*.supabase.co`.

## Project links

- Repo: https://github.com/rpasemanPublic/supabase-app
- Supabase dashboard: https://supabase.com/dashboard/project/xtthlulxezteqtpnznoz
