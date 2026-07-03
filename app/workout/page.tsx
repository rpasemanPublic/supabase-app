import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function WorkoutPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workout } = await supabase
    .from("workouts")
    .select(
      `
      id,
      name,
      created_at,
      recommended_workout_exercises (
        id,
        name,
        recommended_sets (
          id,
          set_number,
          recommended_reps,
          recommended_weight
        )
      )
    `,
    )
    .is("finished_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {workout ? (
          <>
            <h1 className="text-2xl font-semibold text-gray-900">{workout.name}</h1>
            <div className="flex flex-col gap-3">
              {workout.recommended_workout_exercises.map((exercise) => (
                <div key={exercise.id} className="rounded-lg border border-gray-200 p-4">
                  <h2 className="font-semibold text-gray-900">{exercise.name}</h2>
                  <ul className="mt-2 flex flex-col gap-1 text-sm text-gray-600">
                    {exercise.recommended_sets
                      .sort((a, b) => a.set_number - b.set_number)
                      .map((set) => (
                        <li key={set.id} className="flex justify-between gap-4">
                          <span>Set {set.set_number}</span>
                          <span className="whitespace-nowrap text-gray-400">
                            {set.recommended_reps} reps
                            {set.recommended_weight ? ` @ ${set.recommended_weight}` : ""}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-600">No workout in progress.</p>
        )}
        <Link href="/" className="text-center text-sm text-accent hover:underline">
          Back
        </Link>
      </div>
    </main>
  );
}
