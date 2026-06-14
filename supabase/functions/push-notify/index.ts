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

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "";
// Normalizzazione robusta del subject: web-push accetta "mailto:" solo se è in
// posizione 0. Un singolo spazio/carattere spurio (tipico del copia-incolla nei
// secret) lo fa interpretare come URL → "Vapid subject is not a valid URL".
// Qui estraiamo il token pulito mailto:/https:// indipendentemente da cosa lo circonda.
const RAW_SUBJECT = (Deno.env.get("VAPID_SUBJECT") || "").trim();
const SUBJECT_MATCH = RAW_SUBJECT.match(/(mailto:\S+|https:\/\/\S+)/i);
const VAPID_SUBJECT = SUBJECT_MATCH ? SUBJECT_MATCH[1] : "mailto:admin@strato.app";

// IMPORTANTE: setVapidDetails NON viene chiamato al top-level. Se lanciasse
// (chiavi mancanti/non valide) il worker non si avvierebbe e il client vedrebbe
// solo "failed to send a request to edge function", senza causa. Inizializzazione
// lazy dentro l'handler: la function si avvia sempre e restituisce un errore leggibile.
let vapidReady = false;
let vapidError = "";
function ensureVapid(): boolean {
  if (vapidReady) return true;
  if (vapidError) return false;
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      throw new Error("VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY mancante nei secret");
    }
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    vapidReady = true;
    return true;
  } catch (e) {
    vapidError = String((e && (e as { message?: string }).message) || e);
    return false;
  }
}

// createClient anch'esso lazy: al top-level non resta NESSUN codice che possa
// lanciare, così il worker si avvia sempre e OPTIONS/preflight risponde 200.
let _admin: ReturnType<typeof createClient> | null = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) throw new Error("SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY non disponibili");
  _admin = createClient(url, key);
  return _admin;
}

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
    const supabaseAdmin = getAdmin();
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

    // Config VAPID verificata qui (lazy): se fallisce, errore leggibile invece di crash al boot.
    if (!ensureVapid()) return json({ error: "vapid_config: " + vapidError }, 500);

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
