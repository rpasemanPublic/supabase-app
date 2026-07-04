-- Extend handle_new_user to optionally capture the rest of the profile
-- fields at signup time (same mechanism as username: passed through
-- raw_user_meta_data, since the client can't write to public."User"
-- directly before the row exists). All are nullable and safe to omit --
-- unit_preference falls back to its column default of 'metric' if not
-- provided, matching what a bare insert would already do.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public."User" (
    id, username, email,
    weight_kg, height_cm, unit_preference,
    gender, date_of_birth, training_experience
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.email,
    (new.raw_user_meta_data ->> 'weight_kg')::numeric,
    (new.raw_user_meta_data ->> 'height_cm')::numeric,
    coalesce(new.raw_user_meta_data ->> 'unit_preference', 'metric'),
    new.raw_user_meta_data ->> 'gender',
    (new.raw_user_meta_data ->> 'date_of_birth')::date,
    new.raw_user_meta_data ->> 'training_experience'
  );
  return new;
end;
$$;
