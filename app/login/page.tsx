"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

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
      const { data, error: resolveError } = await supabase.functions.invoke(
        "resolve-username",
        { body: { username: identifier } },
      );

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
    <form onSubmit={handleSubmit}>
      <h1>Log in</h1>
      <input
        placeholder="Email or username"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={submitting}>
        {submitting ? "Logging in..." : "Log in"}
      </button>
      {error && <p role="alert">{error}</p>}
      <p>
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </p>
    </form>
  );
}
