import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { LogoutButton } from "@/app/components/LogoutButton";
import { HamburgerMenu } from "@/app/components/HamburgerMenu";
import { SelectProgramDialog } from "@/app/components/SelectProgramDialog";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("User")
    .select("username, role, selected_program_id")
    .eq("id", user.id)
    .single();

  const { data: programs } = profile?.selected_program_id
    ? { data: null }
    : await supabase.from("template_programs").select("id, name").order("name");

  const { data: activeWorkout } = profile?.selected_program_id
    ? await supabase
        .from("workouts")
        .select("id")
        .eq("user_id", user.id)
        .is("finished_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="absolute right-4 top-4">
          <HamburgerMenu />
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-2xl font-semibold text-accent">
          {(profile?.username ?? user.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <p className="text-xl font-medium text-gray-900">
          Hello {profile?.username ?? user.email}
          {profile?.role === "admin" && (
            <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
              Admin
            </span>
          )}
        </p>
        {!profile?.selected_program_id ? (
          <SelectProgramDialog programs={programs ?? []} />
        ) : activeWorkout ? (
          <Link
            href="/workout"
            className="w-full rounded-lg bg-accent px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            Resume Your Workout
          </Link>
        ) : (
          <button className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover">
            Start Workout
          </button>
        )}
        <LogoutButton />
      </div>
    </main>
  );
}
