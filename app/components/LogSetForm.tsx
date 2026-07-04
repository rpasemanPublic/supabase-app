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
  disabled: boolean;
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
  disabled,
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

  const trySave = async () => {
    const parsedReps = parseInt(reps, 10);
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedReps) || isNaN(parsedWeight)) {
      // Incomplete entry -- nothing to save yet, no error to show.
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

  // Fires once focus leaves both inputs together, not when tabbing between
  // them -- e.relatedTarget is the element gaining focus, so this only
  // triggers a save when it's outside the group.
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) {
      return;
    }
    trySave();
  };

  return (
    <div
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget
            .querySelectorAll("input")
            .forEach((input) => input.blur());
        }
      }}
      className="flex items-center gap-2"
    >
      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        disabled={disabled}
        onChange={(e) => {
          setReps(e.target.value);
          setStatus("idle");
        }}
        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      />
      <input
        type="number"
        inputMode="decimal"
        placeholder={isImperial ? "lbs" : "kg"}
        value={weight}
        disabled={disabled}
        onChange={(e) => {
          setWeight(e.target.value);
          setStatus("idle");
        }}
        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      />
      <span className="w-12 text-xs text-gray-500">
        {status === "saving"
          ? "Saving..."
          : status === "saved" || (initialActualReps && initialActualWeightKg)
            ? "Logged"
            : ""}
      </span>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
