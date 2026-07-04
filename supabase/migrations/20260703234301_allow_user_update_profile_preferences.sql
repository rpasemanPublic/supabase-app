-- Let users update their own username and health preferences, but nothing
-- else on their row (role, email, selected_program_id stay off-limits --
-- role to prevent self-promotion, email because it must go through Supabase
-- Auth's own confirmation flow, selected_program_id because it's only ever
-- set via select_program_and_start_workout).
grant update (username, weight_kg, height_cm, unit_preference)
  on "public"."User" to authenticated;

create policy "Users can update own profile preferences"
on "public"."User" for update
to authenticated
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );
