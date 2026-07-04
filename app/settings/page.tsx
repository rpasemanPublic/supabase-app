import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/app/components/SettingsForm";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userInfo } = await supabase
    .from("User")
    .select("username, weight_kg, height_cm, unit_preference, gender")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <SettingsForm
          userId={user.id}
          initialUsername={userInfo?.username ?? ""}
          initialWeightKg={userInfo?.weight_kg ?? null}
          initialHeightCm={userInfo?.height_cm ?? null}
          initialUnitPreference={userInfo?.unit_preference ?? "metric"}
          initialGender={userInfo?.gender ?? ""}
        />
        <Link
          href="/"
          className="text-center text-sm text-accent hover:underline"
        >
          Back
        </Link>
      </div>
    </main>
  );
}
