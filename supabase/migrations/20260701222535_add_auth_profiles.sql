-- Remove old demo table (public listing / create-user function are being replaced by auth)
drop table if exists "public"."User" cascade;

-- Profile table linked 1:1 to Supabase Auth users
create table "public"."User" (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);

alter table "public"."User" enable row level security;

create policy "Users can view own profile"
on "public"."User"
for select
to authenticated
using ( (select auth.uid()) = id );

-- Auto-create a profile row whenever a new auth user signs up.
-- SECURITY DEFINER is required here since this runs as part of the
-- auth.users insert, before the new user's own session/RLS context exists.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public."User" (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
