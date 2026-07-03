"use client";

import { useState } from "react";

type Exercise = {
  id: number;
  name: string;
  recommended_sets: number;
  min_reps: number;
  max_reps: number;
};

type Workout = {
  id: number;
  name: string;
  template_exercises: Exercise[];
};

type Program = {
  id: number;
  name: string;
  template_workouts: Workout[];
};

export function ProgramExplorer({ programs }: { programs: Program[] }) {
  const [selectedId, setSelectedId] = useState(programs[0]?.id);
  const selected = programs.find((program) => program.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
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

      <div className="flex flex-col gap-3">
        {selected?.template_workouts.map((workout) => (
          <div key={workout.id} className="rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900">{workout.name}</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-gray-600">
              {workout.template_exercises.map((exercise) => (
                <li key={exercise.id} className="flex justify-between gap-4">
                  <span>{exercise.name}</span>
                  <span className="whitespace-nowrap text-gray-400">
                    {exercise.recommended_sets} x {exercise.min_reps}-{exercise.max_reps}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
