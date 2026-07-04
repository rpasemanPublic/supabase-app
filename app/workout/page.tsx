import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { predictWeightKg } from "@/utils/predict_weight";
import { kgToLb, lbToKg, floorToIncrement } from "@/utils/weight_transform";
import { LogSetForm } from "@/app/components/LogSetForm";
import { FinishWorkoutButton } from "@/app/components/FinishWorkoutButton";

// Smallest plate increment lifters typically load per side, doubled: 5lb
// plates are standard in imperial gyms, 2.5kg plates in metric ones.
const WEIGHT_INCREMENT_LB = 5;
const WEIGHT_INCREMENT_KG = 2.5;

// Without generated Database types, postgrest-js can't tell this is a
// many-to-one embed (recommended_workout_exercises.exercise_id -> exercises.id)
// and infers `exercises` as an array; .overrideTypes() overrides that with
// the shape it actually returns at runtime -- a single object.
type WorkoutQueryResult = {
  id: number;
  name: string;
  created_at: string;
  recommended_workout_exercises: {
    id: number;
    exercise_id: number;
    exercises: { name: string; exercise_ratio: number } | null;
    template_exercises: { min_reps: number; max_reps: number } | null;
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

type PreviousActualSet = {
  exercise_id: number;
  set_number: number;
  actual_reps: number;
  actual_weight: number;
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
        exercise_id,
        exercises ( name, exercise_ratio ),
        template_exercises ( min_reps, max_reps ),
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
    .overrideTypes<WorkoutQueryResult, { merge: false }>();

  const bodyWeightKg = profile?.weight_kg ?? null;
  const isImperial = profile?.unit_preference === "imperial";

  // The most recent *other* time the user did each exercise in this
  // workout, used to progress reps/weight from what they actually did
  // rather than always predicting off body stats. Keyed by exercise_id
  // (stable across workout days) rather than recommended_workout_exercise_id,
  // so progression carries over even when the same exercise appears on a
  // different day of the program.
  const exerciseIds = workout
    ? [...new Set(workout.recommended_workout_exercises.map((e) => e.exercise_id))]
    : [];

  // .rpc() infers a scalar result without generated Database types, so
  // .overrideTypes<T[]>() trips its own "can't cast object to array" guard --
  // asserting the type directly on the destructured data sidesteps that.
  const { data: previousActualSetsRaw } =
    exerciseIds.length === 0
      ? { data: [] as PreviousActualSet[] }
      : await supabase.rpc("latest_actual_exercise_sets", {
          p_exercise_ids: exerciseIds,
          p_exclude_workout_id: workout!.id,
        });
  const previousActualSets = previousActualSetsRaw as PreviousActualSet[] | null;

  const latestActualByExerciseId = new Map<number, Map<number, PreviousActualSet>>();
  for (const row of previousActualSets ?? []) {
    if (!latestActualByExerciseId.has(row.exercise_id)) {
      latestActualByExerciseId.set(row.exercise_id, new Map());
    }
    latestActualByExerciseId.get(row.exercise_id)!.set(row.set_number, row);
  }

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

                        const previousSet = latestActualByExerciseId
                          .get(exercise.exercise_id)
                          ?.get(set.set_number);

                        const minReps =
                          exercise.template_exercises?.min_reps ??
                          set.recommended_reps;
                        const maxReps =
                          exercise.template_exercises?.max_reps ??
                          set.recommended_reps;

                        // Progress from what the user actually did last time:
                        // add a rep until they hit the top of the rep range,
                        // then bump the weight and drop back to the bottom of
                        // the range. With no prior attempt for this set, fall
                        // back to the body-stat-based prediction as a
                        // starting point.
                        let recommendedReps: number;
                        let recommendedWeightKg: number | null;
                        let isProgression: boolean;

                        if (previousSet) {
                          isProgression = true;
                          if (previousSet.actual_reps >= maxReps) {
                            recommendedReps = minReps;
                            recommendedWeightKg =
                              previousSet.actual_weight +
                              (isImperial
                                ? lbToKg(WEIGHT_INCREMENT_LB)
                                : WEIGHT_INCREMENT_KG);
                          } else {
                            recommendedReps = previousSet.actual_reps + 1;
                            recommendedWeightKg = previousSet.actual_weight;
                          }
                        } else {
                          isProgression = false;
                          recommendedReps = set.recommended_reps;
                          recommendedWeightKg =
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
                                  targetReps: recommendedReps,
                                });
                        }

                        const displayWeight =
                          recommendedWeightKg == null
                            ? null
                            : isProgression
                              ? isImperial
                                ? kgToLb(recommendedWeightKg)
                                : recommendedWeightKg
                              : isImperial
                                ? floorToIncrement(
                                    kgToLb(recommendedWeightKg),
                                    WEIGHT_INCREMENT_LB,
                                  )
                                : floorToIncrement(
                                    recommendedWeightKg,
                                    WEIGHT_INCREMENT_KG,
                                  );

                        return (
                          <li key={set.id} className="flex flex-col gap-1">
                            <div className="flex justify-between gap-4">
                              <span>Set {set.set_number}</span>
                              <span className="whitespace-nowrap text-gray-400">
                                {recommendedReps} reps
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
