create table "public"."workouts" (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  template_workout_id bigint not null references public.template_workouts (id),
  name text not null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index workouts_user_id_idx on public.workouts (user_id);
create index workouts_template_workout_id_idx on public.workouts (template_workout_id);

alter table "public"."workouts" enable row level security;

create policy "Users can view own workouts"
on "public"."workouts" for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert own workouts"
on "public"."workouts" for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update own workouts"
on "public"."workouts" for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Users can delete own workouts"
on "public"."workouts" for delete
to authenticated
using ( (select auth.uid()) = user_id );


create table "public"."recommended_workout_exercises" (
  id bigint generated always as identity primary key,
  workout_id bigint not null references public.workouts (id) on delete cascade,
  template_exercise_id bigint references public.template_exercises (id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create index recommended_workout_exercises_workout_id_idx on public.recommended_workout_exercises (workout_id);
create index recommended_workout_exercises_template_exercise_id_idx on public.recommended_workout_exercises (template_exercise_id);

alter table "public"."recommended_workout_exercises" enable row level security;

create policy "Users can view own recommended exercises"
on "public"."recommended_workout_exercises" for select
to authenticated
using (
  exists (
    select 1 from public.workouts w
    where w.id = recommended_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can insert own recommended exercises"
on "public"."recommended_workout_exercises" for insert
to authenticated
with check (
  exists (
    select 1 from public.workouts w
    where w.id = recommended_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can update own recommended exercises"
on "public"."recommended_workout_exercises" for update
to authenticated
using (
  exists (
    select 1 from public.workouts w
    where w.id = recommended_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.workouts w
    where w.id = recommended_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can delete own recommended exercises"
on "public"."recommended_workout_exercises" for delete
to authenticated
using (
  exists (
    select 1 from public.workouts w
    where w.id = recommended_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
);


create table "public"."recommended_sets" (
  id bigint generated always as identity primary key,
  recommended_workout_exercise_id bigint not null references public.recommended_workout_exercises (id) on delete cascade,
  set_number integer not null,
  recommended_reps integer not null,
  recommended_weight numeric,
  created_at timestamptz not null default now(),
  unique (recommended_workout_exercise_id, set_number)
);

create index recommended_sets_recommended_workout_exercise_id_idx on public.recommended_sets (recommended_workout_exercise_id);

alter table "public"."recommended_sets" enable row level security;

create policy "Users can view own recommended sets"
on "public"."recommended_sets" for select
to authenticated
using (
  exists (
    select 1 from public.recommended_workout_exercises rwe
    join public.workouts w on w.id = rwe.workout_id
    where rwe.id = recommended_sets.recommended_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can insert own recommended sets"
on "public"."recommended_sets" for insert
to authenticated
with check (
  exists (
    select 1 from public.recommended_workout_exercises rwe
    join public.workouts w on w.id = rwe.workout_id
    where rwe.id = recommended_sets.recommended_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can update own recommended sets"
on "public"."recommended_sets" for update
to authenticated
using (
  exists (
    select 1 from public.recommended_workout_exercises rwe
    join public.workouts w on w.id = rwe.workout_id
    where rwe.id = recommended_sets.recommended_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.recommended_workout_exercises rwe
    join public.workouts w on w.id = rwe.workout_id
    where rwe.id = recommended_sets.recommended_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can delete own recommended sets"
on "public"."recommended_sets" for delete
to authenticated
using (
  exists (
    select 1 from public.recommended_workout_exercises rwe
    join public.workouts w on w.id = rwe.workout_id
    where rwe.id = recommended_sets.recommended_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
);


create table "public"."actual_workout_exercises" (
  id bigint generated always as identity primary key,
  workout_id bigint not null references public.workouts (id) on delete cascade,
  recommended_workout_exercise_id bigint references public.recommended_workout_exercises (id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create index actual_workout_exercises_workout_id_idx on public.actual_workout_exercises (workout_id);
create index actual_workout_exercises_recommended_workout_exercise_id_idx on public.actual_workout_exercises (recommended_workout_exercise_id);

alter table "public"."actual_workout_exercises" enable row level security;

create policy "Users can view own actual exercises"
on "public"."actual_workout_exercises" for select
to authenticated
using (
  exists (
    select 1 from public.workouts w
    where w.id = actual_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can insert own actual exercises"
on "public"."actual_workout_exercises" for insert
to authenticated
with check (
  exists (
    select 1 from public.workouts w
    where w.id = actual_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can update own actual exercises"
on "public"."actual_workout_exercises" for update
to authenticated
using (
  exists (
    select 1 from public.workouts w
    where w.id = actual_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.workouts w
    where w.id = actual_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can delete own actual exercises"
on "public"."actual_workout_exercises" for delete
to authenticated
using (
  exists (
    select 1 from public.workouts w
    where w.id = actual_workout_exercises.workout_id
    and w.user_id = (select auth.uid())
  )
);


create table "public"."actual_sets" (
  id bigint generated always as identity primary key,
  actual_workout_exercise_id bigint not null references public.actual_workout_exercises (id) on delete cascade,
  recommended_set_id bigint references public.recommended_sets (id) on delete set null,
  set_number integer not null,
  actual_reps integer not null,
  actual_weight numeric not null,
  created_at timestamptz not null default now(),
  unique (actual_workout_exercise_id, set_number)
);

create index actual_sets_actual_workout_exercise_id_idx on public.actual_sets (actual_workout_exercise_id);
create index actual_sets_recommended_set_id_idx on public.actual_sets (recommended_set_id);

alter table "public"."actual_sets" enable row level security;

create policy "Users can view own actual sets"
on "public"."actual_sets" for select
to authenticated
using (
  exists (
    select 1 from public.actual_workout_exercises awe
    join public.workouts w on w.id = awe.workout_id
    where awe.id = actual_sets.actual_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can insert own actual sets"
on "public"."actual_sets" for insert
to authenticated
with check (
  exists (
    select 1 from public.actual_workout_exercises awe
    join public.workouts w on w.id = awe.workout_id
    where awe.id = actual_sets.actual_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can update own actual sets"
on "public"."actual_sets" for update
to authenticated
using (
  exists (
    select 1 from public.actual_workout_exercises awe
    join public.workouts w on w.id = awe.workout_id
    where awe.id = actual_sets.actual_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.actual_workout_exercises awe
    join public.workouts w on w.id = awe.workout_id
    where awe.id = actual_sets.actual_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
);

create policy "Users can delete own actual sets"
on "public"."actual_sets" for delete
to authenticated
using (
  exists (
    select 1 from public.actual_workout_exercises awe
    join public.workouts w on w.id = awe.workout_id
    where awe.id = actual_sets.actual_workout_exercise_id
    and w.user_id = (select auth.uid())
  )
);
