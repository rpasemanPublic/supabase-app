"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LogSetForm } from "@/app/components/LogSetForm";
import { kgToLb } from "@/utils/weight_transform";

type WorkoutSummary = {
  id: number;
  name: string;
  finished_at: string;
};

type WorkoutDetail = {
  id: number;
  exercises: { name: string } | null;
  recommended_sets: { id: number; set_number: number; recommended_reps: number }[];
  // To-one at runtime (see app/workout/page.tsx for why), so an exercise
  // that was planned but never logged comes back as null here rather than
  // just being absent from the list -- that's what lets a recommended-only
  // exercise still show up as "not logged" instead of disappearing.
  actual_workout_exercises: {
    actual_sets: {
      id: number;
      set_number: number;
      actual_reps: number;
      actual_weight: number;
    }[];
  } | null;
}[];

export function WorkoutHistoryList({
  workouts,
  isImperial,
}: {
  workouts: WorkoutSummary[];
  isImperial: boolean;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSummary | null>(null);
  const [detail, setDetail] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleOpen = async (workout: WorkoutSummary) => {
    setSelectedWorkout(workout);
    setDetail(null);
    setError(null);
    setIsEditing(false);
    setLoading(true);
    dialogRef.current?.showModal();

    // Query from recommended_workout_exercises rather than
    // actual_workout_exercises, so an exercise that was planned but never
    // logged still shows up (with no actual data) instead of silently
    // being left out.
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("recommended_workout_exercises")
      .select(
        `
        id,
        exercises ( name ),
        recommended_sets ( id, set_number, recommended_reps ),
        actual_workout_exercises ( actual_sets ( id, set_number, actual_reps, actual_weight ) )
      `,
      )
      .eq("workout_id", workout.id)
      .overrideTypes<WorkoutDetail, { merge: false }>();

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setDetail(data ?? []);
  };

  const handleDelete = async (workout: WorkoutSummary) => {
    if (!window.confirm(`Delete "${workout.name}"? This can't be undone.`)) {
      return;
    }

    setDeletingId(workout.id);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("workouts")
      .delete()
      .eq("id", workout.id);

    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  };

  const formatWeight = (weightKg: number) =>
    isImperial ? `${kgToLb(weightKg).toFixed(0)}lbs` : `${weightKg.toFixed(1)}kg`;

  if (workouts.length === 0) {
    return <p className="text-sm text-gray-600">No finished workouts yet.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {workouts.map((workout) => (
          <li key={workout.id} className="flex items-center gap-2">
            <button
              onClick={() => handleOpen(workout)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left text-sm hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{workout.name}</span>
              <span className="text-gray-500">
                {new Date(workout.finished_at).toLocaleDateString()}
              </span>
            </button>
            <button
              onClick={() => handleDelete(workout)}
              disabled={deletingId === workout.id}
              aria-label={`Delete ${workout.name}`}
              className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6.5 0 .6 9.4A1.5 1.5 0 0 0 7.6 17h4.8a1.5 1.5 0 0 0 1.5-1.6L14.5 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto w-full max-w-sm rounded-2xl border border-gray-200 p-6 shadow-lg backdrop:bg-black/30"
        onClose={() => setSelectedWorkout(null)}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {selectedWorkout?.name}
        </h2>
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {!loading && !error && (
          <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
            {detail?.map((exercise) => (
              <div key={exercise.id}>
                <h3 className="font-semibold text-gray-900">
                  {exercise.exercises?.name}
                </h3>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-gray-600">
                  {exercise.recommended_sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((set) => {
                      const actualSet = exercise.actual_workout_exercises?.actual_sets.find(
                        (a) => a.set_number === set.set_number,
                      );

                      return isEditing ? (
                        <li key={set.id} className="flex items-center gap-2">
                          <span className="w-12 shrink-0">Set {set.set_number}</span>
                          <LogSetForm
                            recommendedWorkoutExerciseId={exercise.id}
                            setNumber={set.set_number}
                            isImperial={isImperial}
                            initialActualReps={actualSet?.actual_reps ?? null}
                            initialActualWeightKg={actualSet?.actual_weight ?? null}
                            disabled={false}
                          />
                        </li>
                      ) : (
                        <li key={set.id} className="flex justify-between gap-4">
                          <span>Set {set.set_number}</span>
                          <span className="whitespace-nowrap text-gray-400">
                            {actualSet
                              ? `${actualSet.actual_reps} reps @ ${formatWeight(actualSet.actual_weight)}`
                              : "Not logged"}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            Edit Workout
          </button>
        )}
        <button
          onClick={() => dialogRef.current?.close()}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Close
        </button>
      </dialog>
    </>
  );
}
