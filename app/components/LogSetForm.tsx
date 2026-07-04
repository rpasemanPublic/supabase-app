"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { kgToLb, lbToKg } from "@/utils/weight_transform";

type Props = {
  recommendedWorkoutExerciseId: number;
  setNumber: number;
  isImperial: boolean;
  initialActualReps: number | null;
  initialActualWeightKg: number | null;
};

function formatWeight(weightKg: number, isImperial: boolean): string {
  return isImperial ? kgToLb(weightKg).toFixed(0) : weightKg.toFixed(1);
}

export function LogSetForm({
  recommendedWorkoutExerciseId,
  setNumber,
  isImperial,
  initialActualReps,
  initialActualWeightKg,
}: Props) {
  const router = useRouter();
  const [reps, setReps] = useState(
    initialActualReps != null ? String(initialActualReps) : "",
  );
  const [weight, setWeight] = useState(
    initialActualWeightKg != null
      ? formatWeight(initialActualWeightKg, isImperial)
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedReps = parseInt(reps, 10);
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedReps) || isNaN(parsedWeight)) {
      setError("Enter reps and weight");
      return;
    }

    setStatus("saving");
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("log_set", {
      p_recommended_workout_exercise_id: recommendedWorkoutExerciseId,
      p_set_number: setNumber,
      p_actual_reps: parsedReps,
      p_actual_weight: isImperial ? lbToKg(parsedWeight) : parsedWeight,
    });

    if (rpcError) {
      setError(rpcError.message);
      setStatus("idle");
      return;
    }

    setStatus("saved");
    router.refresh();
  };

  return (
    <form onSubmit={handleLog} className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        onChange={(e) => {
          setReps(e.target.value);
          setStatus("idle");
        }}
        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <input
        type="number"
        inputMode="decimal"
        placeholder={isImperial ? "lbs" : "kg"}
        value={weight}
        onChange={(e) => {
          setWeight(e.target.value);
          setStatus("idle");
        }}
        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-accent px-3 py-1 text-xs font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "saving" ? "..." : status === "saved" ? "Logged" : "Log"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
