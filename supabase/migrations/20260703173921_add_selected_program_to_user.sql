alter table "public"."User"
  add column selected_program_id bigint references public.template_programs (id) on delete set null;
