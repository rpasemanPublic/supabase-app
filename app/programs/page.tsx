import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ProgramExplorer } from "@/app/components/ProgramExplorer";

export default async function ProgramsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: programs } = await supabase
    .from("template_programs")
    .select(
      `
      id,
      name,
      template_workouts (
        id,
        name,
        template_exercises (
          id,
          name,
          recommended_sets,
          min_reps,
          max_reps
        )
      )
    `,
    )
    .order("name");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Programs</h1>
        <ProgramExplorer programs={programs ?? []} />
        <Link href="/" className="text-center text-sm text-accent hover:underline">
          Back
        </Link>
      </div>
    </main>
  );
}
