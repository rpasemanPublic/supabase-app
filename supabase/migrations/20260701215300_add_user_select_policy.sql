create policy "Allow public read access"
on "public"."User"
for select
to anon, authenticated
using ( true );
