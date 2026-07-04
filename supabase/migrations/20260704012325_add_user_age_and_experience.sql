alter table "public"."User"
  add column date_of_birth date,
  add column training_experience text
    check (training_experience in ('novice', 'intermediate', 'advanced'));

-- Let users update their own date of birth and training experience.
-- No new RLS policy needed -- the existing "Users can update own profile
-- preferences" policy already covers UPDATE on this row for any column
-- in the granted set (grants are additive across migrations).
grant update (date_of_birth, training_experience)
  on "public"."User" to authenticated;
