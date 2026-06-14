// supabase/functions/push-notify/index.ts
// Invia una notifica push Web a tutti i dispositivi iscritti di un utente.
// Deploy:  supabase functions deploy push-notify
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:tu@dominio.it

import webpush from "https://esm.sh/web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@strato.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "missing_auth_token" }, 401);

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) return json({ error: "invalid_auth_token" }, 401);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) return json({ error: profileError.message }, 500);
    if (!profile?.is_admin) return json({ error: "admin_required" }, 403);

    const { user_id, title, body, url } = await req.json();
    if (!user_id) return json({ error: "user_id mancante" }, 400);

    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", user_id);
    if (error) return json({ error: error.message }, 500);

    const payload = JSON.stringify({
      title: title || "Strato",
      body: body || "",
      url: url || "/",
    });

    const results = await Promise.allSettled(
      (subs || []).map(async (s: { id: string; subscription: webpush.PushSubscription }) => {
        try {
          await webpush.sendNotification(s.subscription, payload);
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return json({ sent, total: subs?.length || 0 });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
