-- Denormalize email onto the profile table so resolve-username can look
-- up a user's email with a single query instead of a second round trip
-- to the Admin API.

alter table "public"."User" add column email text;

update "public"."User" u
set email = au.email
from auth.users au
where au.id = u.id;

alter table "public"."User" alter column email set not null;
alter table "public"."User" add constraint "User_email_key" unique (email);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public."User" (id, username, email)
  values (new.id, new.raw_user_meta_data ->> 'username', new.email);
  return new;
end;
$$;
