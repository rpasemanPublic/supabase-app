-- Lets a user log a single set of a workout in progress. One RPC call per
-- set (rather than one big form submitted at the end) matches how lifting
-- actually happens: log a set, rest, do the next one, without losing
-- progress if the tab closes mid-workout.
--
-- Wrapped in a function (rather than two plain client inserts) because it's
-- a find-or-create of actual_workout_exercises followed by an upsert of
-- actual_sets -- multi-table and racy if done as separate round-trips (e.g.
-- a double-tap on the log button could create two actual_workout_exercises
-- rows for the same exercise without the unique constraint below).

alter table "public"."actual_workout_exercises"
  add constraint actual_workout_exercises_recommended_workout_exercise_id_key
  unique (recommended_workout_exercise_id);

create or replace function public.log_set(
  p_recommended_workout_exercise_id bigint,
  p_set_number integer,
  p_actual_reps integer,
  p_actual_weight numeric
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_workout_id bigint;
  v_exercise_id bigint;
  v_actual_workout_exercise_id bigint;
  v_recommended_set_id bigint;
  v_actual_set_id bigint;
begin
  select rwe.workout_id, rwe.exercise_id into v_workout_id, v_exercise_id
  from public.recommended_workout_exercises rwe
  join public.workouts w on w.id = rwe.workout_id
  where rwe.id = p_recommended_workout_exercise_id
  and w.user_id = v_user_id;

  if v_workout_id is null then
    raise exception 'Recommended exercise % not found', p_recommended_workout_exercise_id;
  end if;

  insert into public.actual_workout_exercises (workout_id, recommended_workout_exercise_id, exercise_id)
  values (v_workout_id, p_recommended_workout_exercise_id, v_exercise_id)
  on conflict (recommended_workout_exercise_id) do nothing;

  select id into v_actual_workout_exercise_id
  from public.actual_workout_exercises
  where recommended_workout_exercise_id = p_recommended_workout_exercise_id;

  select id into v_recommended_set_id
  from public.recommended_sets
  where recommended_workout_exercise_id = p_recommended_workout_exercise_id
  and set_number = p_set_number;

  insert into public.actual_sets (actual_workout_exercise_id, recommended_set_id, set_number, actual_reps, actual_weight)
  values (v_actual_workout_exercise_id, v_recommended_set_id, p_set_number, p_actual_reps, p_actual_weight)
  on conflict (actual_workout_exercise_id, set_number) do update
    set actual_reps = excluded.actual_reps,
        actual_weight = excluded.actual_weight
  returning id into v_actual_set_id;

  return v_actual_set_id;
end;
$$;
