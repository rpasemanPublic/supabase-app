import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { WorkoutHistoryList } from "@/app/components/WorkoutHistoryList";

export default async function HistoryPage() {
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
    .select("unit_preference")
    .eq("id", user.id)
    .single();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, name, finished_at")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">History</h1>
        <WorkoutHistoryList
          workouts={workouts ?? []}
          isImperial={profile?.unit_preference === "imperial"}
        />
        <Link
          href="/"
          className="text-center text-sm text-accent hover:underline"
        >
          Back
        </Link>
      </div>
    </main>
  );
}
