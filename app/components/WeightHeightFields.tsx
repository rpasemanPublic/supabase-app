"use client";

import { useState } from "react";
import {
  kgToLb,
  lbToKg,
  cmToFeetInches,
  feetInchesToCm,
} from "@/utils/weight_transform";

const inputClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function formatWeightText(
  weightKg: number | null,
  unitPreference: string,
): string {
  if (weightKg == null) return "";
  const value = unitPreference === "imperial" ? kgToLb(weightKg) : weightKg;
  return value.toFixed(0);
}

function formatHeightCmText(heightCm: number | null): string {
  return heightCm == null ? "" : heightCm.toFixed(0);
}

function formatFeetText(heightCm: number | null): string {
  return heightCm == null ? "" : String(cmToFeetInches(heightCm).feet);
}

function formatInchesText(heightCm: number | null): string {
  return heightCm == null ? "" : cmToFeetInches(heightCm).inches.toFixed(0);
}

function parseWeightKg(text: string, unitPreference: string): number | null {
  if (text === "") return null;
  const parsed = parseFloat(text);
  if (Number.isNaN(parsed)) return null;
  return unitPreference === "imperial" ? lbToKg(parsed) : parsed;
}

function parseHeightCm(
  heightCmText: string,
  feetText: string,
  inchesText: string,
  unitPreference: string,
): number | null {
  if (unitPreference === "imperial") {
    if (feetText === "" && inchesText === "") return null;
    const feet = feetText === "" ? 0 : parseFloat(feetText);
    const inches = inchesText === "" ? 0 : parseFloat(inchesText);
    if (Number.isNaN(feet) || Number.isNaN(inches)) return null;
    return feetInchesToCm(feet, inches);
  }
  if (heightCmText === "") return null;
  const parsed = parseFloat(heightCmText);
  return Number.isNaN(parsed) ? null : parsed;
}

export type WeightHeightValues = {
  weightKg: number | null;
  heightCm: number | null;
  unitPreference: string;
};

type Props = {
  initialWeightKg: number | null;
  initialHeightCm: number | null;
  initialUnitPreference: string;
  onChange: (values: WeightHeightValues) => void;
};

export function WeightHeightFields({
  initialWeightKg,
  initialHeightCm,
  initialUnitPreference,
  onChange,
}: Props) {
  const [unitPreference, setUnitPreference] = useState(initialUnitPreference);

  // Raw text the user is typing -- never reformatted mid-edit, only ever
  // (re)initialized from the canonical value when the unit changes. See
  // handleUnitChange for why this matters.
  const [weightText, setWeightText] = useState(() =>
    formatWeightText(initialWeightKg, initialUnitPreference),
  );
  const [heightCmText, setHeightCmText] = useState(() =>
    formatHeightCmText(initialHeightCm),
  );
  const [feetText, setFeetText] = useState(() =>
    formatFeetText(initialHeightCm),
  );
  const [inchesText, setInchesText] = useState(() =>
    formatInchesText(initialHeightCm),
  );

  const isImperial = unitPreference === "imperial";

  const emit = (
    nextWeightText: string,
    nextHeightCmText: string,
    nextFeetText: string,
    nextInchesText: string,
    nextUnit: string,
  ) => {
    onChange({
      weightKg: parseWeightKg(nextWeightText, nextUnit),
      heightCm: parseHeightCm(
        nextHeightCmText,
        nextFeetText,
        nextInchesText,
        nextUnit,
      ),
      unitPreference: nextUnit,
    });
  };

  const handleWeightChange = (value: string) => {
    setWeightText(value);
    emit(value, heightCmText, feetText, inchesText, unitPreference);
  };

  const handleHeightCmChange = (value: string) => {
    setHeightCmText(value);
    emit(weightText, value, feetText, inchesText, unitPreference);
  };

  const handleFeetChange = (value: string) => {
    setFeetText(value);
    emit(weightText, heightCmText, value, inchesText, unitPreference);
  };

  const handleInchesChange = (value: string) => {
    setInchesText(value);
    emit(weightText, heightCmText, feetText, value, unitPreference);
  };

  // Switching units converts whatever's currently entered (using the old
  // unit) to canonical, then reformats the text fields for the new unit --
  // this is the one point where we deliberately overwrite the text.
  const handleUnitChange = (newUnit: string) => {
    const canonicalWeight = parseWeightKg(weightText, unitPreference);
    const canonicalHeight = parseHeightCm(
      heightCmText,
      feetText,
      inchesText,
      unitPreference,
    );

    setUnitPreference(newUnit);
    setWeightText(formatWeightText(canonicalWeight, newUnit));
    setHeightCmText(formatHeightCmText(canonicalHeight));
    setFeetText(formatFeetText(canonicalHeight));
    setInchesText(formatInchesText(canonicalHeight));

    onChange({
      weightKg: canonicalWeight,
      heightCm: canonicalHeight,
      unitPreference: newUnit,
    });
  };

  return (
    <>
      <label htmlFor="weight" className="text-sm text-gray-700">
        Weight ({isImperial ? "lbs" : "kg"})
      </label>
      <input
        id="weight"
        className={inputClasses}
        type="number"
        step="1"
        value={weightText}
        onChange={(e) => handleWeightChange(e.target.value)}
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
            onChange={(e) => handleFeetChange(e.target.value)}
          />
          <input
            className={inputClasses}
            type="number"
            step="1"
            placeholder="in"
            value={inchesText}
            onChange={(e) => handleInchesChange(e.target.value)}
          />
        </div>
      ) : (
        <input
          id="height"
          className={inputClasses}
          type="number"
          step="0.1"
          value={heightCmText}
          onChange={(e) => handleHeightCmChange(e.target.value)}
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
    </>
  );
}
