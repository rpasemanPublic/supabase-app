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
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <p>Hello {profile?.username ?? user.email}</p>
      <LogoutButton />
    </div>
  );
}
