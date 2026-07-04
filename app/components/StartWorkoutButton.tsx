"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function StartWorkoutButton({
  templateProgramId,
}: {
  templateProgramId: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleStart = async () => {
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("select_program_and_start_workout", {
      p_template_program_id: templateProgramId,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    router.push("/workout");
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <button
        onClick={handleStart}
        disabled={submitting}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Starting..." : "Start Workout"}
      </button>
    </div>
  );
}
