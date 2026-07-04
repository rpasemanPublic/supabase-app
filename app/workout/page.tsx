import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { predictWeightKg } from "@/utils/predict_weight";
import { kgToLb, floorToIncrement } from "@/utils/weight_transform";
import { LogSetForm } from "@/app/components/LogSetForm";
import { FinishWorkoutButton } from "@/app/components/FinishWorkoutButton";

// Smallest plate increment lifters typically load per side, doubled: 5lb
// plates are standard in imperial gyms, 2.5kg plates in metric ones.
const WEIGHT_INCREMENT_LB = 5;
const WEIGHT_INCREMENT_KG = 2.5;

// Without generated Database types, postgrest-js can't tell this is a
// many-to-one embed (recommended_workout_exercises.exercise_id -> exercises.id)
// and infers `exercises` as an array; .returns() overrides that with the
// shape it actually returns at runtime -- a single object.
type WorkoutQueryResult = {
  id: number;
  name: string;
  created_at: string;
  recommended_workout_exercises: {
    id: number;
    exercises: { name: string; exercise_ratio: number } | null;
    recommended_sets: {
      id: number;
      set_number: number;
      recommended_reps: number;
    }[];
    // Made to-one at runtime by the unique constraint on
    // recommended_workout_exercise_id (at most one actual_workout_exercise
    // per recommended one) -- PostgREST returns null or a single object,
    // not an array, once that constraint exists.
    actual_workout_exercises: {
      id: number;
      actual_sets: {
        set_number: number;
        actual_reps: number;
        actual_weight: number;
      }[];
    } | null;
  }[];
};

export default async function WorkoutPage() {
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
    .select("weight_kg, gender, date_of_birth, training_experience, unit_preference")
    .eq("id", user.id)
    .single();

  const { data: workout } = await supabase
    .from("workouts")
    .select(
      `
      id,
      name,
      created_at,
      recommended_workout_exercises (
        id,
        exercises ( name, exercise_ratio ),
        recommended_sets (
          id,
          set_number,
          recommended_reps
        ),
        actual_workout_exercises (
          id,
          actual_sets ( set_number, actual_reps, actual_weight )
        )
      )
    `,
    )
    .is("finished_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<WorkoutQueryResult>();

  const bodyWeightKg = profile?.weight_kg ?? null;
  const isImperial = profile?.unit_preference === "imperial";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {workout ? (
          <>
            <h1 className="text-2xl font-semibold text-gray-900">
              {workout.name}
            </h1>
            {bodyWeightKg == null && (
              <p className="text-sm text-gray-500">
                Enter your weight in Settings to see suggested weights for each
                set.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {workout.recommended_workout_exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <h2 className="font-semibold text-gray-900">
                    {exercise.exercises?.name}
                  </h2>
                  <ul className="mt-2 flex flex-col gap-2 text-sm text-gray-600">
                    {exercise.recommended_sets
                      .sort((a, b) => a.set_number - b.set_number)
                      .map((set) => {
                        const actualSet = exercise.actual_workout_exercises?.actual_sets.find(
                          (a) => a.set_number === set.set_number,
                        );

                        const predictedWeightKg =
                          bodyWeightKg == null || exercise.exercises == null
                            ? null
                            : predictWeightKg({
                                bodyWeightKg,
                                exerciseRatio:
                                  exercise.exercises.exercise_ratio,
                                trainingExperience:
                                  profile?.training_experience ?? null,
                                gender: profile?.gender ?? null,
                                dateOfBirth: profile?.date_of_birth ?? null,
                                targetReps: set.recommended_reps,
                              });

                        const displayWeight =
                          predictedWeightKg == null
                            ? null
                            : isImperial
                              ? floorToIncrement(
                                  kgToLb(predictedWeightKg),
                                  WEIGHT_INCREMENT_LB,
                                )
                              : floorToIncrement(
                                  predictedWeightKg,
                                  WEIGHT_INCREMENT_KG,
                                );

                        return (
                          <li key={set.id} className="flex flex-col gap-1">
                            <div className="flex justify-between gap-4">
                              <span>Set {set.set_number}</span>
                              <span className="whitespace-nowrap text-gray-400">
                                {set.recommended_reps} reps
                                {displayWeight != null
                                  ? isImperial
                                    ? ` @ ${displayWeight.toFixed(0)}lbs`
                                    : ` @ ${displayWeight.toFixed(1)}kg`
                                  : ""}
                              </span>
                            </div>
                            <LogSetForm
                              recommendedWorkoutExerciseId={exercise.id}
                              setNumber={set.set_number}
                              isImperial={isImperial}
                              initialActualReps={actualSet?.actual_reps ?? null}
                              initialActualWeightKg={actualSet?.actual_weight ?? null}
                            />
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </div>
            <FinishWorkoutButton workoutId={workout.id} />
          </>
        ) : (
          <p className="text-gray-600">No workout in progress.</p>
        )}
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
