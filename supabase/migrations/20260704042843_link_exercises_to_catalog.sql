-- Phase 2: link template_exercises, recommended_workout_exercises, and
-- actual_workout_exercises to the exercises catalog by exercise_id instead
-- of a bare text name, so exercise identity is stable across workout days
-- and across the recommended/logged distinction (needed for progression
-- history matching later, and to avoid the same exercise's data drifting
-- out of sync across its several copies).
--
-- Note: dropping `name` from recommended_workout_exercises and
-- actual_workout_exercises is a deliberate departure from the
-- snapshot-at-creation-time philosophy the rest of that schema follows
-- (e.g. workouts.name is still copied from template_workouts.name at
-- creation, not read live). Renaming a catalog exercise would now
-- retroactively change what past logged workouts display. Accepted here
-- since the catalog is core reference data, expected to be stable, unlike
-- the workout templates.

-- template_exercises
alter table "public"."template_exercises"
  add column exercise_id bigint references public.exercises (id);

update public."template_exercises" te
set exercise_id = e.id
from public.exercises e
where e.name = te.name;

alter table "public"."template_exercises"
  alter column exercise_id set not null;

alter table "public"."template_exercises"
  drop column name;

create index template_exercises_exercise_id_idx on public.template_exercises (exercise_id);


-- recommended_workout_exercises
alter table "public"."recommended_workout_exercises"
  add column exercise_id bigint references public.exercises (id);

update public."recommended_workout_exercises" rwe
set exercise_id = e.id
from public.exercises e
where e.name = rwe.name;

alter table "public"."recommended_workout_exercises"
  alter column exercise_id set not null;

alter table "public"."recommended_workout_exercises"
  drop column name;

create index recommended_workout_exercises_exercise_id_idx on public.recommended_workout_exercises (exercise_id);


-- actual_workout_exercises
alter table "public"."actual_workout_exercises"
  add column exercise_id bigint references public.exercises (id);

update public."actual_workout_exercises" awe
set exercise_id = e.id
from public.exercises e
where e.name = awe.name;

alter table "public"."actual_workout_exercises"
  alter column exercise_id set not null;

alter table "public"."actual_workout_exercises"
  drop column name;

create index actual_workout_exercises_exercise_id_idx on public.actual_workout_exercises (exercise_id);


-- select_program_and_start_workout referenced template_exercises.name and
-- wrote it into recommended_workout_exercises.name -- update it to use
-- exercise_id on both sides instead.
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
      insert into public.recommended_sets (recommended_workout_exercise_id, set_number, recommended_reps, recommended_weight)
      values (v_recommended_exercise_id, v_set_number, v_template_exercise.min_reps, null);
    end loop;
  end loop;

  return v_workout_id;
end;
$$;
