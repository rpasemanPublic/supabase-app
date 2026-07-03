"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Program = {
  id: number;
  name: string;
};

export function SelectProgramDialog({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState(programs[0]?.id);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("select_program_and_start_workout", {
      p_template_program_id: selectedId,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    dialogRef.current?.close();
    router.push("/workout");
  };

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
      >
        Select a Program to Get Started
      </button>
      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto w-full max-w-xs rounded-2xl border border-gray-200 p-6 shadow-lg backdrop:bg-black/30"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Select a Program</h2>
        <label className="flex flex-col gap-1 text-left text-sm text-gray-700">
          Program
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          onClick={handleCreate}
          disabled={submitting}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create"}
        </button>
        <button
          onClick={() => dialogRef.current?.close()}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </dialog>
    </>
  );
}
