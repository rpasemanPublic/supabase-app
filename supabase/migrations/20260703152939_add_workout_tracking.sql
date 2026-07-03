create table "public"."template_programs" (
  id bigint generated always as identity primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table "public"."template_workouts" (
  id bigint generated always as identity primary key,
  template_program_id bigint not null references public.template_programs (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index template_workouts_template_program_id_idx on public.template_workouts (template_program_id);

create table "public"."template_exercises" (
  id bigint generated always as identity primary key,
  template_workout_id bigint not null references public.template_workouts (id) on delete cascade,
  name text not null,
  recommended_sets integer not null,
  min_reps integer not null,
  max_reps integer not null,
  created_at timestamptz not null default now(),
  check (max_reps >= min_reps)
);

create index template_exercises_template_workout_id_idx on public.template_exercises (template_workout_id);

alter table "public"."template_programs" enable row level security;
alter table "public"."template_workouts" enable row level security;
alter table "public"."template_exercises" enable row level security;

create policy "Authenticated users can view template programs"
on "public"."template_programs" for select
to authenticated
using ( true );

create policy "Authenticated users can view template workouts"
on "public"."template_workouts" for select
to authenticated
using ( true );

create policy "Authenticated users can view template exercises"
on "public"."template_exercises" for select
to authenticated
using ( true );


insert into public.template_programs (name) values
  ('Push Pull Legs'),
  ('Full Body'),
  ('Upper/Lower');

insert into public.template_workouts (template_program_id, name) values
  ((select id from public.template_programs where name = 'Push Pull Legs'), 'Push Day'),
  ((select id from public.template_programs where name = 'Push Pull Legs'), 'Pull Day'),
  ((select id from public.template_programs where name = 'Push Pull Legs'), 'Legs Day'),
  ((select id from public.template_programs where name = 'Full Body'), 'Full Body A'),
  ((select id from public.template_programs where name = 'Full Body'), 'Full Body B'),
  ((select id from public.template_programs where name = 'Upper/Lower'), 'Upper Day'),
  ((select id from public.template_programs where name = 'Upper/Lower'), 'Lower Day');

insert into public.template_exercises (template_workout_id, name, recommended_sets, min_reps, max_reps) values
  -- Push Day
  ((select id from public.template_workouts where name = 'Push Day'), 'Bench Press', 3, 5, 8),
  ((select id from public.template_workouts where name = 'Push Day'), 'Overhead Press', 3, 5, 8),
  ((select id from public.template_workouts where name = 'Push Day'), 'Incline Dumbbell Press', 3, 8, 12),
  ((select id from public.template_workouts where name = 'Push Day'), 'Lateral Raise', 3, 12, 15),
  ((select id from public.template_workouts where name = 'Push Day'), 'Tricep Pushdown', 3, 10, 15),

  -- Pull Day
  ((select id from public.template_workouts where name = 'Pull Day'), 'Deadlift', 2, 5, 8),
  ((select id from public.template_workouts where name = 'Pull Day'), 'Barbell Row', 3, 6, 10),
  ((select id from public.template_workouts where name = 'Pull Day'), 'Lat Pulldown', 3, 8, 12),
  ((select id from public.template_workouts where name = 'Pull Day'), 'Face Pull', 3, 12, 15),
  ((select id from public.template_workouts where name = 'Pull Day'), 'Bicep Curl', 3, 10, 15),

  -- Legs Day
  ((select id from public.template_workouts where name = 'Legs Day'), 'Squat', 3, 5, 8),
  ((select id from public.template_workouts where name = 'Legs Day'), 'Romanian Deadlift', 3, 8, 10),
  ((select id from public.template_workouts where name = 'Legs Day'), 'Leg Press', 3, 8, 12),
  ((select id from public.template_workouts where name = 'Legs Day'), 'Leg Curl', 3, 10, 15),
  ((select id from public.template_workouts where name = 'Legs Day'), 'Calf Raise', 3, 12, 15),

  -- Full Body A
  ((select id from public.template_workouts where name = 'Full Body A'), 'Squat', 3, 5, 8),
  ((select id from public.template_workouts where name = 'Full Body A'), 'Bench Press', 3, 5, 8),
  ((select id from public.template_workouts where name = 'Full Body A'), 'Barbell Row', 3, 6, 10),
  ((select id from public.template_workouts where name = 'Full Body A'), 'Overhead Press', 3, 6, 10),
  ((select id from public.template_workouts where name = 'Full Body A'), 'Lat Pulldown', 3, 8, 12),

  -- Full Body B
  ((select id from public.template_workouts where name = 'Full Body B'), 'Deadlift', 2, 5, 8),
  ((select id from public.template_workouts where name = 'Full Body B'), 'Incline Dumbbell Press', 3, 8, 12),
  ((select id from public.template_workouts where name = 'Full Body B'), 'Pull-Up', 3, 6, 10),
  ((select id from public.template_workouts where name = 'Full Body B'), 'Leg Press', 3, 8, 12),
  ((select id from public.template_workouts where name = 'Full Body B'), 'Bicep Curl', 3, 10, 15),

  -- Upper Day
  ((select id from public.template_workouts where name = 'Upper Day'), 'Bench Press', 3, 5, 8),
  ((select id from public.template_workouts where name = 'Upper Day'), 'Barbell Row', 3, 6, 10),
  ((select id from public.template_workouts where name = 'Upper Day'), 'Overhead Press', 3, 6, 10),
  ((select id from public.template_workouts where name = 'Upper Day'), 'Lat Pulldown', 3, 8, 12),
  ((select id from public.template_workouts where name = 'Upper Day'), 'Bicep Curl', 3, 10, 15),
  ((select id from public.template_workouts where name = 'Upper Day'), 'Tricep Pushdown', 3, 10, 15),

  -- Lower Day
  ((select id from public.template_workouts where name = 'Lower Day'), 'Squat', 3, 5, 8),
  ((select id from public.template_workouts where name = 'Lower Day'), 'Romanian Deadlift', 3, 8, 10),
  ((select id from public.template_workouts where name = 'Lower Day'), 'Leg Press', 3, 8, 12),
  ((select id from public.template_workouts where name = 'Lower Day'), 'Leg Curl', 3, 10, 15),
  ((select id from public.template_workouts where name = 'Lower Day'), 'Calf Raise', 3, 12, 15);
