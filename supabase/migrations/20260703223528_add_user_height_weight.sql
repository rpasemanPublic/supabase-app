alter table "public"."User"
  add column height_cm numeric check (height_cm > 0),
  add column weight_kg numeric check (weight_kg > 0),
  add column unit_preference text not null default 'metric' check (unit_preference in ('metric', 'imperial'));