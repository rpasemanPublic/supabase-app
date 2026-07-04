-- recommended_weight is computed dynamically at display time instead of
-- stored (see utils/predict_weight.ts): a stored value would go stale as
-- soon as the user updates their weight/experience/etc. in Settings, and
-- computing it live means formula tweaks apply everywhere automatically
-- without another backfill migration each time.
alter table "public"."recommended_sets"
  drop column recommended_weight;

-- Update the insert to match -- it no longer writes a weight column at all.
create or replace function public.select_program_and_start_workout(p_template_program_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_template_workout_id bigint;
  v_workout_name text;
  v_workout_id bigint;
  v_recommended_exercise_id bigint;
  v_template_exercise record;
  v_set_number integer;
begin
  update public."User"
  set selected_program_id = p_template_program_id
  where id = v_user_id;

  select id, name into v_template_workout_id, v_workout_name
  from public.template_workouts
  where template_program_id = p_template_program_id
  order by id
  limit 1;

  insert into public.workouts (user_id, template_workout_id, name)
  values (v_user_id, v_template_workout_id, v_workout_name)
  returning id into v_workout_id;

  for v_template_exercise in
    select id, exercise_id, recommended_sets, min_reps
    from public.template_exercises
    where template_workout_id = v_template_workout_id
  loop
    insert into public.recommended_workout_exercises (workout_id, template_exercise_id, exercise_id)
    values (v_workout_id, v_template_exercise.id, v_template_exercise.exercise_id)
    returning id into v_recommended_exercise_id;

    for v_set_number in 1..v_template_exercise.recommended_sets loop
      insert into public.recommended_sets (recommended_workout_exercise_id, set_number, recommended_reps)
      values (v_recommended_exercise_id, v_set_number, v_template_exercise.min_reps);
    end loop;
  end loop;

  return v_workout_id;
end;
$$;
