"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { AuthCard } from "@/app/components/AuthCard";
import { WeightHeightFields, type WeightHeightValues } from "@/app/components/WeightHeightFields";

const inputClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [trainingExperience, setTrainingExperience] = useState("");
  const [weightHeight, setWeightHeight] = useState<WeightHeightValues>({
    weightKg: null,
    heightCm: null,
    unitPreference: "metric",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          date_of_birth: dateOfBirth || null,
          training_experience: trainingExperience || null,
          weight_kg: weightHeight.weightKg,
          height_cm: weightHeight.heightCm,
          unit_preference: weightHeight.unitPreference,
        },
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account, then log in.");
  };

  return (
    <AuthCard title="Sign up">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className={inputClasses}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className={inputClasses}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={inputClasses}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
          <WeightHeightFields
            initialWeightKg={null}
            initialHeightCm={null}
            initialUnitPreference="metric"
            onChange={setWeightHeight}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dateOfBirth" className="text-sm text-gray-600">
            Date of birth (optional)
          </label>
          <input
            id="dateOfBirth"
            className={inputClasses}
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="trainingExperience" className="text-sm text-gray-600">
            Training experience (optional)
          </label>
          <select
            id="trainingExperience"
            className={inputClasses}
            value={trainingExperience}
            onChange={(e) => setTrainingExperience(e.target.value)}
          >
            <option value="">Not set</option>
            <option value="novice">Novice</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing up..." : "Sign up"}
        </button>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
        )}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
