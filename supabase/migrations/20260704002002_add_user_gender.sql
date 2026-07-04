alter table "public"."User"
  add column gender text;

-- Let users update their own gender
grant update (gender)
  on "public"."User" to authenticated;

