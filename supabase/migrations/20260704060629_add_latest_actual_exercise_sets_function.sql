-- Backs the /workout progression logic: for a given set of exercise_ids,
-- find the most recent actual performance of each (excluding the
-- in-progress workout itself), so recommendations can progress from what
-- the user actually did rather than always predicting off body stats.
--
-- Done as a DISTINCT ON query in the database rather than pulling the
-- user's full history to the client and filtering in JS: "most recent row
-- per exercise" is a group-wise top-1 problem that a plain .limit() can't
-- express (a flat limit truncates one global list, so an exercise logged
-- rarely can get crowded out by a frequently-logged one and wrongly look
-- like it has no history at all).
--
-- Capped to the last 6 months: an attempt from a year ago is a poor basis
-- for today's recommendation, and it bounds how far back Postgres has to
-- scan/sort regardless of how long the user has been using the app.
--
-- No SECURITY DEFINER -- this only reads, and running as the caller means
-- the existing RLS policies on actual_workout_exercises/actual_sets/workouts
-- already scope every row to the caller's own data.
create or replace function public.latest_actual_exercise_sets(
  p_exercise_ids bigint[],
  p_exclude_workout_id bigint
)
returns table (
  exercise_id bigint,
  set_number integer,
  actual_reps integer,
  actual_weight numeric
)
language sql
stable
set search_path = ''
as $$
  select distinct on (awe.exercise_id, s.set_number)
    awe.exercise_id,
    s.set_number,
    s.actual_reps,
    s.actual_weight
  from public.actual_workout_exercises awe
  join public.actual_sets s on s.actual_workout_exercise_id = awe.id
  join public.workouts w on w.id = awe.workout_id
  where awe.exercise_id = any(p_exercise_ids)
  and awe.workout_id != p_exclude_workout_id
  and w.created_at >= now() - interval '6 months'
  order by awe.exercise_id, s.set_number, w.created_at desc;
$$;
