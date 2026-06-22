const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function canUseWebPush() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

export function urlB64ToUint8Array(b64) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function sameAppServerKey(existing, current) {
  if (!existing) return null; // alcuni browser non espongono la chiave: non possiamo confrontare
  const a = new Uint8Array(existing);
  if (a.length !== current.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== current[i]) return false;
  return true;
}

export async function getPushRegistration() {
  return (await navigator.serviceWorker.getRegistration("/sw.js"))
    || (await navigator.serviceWorker.getRegistration())
    || null;
}

// Stato corrente delle notifiche, riflesso anche dopo refresh pagina.
export async function checkPushStatus() {
  const supported = canUseWebPush();
  if (!supported) return { supported: false, permission: "unsupported", subscribed: false };
  const permission = Notification.permission;
  let subscribed = false;
  try {
    const reg = await getPushRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    subscribed = !!sub;
  } catch (_) {}
  return { supported, permission, subscribed };
}

export async function enablePushNotifications(supabaseClient, userId) {
  if (!canUseWebPush()) throw new Error("push-not-supported");
  if (!VAPID_PUBLIC_KEY) throw new Error("missing-vapid-public-key");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "push-denied" : "push-dismissed");

  const appKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
  const reg = await navigator.serviceWorker.register("/sw.js");
  let sub = await reg.pushManager.getSubscription();

  // Subscription legata a una VAPID key diversa (chiavi rigenerate): la rimuoviamo
  // e ne creiamo una nuova, così il push server non la rifiuta.
  if (sub && sameAppServerKey(sub.options?.applicationServerKey, appKey) === false) {
    const oldEndpoint = sub.endpoint;
    try { await sub.unsubscribe(); } catch (_) {}
    try { await supabaseClient.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", oldEndpoint); } catch (_) {}
    sub = null;
  }

  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
  }

  const { error } = await supabaseClient
    .from("push_subscriptions")
    .upsert({ user_id: userId, subscription: sub.toJSON() }, { onConflict: "user_id,endpoint" });
  if (error) throw error;
  return true;
}

// Disattiva SOLO la subscription del dispositivo corrente (non quelle di altri device).
export async function disablePushNotifications(supabaseClient, userId) {
  if (!canUseWebPush()) return false;
  try {
    const reg = await getPushRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      const endpoint = sub.endpoint;
      try { await supabaseClient.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint); } catch (_) {}
      try { await sub.unsubscribe(); } catch (_) {}
    }
  } catch (_) {}
  return false;
}
