-- Gives exercises a stable, shared identity (instead of a bare text name
-- repeated across every workout day that happens to use it), and a place
-- to hold exercise_ratio -- the per-exercise coefficient the weight
-- prediction formula needs. Everything else the formula uses (experience,
-- gender, age, target rep count) is a global constant/adjustment, not
-- per-exercise data, so it lives in code (utils/predict_weight.ts) rather
-- than here.
--
-- exercise_ratio is a multiple of bodyweight representing roughly an
-- intermediate male lifter's working weight at peak strength age, for
-- about 8 reps -- the calibration point utils/predict_weight.ts adjusts
-- away from for age/experience/gender/actual target reps.
create table "public"."exercises" (
  id bigint generated always as identity primary key,
  name text not null unique,
  exercise_ratio numeric not null check (exercise_ratio > 0),
  created_at timestamptz not null default now()
);

alter table "public"."exercises" enable row level security;

create policy "Authenticated users can view exercises"
on "public"."exercises" for select
to authenticated
using ( true );

insert into public.exercises (name, exercise_ratio) values
  ('Squat', 1.0),
  ('Deadlift', 1.25),
  ('Romanian Deadlift', 0.85),
  ('Bench Press', 0.75),
  ('Overhead Press', 0.5),
  ('Barbell Row', 0.6),
  ('Lat Pulldown', 0.7),
  ('Leg Press', 1.8),
  ('Incline Dumbbell Press', 0.5),
  ('Pull-Up', 0.1),
  ('Leg Curl', 0.3),
  ('Calf Raise', 0.5),
  ('Face Pull', 0.15),
  ('Lateral Raise', 0.1),
  ('Tricep Pushdown', 0.25),
  ('Bicep Curl', 0.2);
