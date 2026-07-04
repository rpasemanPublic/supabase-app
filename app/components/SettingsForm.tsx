"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  WeightHeightFields,
  type WeightHeightValues,
} from "@/app/components/WeightHeightFields";

type Props = {
  userId: string;
  initialUsername: string;
  initialWeightKg: number | null;
  initialHeightCm: number | null;
  initialUnitPreference: string;
  initialGender: string;
  initialDateOfBirth: string;
  initialTrainingExperience: string;
};

const TRAINING_EXPERIENCE_OPTIONS = [
  { value: "novice", text: "Novice (0-1 years)" },
  { value: "intermediate", text: "Intermediate (1-5 years)" },
  { value: "advanced", text: "Advanced (5+ years)" },
];

const inputClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

const GENDER_PRESETS = ["Male", "Female", "Non-binary", "Prefer not to say"];

function numbersEqual(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return a === b;
  return Math.abs(a - b) < 0.01;
}

export function SettingsForm({
  userId,
  initialUsername,
  initialWeightKg,
  initialHeightCm,
  initialUnitPreference,
  initialGender,
  initialDateOfBirth,
  initialTrainingExperience,
}: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth);
  const [trainingExperience, setTrainingExperience] = useState(
    initialTrainingExperience,
  );

  const initialIsPreset =
    GENDER_PRESETS.includes(initialGender) || initialGender === "";
  const [genderPreset, setGenderPreset] = useState(
    initialIsPreset ? initialGender : "custom",
  );
  const [customGenderText, setCustomGenderText] = useState(
    initialIsPreset ? "" : initialGender,
  );

  const [weightHeight, setWeightHeight] = useState<WeightHeightValues>({
    weightKg: initialWeightKg,
    heightCm: initialHeightCm,
    unitPreference: initialUnitPreference,
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getGender = (): string =>
    genderPreset === "custom" ? customGenderText : genderPreset;

  const isDirty =
    username !== initialUsername ||
    weightHeight.unitPreference !== initialUnitPreference ||
    getGender() !== initialGender ||
    dateOfBirth !== initialDateOfBirth ||
    trainingExperience !== initialTrainingExperience ||
    !numbersEqual(weightHeight.weightKg, initialWeightKg) ||
    !numbersEqual(weightHeight.heightCm, initialHeightCm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("User")
      .update({
        username,
        weight_kg: weightHeight.weightKg,
        height_cm: weightHeight.heightCm,
        unit_preference: weightHeight.unitPreference,
        gender: getGender(),
        date_of_birth: dateOfBirth || null,
        training_experience: trainingExperience || null,
      })
      .eq("id", userId);

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
        <label htmlFor="username" className="text-sm text-gray-700">
          Username
        </label>
        <input
          id="username"
          className={inputClasses}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label htmlFor="gender" className="text-sm text-gray-700">
          Gender
        </label>
        <div className="flex flex-col gap-2">
          <select
            id="gender"
            className={inputClasses}
            value={genderPreset}
            onChange={(e) => setGenderPreset(e.target.value)}
          >
            <option value="">Not set</option>
            {GENDER_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {genderPreset === "custom" && (
            <input
              className={inputClasses}
              value={customGenderText}
              onChange={(e) => setCustomGenderText(e.target.value)}
              placeholder="Enter your own"
            />
          )}
        </div>

        <WeightHeightFields
          initialWeightKg={initialWeightKg}
          initialHeightCm={initialHeightCm}
          initialUnitPreference={initialUnitPreference}
          onChange={setWeightHeight}
        />

        <label htmlFor="dateOfBirth" className="text-sm text-gray-700">
          Date of birth
        </label>
        <input
          id="dateOfBirth"
          className={inputClasses}
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />

        <label htmlFor="trainingExperience" className="text-sm text-gray-700">
          Experience
        </label>
        <select
          id="trainingExperience"
          className={inputClasses}
          value={trainingExperience}
          onChange={(e) => setTrainingExperience(e.target.value)}
        >
          <option value="">Not set</option>
          {TRAINING_EXPERIENCE_OPTIONS.map(({ value, text }) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !isDirty}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
