import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { LogoutButton } from "@/app/components/LogoutButton";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("User")
    .select("username, role")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-2xl font-semibold text-accent">
          {(profile?.username ?? user.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <p className="text-xl font-medium text-gray-900">
          Hello {profile?.username ?? user.email}
          {profile?.role === "admin" && (
            <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
              Admin
            </span>
          )}
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
