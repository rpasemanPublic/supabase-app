import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Returned when the username doesn't exist, so callers can't tell the
// difference between "no such username" and "wrong password" downstream.
const NO_SUCH_USER_EMAIL = "no-such-user@invalid.local";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const { username } = await req.json();

  if (!username || typeof username !== "string") {
    return new Response(JSON.stringify({ error: "username is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: profile } = await supabase
    .from("User")
    .select("email")
    .eq("username", username)
    .single();

  return new Response(JSON.stringify({ email: profile?.email ?? NO_SUCH_USER_EMAIL }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
