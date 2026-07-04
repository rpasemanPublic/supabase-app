// Predicts a starting weight for a user with no exercise history yet, from
// their body stats and an exercise's calibrated bodyweight ratio. See the
// exercises table migration for what exercise_ratio represents.

const PEAK_AGE_CEILING = 35;
const AGE_DECLINE_PER_YEAR = 0.01;
const AGE_MULTIPLIER_FLOOR = 0.7;

const EXPERIENCE_MULTIPLIERS: Record<string, number> = {
  novice: 0.6,
  intermediate: 1.0,
  advanced: 1.4,
};

const MALE_MULTIPLIER = 1.0;
// Applied to anything that isn't exactly "Male" (Female, custom entries,
// not set) -- deliberately the more conservative of the two, since
// under-recommending weight for an unspecified gender is lower-risk than
// over-recommending it.
const NEUTRAL_MULTIPLIER = 0.65;

// exercise_ratio is calibrated against this rep count; the Epley formula
// (1RM = weight * (1 + reps/30)) backs out an implied 1RM at that
// calibration point, then re-derives the weight for the actual target
// rep count of the set being predicted for.
const REFERENCE_REPS = 8;

export function getAgeMultiplier(age: number): number {
  if (age <= PEAK_AGE_CEILING) return 1.0;
  return Math.max(AGE_MULTIPLIER_FLOOR, 1.0 - AGE_DECLINE_PER_YEAR * (age - PEAK_AGE_CEILING));
}

export function getExperienceMultiplier(trainingExperience: string | null): number {
  // Defaults to the most conservative tier when unset, consistent with
  // the gender default below.
  if (trainingExperience == null) return EXPERIENCE_MULTIPLIERS.novice;
  return EXPERIENCE_MULTIPLIERS[trainingExperience] ?? EXPERIENCE_MULTIPLIERS.novice;
}

export function getGenderMultiplier(gender: string | null): number {
  return gender === "Male" ? MALE_MULTIPLIER : NEUTRAL_MULTIPLIER;
}

export function getAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export type PredictWeightInput = {
  bodyWeightKg: number;
  exerciseRatio: number;
  trainingExperience: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  targetReps: number;
};

export function predictWeightKg({
  bodyWeightKg,
  exerciseRatio,
  trainingExperience,
  gender,
  dateOfBirth,
  targetReps,
}: PredictWeightInput): number {
  const age = getAge(dateOfBirth);
  // No clear "safe direction" to default age in, unlike gender/experience,
  // so an unknown age just skips the age adjustment entirely.
  const ageMultiplier = age == null ? 1.0 : getAgeMultiplier(age);
  const experienceMultiplier = getExperienceMultiplier(trainingExperience);
  const genderMultiplier = getGenderMultiplier(gender);

  const referenceWeightKg =
    bodyWeightKg * exerciseRatio * experienceMultiplier * genderMultiplier * ageMultiplier;

  return (referenceWeightKg * (1 + REFERENCE_REPS / 30)) / (1 + targetReps / 30);
}
