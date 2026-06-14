// supabase/functions/push-notify/index.ts
// Invia una notifica push Web a tutti i dispositivi iscritti di un utente.

import webpush from "https://esm.sh/web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@strato.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function assertAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, status: 401, error: "Token mancante" };

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return { ok: false, status: 401, error: "Token non valido" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) return { ok: false, status: 500, error: profileError.message };
  if (!profile?.is_admin) return { ok: false, status: 403, error: "Solo admin" };

  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Metodo non consentito" }, 405);

  try {
    const admin = await assertAdmin(req);
    if (!admin.ok) return json({ error: admin.error }, admin.status);

    const { user_id, title, body, url } = await req.json();
    if (!user_id) return json({ error: "user_id mancante" }, 400);

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", user_id);

    if (error) return json({ error: error.message }, 500);

    const payload = JSON.stringify({
      title: title || "Strato",
      body: body || "",
      url: url || "/",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "strato-order-" + user_id,
    });

    const results = await Promise.allSettled(
      (subs || []).map(async (s: any) => {
        try {
          await webpush.sendNotification(s.subscription, payload);
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id);
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return json({ sent, failed, total: subs?.length || 0 });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
