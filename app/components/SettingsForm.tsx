"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  kgToLb,
  lbToKg,
  cmToFeetInches,
  feetInchesToCm,
} from "@/utils/weight_transform";

type Props = {
  userId: string;
  initialUsername: string;
  initialWeightKg: number | null;
  initialHeightCm: number | null;
  initialUnitPreference: string;
};

const inputClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function formatWeightText(weightKg: number | null, unitPreference: string): string {
  if (weightKg == null) return "";
  const value = unitPreference === "imperial" ? kgToLb(weightKg) : weightKg;
  return value.toFixed(1);
}

function formatHeightCmText(heightCm: number | null): string {
  return heightCm == null ? "" : heightCm.toFixed(1);
}

function formatFeetText(heightCm: number | null): string {
  return heightCm == null ? "" : String(cmToFeetInches(heightCm).feet);
}

function formatInchesText(heightCm: number | null): string {
  return heightCm == null ? "" : cmToFeetInches(heightCm).inches.toFixed(1);
}

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
}: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [unitPreference, setUnitPreference] = useState(initialUnitPreference);

  // Raw text the user is typing -- never reformatted mid-edit, only ever
  // (re)initialized from the canonical value when the unit changes.
  const [weightText, setWeightText] = useState(() =>
    formatWeightText(initialWeightKg, initialUnitPreference),
  );
  const [heightCmText, setHeightCmText] = useState(() => formatHeightCmText(initialHeightCm));
  const [feetText, setFeetText] = useState(() => formatFeetText(initialHeightCm));
  const [inchesText, setInchesText] = useState(() => formatInchesText(initialHeightCm));

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isImperial = unitPreference === "imperial";

  const getWeightKg = (): number | null => {
    if (weightText === "") return null;
    const parsed = parseFloat(weightText);
    if (Number.isNaN(parsed)) return null;
    return isImperial ? lbToKg(parsed) : parsed;
  };

  const getHeightCm = (): number | null => {
    if (isImperial) {
      if (feetText === "" && inchesText === "") return null;
      const feet = feetText === "" ? 0 : parseFloat(feetText);
      const inches = inchesText === "" ? 0 : parseFloat(inchesText);
      if (Number.isNaN(feet) || Number.isNaN(inches)) return null;
      return feetInchesToCm(feet, inches);
    }
    if (heightCmText === "") return null;
    const parsed = parseFloat(heightCmText);
    return Number.isNaN(parsed) ? null : parsed;
  };

  // Switching units converts whatever's currently entered (using the old
  // unit) to canonical, then reformats the text fields for the new unit --
  // this is the one point where we deliberately overwrite the text.
  const handleUnitChange = (newUnit: string) => {
    const canonicalWeight = getWeightKg();
    const canonicalHeight = getHeightCm();

    setUnitPreference(newUnit);
    setWeightText(formatWeightText(canonicalWeight, newUnit));
    setHeightCmText(formatHeightCmText(canonicalHeight));
    setFeetText(formatFeetText(canonicalHeight));
    setInchesText(formatInchesText(canonicalHeight));
  };

  const isDirty =
    username !== initialUsername ||
    unitPreference !== initialUnitPreference ||
    !numbersEqual(getWeightKg(), initialWeightKg) ||
    !numbersEqual(getHeightCm(), initialHeightCm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("User")
      .update({
        username,
        weight_kg: getWeightKg(),
        height_cm: getHeightCm(),
        unit_preference: unitPreference,
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

        <label htmlFor="weight" className="text-sm text-gray-700">
          Weight ({isImperial ? "lbs" : "kg"})
        </label>
        <input
          id="weight"
          className={inputClasses}
          type="number"
          step="0.1"
          value={weightText}
          onChange={(e) => setWeightText(e.target.value)}
        />

        <label htmlFor="height" className="text-sm text-gray-700">
          Height {isImperial ? "(ft / in)" : "(cm)"}
        </label>
        {isImperial ? (
          <div className="flex gap-2">
            <input
              id="height"
              className={inputClasses}
              type="number"
              step="1"
              placeholder="ft"
              value={feetText}
              onChange={(e) => setFeetText(e.target.value)}
            />
            <input
              className={inputClasses}
              type="number"
              step="0.1"
              placeholder="in"
              value={inchesText}
              onChange={(e) => setInchesText(e.target.value)}
            />
          </div>
        ) : (
          <input
            id="height"
            className={inputClasses}
            type="number"
            step="0.1"
            value={heightCmText}
            onChange={(e) => setHeightCmText(e.target.value)}
          />
        )}

        <label htmlFor="unitPreference" className="text-sm text-gray-700">
          Units
        </label>
        <select
          id="unitPreference"
          className={inputClasses}
          value={unitPreference}
          onChange={(e) => handleUnitChange(e.target.value)}
        >
          <option value="metric">Metric</option>
          <option value="imperial">Imperial</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
