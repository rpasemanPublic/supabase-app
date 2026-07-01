"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function AddUserForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: fnError } = await supabase.functions.invoke("create-user", {
      body: { username, firstname, lastname },
    });

    setSubmitting(false);

    if (fnError) {
      setError(fnError.message);
      return;
    }

    setUsername("");
    setFirstname("");
    setLastname("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        placeholder="First name"
        value={firstname}
        onChange={(e) => setFirstname(e.target.value)}
      />
      <input
        placeholder="Last name"
        value={lastname}
        onChange={(e) => setLastname(e.target.value)}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add user"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
