// supabase/functions/push-notify/index.ts
// Notifiche push Web per Strato.
// Caso A: admin aggiorna stato ordine → notifica al cliente
// Caso B: cliente crea ordine → notifica a tutti gli admin iscritti
// Deploy:  supabase functions deploy push-notify
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

import webpush from "https://esm.sh/web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Token VAPID letti in modo difensivo (mai ! che genera boot crash su secret mancante).
const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")  || "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const RAW_SUBJECT   = (Deno.env.get("VAPID_SUBJECT") || "").trim();
const SUBJECT_MATCH = RAW_SUBJECT.match(/(mailto:\S+|https:\/\/\S+)/i);
const VAPID_SUBJECT = SUBJECT_MATCH ? SUBJECT_MATCH[1] : "mailto:admin@strato.app";

// setVapidDetails LAZY: un crash al top-level renderebbe OPTIONS 500 e l'errore invisibile.
let vapidReady = false;
let vapidError  = "";
function ensureVapid(): boolean {
  if (vapidReady) return true;
  if (vapidError) return false;
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE)
      throw new Error("VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY mancante nei secret");
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    vapidReady = true;
    return true;
  } catch (e) {
    vapidError = String((e as { message?: string })?.message || e);
    return false;
  }
}

// createClient LAZY: stessa ragione.
let _admin: ReturnType<typeof createClient> | null = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) throw new Error("SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti");
  _admin = createClient(url, key);
  return _admin;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Invia a una lista di subscription; rimuove quelle scadute (404/410).
async function sendToSubs(
  admin: ReturnType<typeof createClient>,
  subs: Array<{ id: string; subscription: webpush.PushSubscription }>,
  payload: string
) {
  const results = await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(s.subscription, payload);
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        }
        throw err;
      }
    })
  );
  const sent   = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent, failed, total: subs.length };
}

Deno.serve(async (req) => {
  // Preflight CORS: deve rispondere 200 PRIMA di qualsiasi logica.
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "method_not_allowed" }, 405);

  try {
    const admin = getAdmin();

    // Auth: verifica il Bearer token del chiamante.
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "missing_auth_token" }, 401);

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) return json({ error: "invalid_auth_token" }, 401);
    const callerId = authData.user.id;

    const body = await req.json();

    // Supporto payload legacy { user_id, title, body, url } per compatibilità.
    const isLegacy = !body.type && body.user_id && body.title;
    const type: string = body.type || (isLegacy ? "order_status_legacy" : "");

    // ─────────────────────────────────────────────────────────────────────
    // CASO A — Admin aggiorna stato ordine → notifica al cliente
    // ─────────────────────────────────────────────────────────────────────
    if (type === "order_status" || type === "order_status_legacy") {

      // Verifica admin.
      const { data: callerProfile, error: callerErr } = await admin
        .from("profiles").select("is_admin").eq("id", callerId).maybeSingle();
      if (callerErr) return json({ error: callerErr.message }, 500);
      if (!callerProfile?.is_admin) return json({ error: "admin_required" }, 403);

      if (!ensureVapid()) return json({ error: "vapid_config: " + vapidError }, 500);

      let targetUserId: string;
      let notifTitle: string;
      let notifBody: string;
      let notifUrl: string;

      if (isLegacy) {
        // Payload precedente: titolo/body già calcolati dal client.
        targetUserId = body.user_id;
        notifTitle   = body.title;
        notifBody    = body.body || "";
        notifUrl     = body.url  || "/";
      } else {
        // Payload tipizzato: leggiamo ordine e calcoliamo copy server-side.
        const orderId: string = body.order_id;
        const status: string  = body.status || "";
        if (!orderId) return json({ error: "order_id mancante" }, 400);

        const { data: order, error: orderErr } = await admin
          .from("orders").select("user_id").eq("id", orderId).maybeSingle();
        if (orderErr) return json({ error: orderErr.message }, 500);
        if (!order)   return json({ error: "ordine non trovato" }, 404);

        targetUserId = order.user_id;

        const isConfirmed = status === "confirmed";
        notifTitle = isConfirmed ? "Ordine confermato" : "Aggiornamento sulla tua scelta";
        notifBody  = isConfirmed
          ? "Prepareremo il tuo oggetto con cura."
          : "Non possiamo confermare questa richiesta in questo momento.";
        notifUrl   = "/?tab=orders&order=" + encodeURIComponent(orderId);
      }

      // Subscription del cliente destinatario.
      const { data: subs, error: subsErr } = await admin
        .from("push_subscriptions").select("id, subscription").eq("user_id", targetUserId);
      if (subsErr) return json({ error: subsErr.message }, 500);

      const payload = JSON.stringify({ title: notifTitle, body: notifBody, url: notifUrl });
      const result  = await sendToSubs(admin, subs || [], payload);
      return json({ ...result, type: "order_status" });
    }

    // ─────────────────────────────────────────────────────────────────────
    // CASO B — Cliente crea ordine → notifica a tutti gli admin iscritti
    // ─────────────────────────────────────────────────────────────────────
    if (type === "new_order") {
      const orderId: string = body.order_id;
      if (!orderId) return json({ error: "order_id mancante" }, 400);

      // Verifica che il chiamante sia il proprietario dell'ordine.
      const { data: order, error: orderErr } = await admin
        .from("orders").select("user_id").eq("id", orderId).maybeSingle();
      if (orderErr) return json({ error: orderErr.message }, 500);
      if (!order)   return json({ error: "ordine non trovato" }, 404);
      if (order.user_id !== callerId) return json({ error: "unauthorized" }, 403);

      if (!ensureVapid()) return json({ error: "vapid_config: " + vapidError }, 500);

      // Tutti gli admin con subscription attiva.
      const { data: adminProfiles, error: admErr } = await admin
        .from("profiles").select("id").eq("is_admin", true);
      if (admErr) return json({ error: admErr.message }, 500);

      const adminIds = (adminProfiles || []).map((p: { id: string }) => p.id);
      if (!adminIds.length) return json({ sent: 0, failed: 0, total: 0, type: "new_order" });

      const { data: subs, error: subsErr } = await admin
        .from("push_subscriptions").select("id, subscription").in("user_id", adminIds);
      if (subsErr) return json({ error: subsErr.message }, 500);

      const payload = JSON.stringify({
        title: "Richiesta da confermare",
        body:  "Controlla i dettagli dell'ordine quando vuoi.",
        url:   "/?tab=orders",
      });
      const result = await sendToSubs(admin, subs || [], payload);
      return json({ ...result, type: "new_order" });
    }

    return json({ error: "type non riconosciuto: " + type }, 400);

  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
