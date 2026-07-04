-- Previously this always started the first template_workout in the
-- program (by id/insertion order), so hitting "Start Workout" repeatedly
-- just repeated day 1 forever instead of rotating through the program.
-- Now it looks at the template_workout_id of the user's most recent
-- workout under this program and starts the next one after it (ordered
-- the same way, wrapping back to the first past the end). A user with no
-- prior workout under this program (first time selecting it) still gets
-- the first template_workout, since the "last workout" lookup naturally
-- comes back empty.
create or replace function public.select_program_and_start_workout(p_template_program_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_template_workout_id bigint;
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

  select w.template_workout_id into v_last_template_workout_id
  from public.workouts w
  join public.template_workouts tw on tw.id = w.template_workout_id
  where w.user_id = v_user_id
  and tw.template_program_id = p_template_program_id
  order by w.created_at desc
  limit 1;

  if v_last_template_workout_id is not null then
    select id, name into v_template_workout_id, v_workout_name
    from public.template_workouts
    where template_program_id = p_template_program_id
    and id > v_last_template_workout_id
    order by id
    limit 1;
  end if;

  if v_template_workout_id is null then
    select id, name into v_template_workout_id, v_workout_name
    from public.template_workouts
    where template_program_id = p_template_program_id
    order by id
    limit 1;
  end if;

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
