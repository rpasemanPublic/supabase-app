"use client";

import { useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { kgToLb } from "@/utils/weight_transform";

type WorkoutSummary = {
  id: number;
  name: string;
  finished_at: string;
};

type WorkoutDetail = {
  id: number;
  exercises: { name: string } | null;
  actual_sets: {
    id: number;
    set_number: number;
    actual_reps: number;
    actual_weight: number;
  }[];
}[];

export function WorkoutHistoryList({
  workouts,
  isImperial,
}: {
  workouts: WorkoutSummary[];
  isImperial: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSummary | null>(null);
  const [detail, setDetail] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async (workout: WorkoutSummary) => {
    setSelectedWorkout(workout);
    setDetail(null);
    setError(null);
    setLoading(true);
    dialogRef.current?.showModal();

    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("actual_workout_exercises")
      .select(
        `
        id,
        exercises ( name ),
        actual_sets ( id, set_number, actual_reps, actual_weight )
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

  const formatWeight = (weightKg: number) =>
    isImperial ? `${kgToLb(weightKg).toFixed(0)}lbs` : `${weightKg.toFixed(1)}kg`;

  if (workouts.length === 0) {
    return <p className="text-sm text-gray-600">No finished workouts yet.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {workouts.map((workout) => (
          <li key={workout.id}>
            <button
              onClick={() => handleOpen(workout)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left text-sm hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{workout.name}</span>
              <span className="text-gray-500">
                {new Date(workout.finished_at).toLocaleDateString()}
              </span>
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
                  {exercise.actual_sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((set) => (
                      <li key={set.id} className="flex justify-between gap-4">
                        <span>Set {set.set_number}</span>
                        <span className="whitespace-nowrap text-gray-400">
                          {set.actual_reps} reps @ {formatWeight(set.actual_weight)}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => dialogRef.current?.close()}
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Close
        </button>
      </dialog>
    </>
  );
}
