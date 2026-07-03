"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { AuthCard } from "@/app/components/AuthCard";

const inputClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();

    let email = identifier;
    if (!identifier.includes("@")) {
      const { data, error: resolveError } = await supabase.functions.invoke("resolve-username", {
        body: { username: identifier },
      });

      if (resolveError) {
        setSubmitting(false);
        setError(resolveError.message);
        return;
      }

      email = data.email;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <AuthCard title="Log in">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className={inputClasses}
          placeholder="Email or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <input
          className={inputClasses}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
