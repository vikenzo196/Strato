import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function canUseWebPush() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

function urlB64ToUint8Array(b64) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function sameAppServerKey(existing, current) {
  if (!existing) return null; // alcuni browser non espongono la chiave: non possiamo confrontare
  const a = new Uint8Array(existing);
  if (a.length !== current.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== current[i]) return false;
  return true;
}

async function getPushRegistration() {
  return (await navigator.serviceWorker.getRegistration("/sw.js"))
    || (await navigator.serviceWorker.getRegistration())
    || null;
}

// Stato corrente delle notifiche, riflesso anche dopo refresh pagina.
async function checkPushStatus() {
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

async function enablePushNotifications(supabaseClient, userId) {
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
async function disablePushNotifications(supabaseClient, userId) {
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


/* ============================ STILE (Liquid Glass) ===================== */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  :root{
    --text:#2b2620; --soft:rgba(43,38,32,.66); --faint:rgba(43,38,32,.42);
    --glass:rgba(252,247,240,.30); --glass2:rgba(252,247,240,.46);
    --strokeSoft:rgba(255,252,247,.46); --hi:rgba(255,253,249,.5); --glassDock:rgba(247,243,238,.82);
    --shadow:0 14px 44px rgba(60,40,30,.22); --txtShadow:rgba(70,45,30,.32);
    --shx:0px; --shy:14px; --shblur:44px; --shcol:rgba(60,40,30,.22); --hlx:32%; --hly:10%;
    --b1:#E4C9B0; --b2:#D9C2A3; --b3:#C9A07F; --b4:#C77D6B; --bg:#F4EFE8; --heart:#C2553F;
    --card:rgba(252,248,242,.55);
    --accent:#C77D6B; --accent2:#A65435; --accentDeep:#8B4A32; --sand:#D9C2A3; --clay:#C69B72; --terra:#B7795E;
  }
  body.dark{
    --text:#f1ece5; --soft:rgba(241,236,229,.7); --faint:rgba(241,236,229,.42);
    --glass:rgba(199,125,107,.08); --glass2:rgba(199,125,107,.13);
    --strokeSoft:rgba(199,125,107,.22); --hi:rgba(255,240,220,.18); --glassDock:rgba(45,36,32,.78);
    --shadow:0 16px 48px rgba(0,0,0,.55); --txtShadow:rgba(0,0,0,.55);
    --shy:16px; --shblur:48px; --shcol:rgba(0,0,0,.55);
    --b1:#4A382C; --b2:#5A4030; --b3:#6B463B; --b4:#7A4A38; --bg:#2D2420; --heart:#E0917B;
    --card:rgba(51,39,35,.56);
    --accent:#C77D6B; --accent2:#B7795E; --accentDeep:#A65435; --sand:#7A5A42; --clay:#8A6A4E; --terra:#B7795E;
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  .bgttl{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:17px;color:var(--text);margin:18px 2px 8px}
  html,body{margin:0;min-height:100%;touch-action:pan-x pan-y;}
  body{font-family:'Inter',system-ui,sans-serif;color:var(--text);background:var(--bg);overflow-x:hidden;}

  .glass{
    background:var(--glass);
    -webkit-backdrop-filter:blur(20px) saturate(160%); backdrop-filter:blur(20px) saturate(160%);
    border:1px solid var(--strokeSoft);
    box-shadow:var(--shx) var(--shy) var(--shblur) var(--shcol), inset 0 1px 0 var(--hi), inset 0 0 0 1px rgba(255,255,255,.06), inset 0 -8px 20px rgba(0,0,0,.05);
    position:relative;
  }
  .glass::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
    background:
      radial-gradient(70% 70% at var(--hlx) var(--hly), rgba(255,255,255,.16), rgba(255,255,255,0) 60%),
      linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,0) 46%, rgba(255,255,255,0) 84%, rgba(255,255,255,.06));
    opacity:.7;mix-blend-mode:screen;}
  body.dark .glass::before{opacity:.32}

  /* tutte le scritte: ombra proiettata */
  .shadowText{text-shadow:0 6px 18px var(--txtShadow);}

  /* .wrap canonicalizzato più in basso (riga unica) */

  .eyebrow{margin:14px 4px 0;color:var(--soft);font-weight:600;font-size:12.5px;letter-spacing:1.4px;text-transform:uppercase;}
  h1.hero{font-family:'Inter',system-ui,sans-serif;font-weight:800;font-size:33px;letter-spacing:-1px;line-height:1.12;margin:8px 4px 16px;text-shadow:0 2px 8px rgba(166,84,53,.14);}
  h2.title{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:27px;letter-spacing:-.5px;margin:10px 4px 16px;display:flex;align-items:center;gap:10px;}
  .ticon{width:28px;height:28px;flex:none;filter:drop-shadow(0 1px 1px rgba(74,35,18,.22)) drop-shadow(0 -0.6px .6px rgba(255,240,220,.4))}

  .heroCard{border-radius:30px;overflow:hidden;position:relative;aspect-ratio:3/2;}
  .heroCard>img{width:100%;height:100%;object-fit:cover;display:block;}
  .chip{position:absolute;left:14px;bottom:14px;padding:10px 14px;border-radius:18px;}
  .chip .t{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:18px}
  .chip .p{font-size:13px;color:var(--soft)}
  .dots{position:absolute;bottom:18px;right:18px;display:flex;gap:6px}
  .dots i{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.6)} .dots i.on{width:18px;background:#fff}

  .sec{display:flex;align-items:center;justify-content:space-between;margin:30px 4px 14px}
  .sec h2{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:22px;margin:0}

  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
  .card{border-radius:26px;overflow:hidden;display:flex;flex-direction:column;background:var(--glassDock);-webkit-backdrop-filter:blur(18px) saturate(175%);backdrop-filter:blur(18px) saturate(175%);box-shadow:var(--elev2)}
  .card::before{display:none}
  .card .ph{position:relative;aspect-ratio:1}
  .card .ph img{width:100%;height:100%;object-fit:cover;display:block}
  .lk{position:absolute;top:8px;right:8px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;cursor:pointer;border:1px solid rgba(235,218,198,.72);background:rgba(243,233,218,.84);box-shadow:var(--elev1);transition:transform .15s}
  .card .cnt{position:absolute;bottom:10px;left:10px;display:flex;align-items:center;gap:4px;font-size:11px;color:#fff;background:rgba(0,0,0,.5);padding:3px 8px;border-radius:20px}
  .card .body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:9px}
  .row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
  .row .t{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:17px}
  .row .p{font-weight:700;white-space:nowrap}
  .mat{font-size:12.5px;color:var(--soft)}
  .qstep{display:flex;align-items:center;gap:8px}
  .qstep button{width:38px;height:38px;border-radius:12px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-size:20px;font-weight:600;cursor:pointer;display:grid;place-items:center}
  .qstep span{min-width:26px;text-align:center;font-weight:700;font-size:17px;color:var(--text)}
  .qsend{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:16px;border:1px solid var(--strokeSoft);background:linear-gradient(135deg,#C77D6B,#A65435);color:#fff;font-weight:600;font-size:15px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.45), var(--elev2);transition:transform .12s}
  .qsend:active{transform:scale(.98)}
  .qsend svg{width:20px;height:20px}
  .heart{width:24px;height:24px;display:block;fill:rgba(255,255,255,.22);stroke:url(#g_white);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.5)) drop-shadow(0 -0.6px .6px rgba(255,255,255,.5));transition:fill .15s, stroke .15s}
  .heart.liked{fill:rgba(240,35,26,.24);stroke:url(#g_red)}

  /* SEARCH */
  .searchbar{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:20px;margin-bottom:18px}
  .searchbar input{flex:1;border:none;background:transparent;outline:none;font-family:inherit;font-size:16px;color:var(--text)}
  .searchbar input::placeholder{color:var(--faint)}

  /* CATEGORIE */
  .cats{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .cat{position:relative;border-radius:22px;padding:24px 14px 18px;display:flex;flex-direction:column;align-items:center;gap:14px;cursor:pointer;font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:21px;text-align:center}
  .cat .ci{position:relative;display:grid;place-items:center}
  .cat .ci .gico{width:57px;height:57px}
  .catedit{position:absolute;top:10px;right:10px;width:36px;height:36px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 4px 12px rgba(0,0,0,.2)}
  .catedit:active{transform:scale(.92)}
  .catedit svg{width:18px;height:18px}
  .gico{display:block;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1.5px rgba(80,45,25,.28)) drop-shadow(0 -.5px .6px rgba(255,248,238,.60))}
  .cathint{margin:16px 4px 14px;color:var(--soft,#9a8d7d);font-size:13px}
  .ipick{position:fixed;inset:0;z-index:85;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0);visibility:hidden;opacity:0;pointer-events:none;transition:opacity .28s ease, background .28s ease, visibility .28s}
  .ipick.on{visibility:visible;opacity:1;pointer-events:auto;background:rgba(0,0,0,.4)}
  .ipick .sheet{width:100%;max-width:520px;max-height:calc(100dvh - 20px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:var(--glassDock);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%);border-radius:28px;border:1px solid var(--strokeSoft);box-shadow:0 8px 36px rgba(43,33,27,.30),0 2px 6px rgba(43,33,27,.14);padding:16px 18px 20px;transform:translateY(100%);transition:transform .36s cubic-bezier(.2,.8,.2,1)}
  .iplabel{display:block;font-size:12px;font-weight:700;color:var(--soft);letter-spacing:.05em;text-transform:uppercase;margin:6px 2px 8px}
  .catinput{width:100%;border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:14px;padding:12px 14px;font-family:inherit;font-size:15px;color:var(--text);outline:none;margin-bottom:6px;box-shadow:inset 0 1px 0 var(--hi)}
  .catinput:focus{box-shadow:inset 0 1px 0 var(--hi),0 0 0 2px var(--text)}
  .iggroup{font-size:12px;font-weight:700;color:var(--soft);letter-spacing:.04em;text-transform:uppercase;margin:16px 2px 9px}
  .ipick.on .sheet{transform:translateY(0)}
  /* POPUP BENVENUTO / TEMA */
  .welcome{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,0);visibility:hidden;opacity:0;pointer-events:none;transition:opacity .3s ease, background .3s ease, visibility .3s}
  .welcome.on{visibility:visible;opacity:1;pointer-events:auto;background:rgba(0,0,0,.46)}
  .wcard{width:100%;max-width:420px;max-height:88vh;overflow-y:auto;border-radius:28px;padding:26px 22px 22px;background:var(--glassDock);-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%);border:1px solid var(--strokeSoft);box-shadow:0 24px 60px rgba(0,0,0,.4);transform:translateY(16px) scale(.98);transition:transform .34s cubic-bezier(.2,.8,.2,1)}
  .welcome.on .wcard{transform:none}
  .wmk{width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#C77D6B,#A65435);display:grid;place-items:center;color:#fff;margin:0 auto 14px;box-shadow:0 10px 24px var(--txtShadow),inset 0 1px 0 rgba(255,255,255,.6)}
  .wttl{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:23px;text-align:center;color:var(--text);margin:0 0 5px}
  .wsub{text-align:center;color:var(--soft);font-size:14px;margin:0 0 18px;line-height:1.45}
  .wlabel{font-size:12px;font-weight:700;color:var(--soft);letter-spacing:.06em;text-transform:uppercase;margin:0 2px 10px}
  .themes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
  .thopt{border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:18px;padding:15px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--text);font-weight:600;font-size:13px;transition:box-shadow .15s, transform .12s;box-shadow:inset 0 1px 0 var(--hi), 0 1px 6px rgba(0,0,0,.10)}
  .thopt:active{transform:scale(.96)}
  .thopt.on{box-shadow:inset 0 1px 0 var(--hi), 0 0 0 2px var(--text)}
  .thopt .gico{width:28px;height:28px}
  .wgo{width:100%;border:1px solid var(--strokeSoft);border-radius:16px;padding:14px;background:linear-gradient(135deg,#C77D6B,#A65435);color:#fff;font-weight:600;font-size:16px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 26px var(--shcol)}
  .ipick h4{margin:4px 0 14px;font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:18px;color:var(--text);display:flex;align-items:center;gap:10px}
  .sheetclose{display:flex;align-items:center;justify-content:center;width:42px;height:42px;margin:0 auto 14px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 5px 14px rgba(0,0,0,.16);transition:transform .12s}
  .sheetclose:active{transform:scale(.9)}
  .sheetclose svg{width:22px;height:22px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25)) drop-shadow(0 -.7px .7px rgba(255,255,255,.5))}
  .ipick h4 .gico,.invhead .gico{width:24px;height:24px;flex:none}
  .ipick .ig{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
  .ipick .ib{aspect-ratio:1;border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:16px;display:grid;place-items:center;cursor:pointer;transition:transform .12s}
  .ipick .ib:active{transform:scale(.92)}
  .ipick .ib.on{box-shadow:inset 0 1px 0 var(--hi),0 0 0 2px var(--text)}

  /* ===== DOCK (versione pulita: icone standard allineate + riquadro vetro sull'attiva) ===== */
  .dockwrap{position:fixed;left:0;right:0;bottom:8px;z-index:72;display:flex;justify-content:center;pointer-events:none}
  .dock{pointer-events:auto;display:flex;align-items:center;gap:5px;padding:8px 11px;border-radius:30px;
    background:var(--glassDock);
    -webkit-backdrop-filter:blur(20px) saturate(190%);backdrop-filter:blur(20px) saturate(190%);
    border:1px solid var(--strokeSoft);
    box-shadow:inset 0 1px 0 var(--hi), var(--elev3), 0 0 0 .5px rgba(0,0,0,.05)}
  .dnav{position:relative;width:53px;height:53px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:17px;padding:0;transition:background .2s, box-shadow .2s}
  .dnav svg{width:26px;height:26px;display:block;opacity:.95;transition:opacity .2s, filter .2s;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 -0.8px .8px rgba(255,255,255,.55))}
  .dnav.act{background:var(--glass2);box-shadow:inset 0 1px 0 var(--hi), 0 1px 6px rgba(0,0,0,.12)}
  .dnav.act svg{opacity:1}
  .dnav:not(.act) svg{stroke:var(--text);fill:none}
  .tb-spacer{width:44px;height:1px}
  .cardcat{display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:12.7px;font-weight:600;color:var(--soft)}
  .cardcat .gico{width:16px;height:16px;flex:none}
  .dnav .dot{position:absolute;top:10px;right:11px;width:9px;height:9px;border-radius:5px;background:var(--heart);border:1.5px solid var(--glassDock)}
  .topbar{position:fixed;top:0;left:0;right:0;z-index:50;display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:10px;padding:10px 14px;background:transparent;pointer-events:none}
  .topbar>*{pointer-events:auto}
  .topbar::after{content:"";position:absolute;left:0;right:0;top:0;height:128px;z-index:-1;opacity:0;transition:opacity .28s;
    background:linear-gradient(to bottom, rgba(0,0,0,.34), rgba(0,0,0,.16) 42%, transparent);
    -webkit-backdrop-filter:blur(10px) saturate(150%);backdrop-filter:blur(10px) saturate(150%);
    -webkit-mask-image:linear-gradient(to bottom,#000 50%,transparent);mask-image:linear-gradient(to bottom,#000 50%,transparent)}
  .topbar.scrolled::after{opacity:1}
  .topbar .brand2{justify-self:center;display:flex;align-items:center;gap:10px;font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:21px;letter-spacing:-.5px;color:var(--text);text-shadow:0 2px 10px var(--txtShadow)}
  .topbar .brand2 .mk{width:28px;height:28px;border-radius:10px;background:linear-gradient(135deg,#C77D6B,#A65435);display:grid;place-items:center;color:#fff;box-shadow:0 6px 16px var(--txtShadow), inset 0 1px 0 rgba(255,255,255,.6)}
  .tb-btn{width:40px;height:40px;border:none;background:transparent;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:13px;transition:background .2s}
  .tb-btn.left{justify-self:start}
  .tb-btn.right{justify-self:end}
  .tb-btn svg{width:25px;height:25px;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 -0.8px .8px rgba(255,255,255,.6))}
  .tb-btn .av{width:40px;height:40px;border-radius:50%;object-fit:cover;display:block;border:1.5px solid var(--strokeSoft);box-shadow:var(--elev1)}
  .tb-btn.act{background:var(--glass2)}
  .tb-btn.right.act .av{box-shadow:0 0 0 2px var(--glass2), var(--elev1)}
  .tb-right{justify-self:end;display:flex;align-items:center;gap:4px}
  .tb-btn.cart{position:relative}
  .cbadge{position:absolute;top:6px;right:6px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:var(--heart);color:#fff;font-size:10px;font-weight:700;display:none;place-items:center;border:1.5px solid var(--glassDock)}
  .tb-btn.orders{position:relative}
  .tb-btn.orders .dot{position:absolute;top:5px;right:5px;width:9px;height:9px;border-radius:5px;background:var(--heart);border:1.5px solid var(--bg)}
  .addcart{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-weight:600;font-size:13.5px;cursor:pointer;transition:transform .12s}
  .addcart:active{transform:scale(.97)}
  .addcart svg{width:22px;height:22px;display:block}
  .dback{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:12px 0;background:linear-gradient(to bottom,var(--bg) 70%,transparent)}
  .dback button{width:40px;height:40px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-size:20px;cursor:pointer;display:grid;place-items:center}
  .dbt{font-family:'Inter',system-ui,sans-serif;font-weight:600;color:var(--text)}
  .dimg{width:100%;aspect-ratio:1;border-radius:24px;object-fit:cover;border:1px solid var(--strokeSoft);box-shadow:0 18px 50px var(--shcol)}
  .dttl{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:30px;color:var(--text);margin:5px 2px 6px;letter-spacing:-.02em;line-height:1.06}
  .dkick{font-size:11.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:16px 2px 0}
  .dpricerow{display:flex;align-items:center;gap:13px;flex-wrap:wrap;margin:2px 2px 0}
  .dprice{font-family:'Inter',system-ui,sans-serif;font-weight:800;font-size:30px;color:var(--priceCol);margin:0;letter-spacing:-.02em}
  .dmat{display:inline-flex;align-items:center;padding:4px 11px;border-radius:20px;background:rgba(199,125,107,.10);border:1px solid rgba(199,125,107,.24);color:var(--accent);font-size:12.5px;font-weight:600;margin:0}
  .ddesc{margin:14px 2px 0;font-size:14px;line-height:1.55;color:var(--text);opacity:.88}
  .dlabel{font-size:12px;font-weight:700;color:var(--soft);margin:18px 2px 9px;letter-spacing:.06em;text-transform:uppercase}
  .dswatches{display:flex;gap:16px;flex-wrap:wrap}
  .dswbox{display:flex;flex-direction:column;align-items:center;gap:7px;background:none;border:0;padding:0;cursor:pointer}
  .dsw{width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 rgba(255,255,255,.5);transition:transform .12s,box-shadow .12s;display:block}
  .dswbox.on .dsw{box-shadow:0 0 0 3px var(--text);transform:scale(1.08)}
  .dswn{font-size:12px;color:var(--soft);letter-spacing:.01em}
  .dswbox.on .dswn{color:var(--text);font-weight:600}
  .dqty{gap:14px}
  .dgrid{display:grid;gap:16px;grid-template-columns:1fr;grid-template-areas:"photo" "opts" "buy";margin-top:4px}
  .dphoto{grid-area:photo;position:relative}
  .dimgup{position:absolute;right:10px;bottom:10px;width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(16px) saturate(180%);backdrop-filter:blur(16px) saturate(180%);color:var(--text);display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 5px 14px rgba(0,0,0,.2);transition:transform .12s}
  .dimgup:active{transform:scale(.9)}
  .dimgup svg{width:21px;height:21px}
  .dopts{grid-area:opts}
  .dbuy{grid-area:buy;display:flex;flex-direction:column;align-items:center}
  .dbuy .dadd2{width:100%;max-width:320px}
  .dopts .dttl{margin-top:0}
  .dbuy .dlabel.dctr{text-align:center;margin:2px 0 9px}
  .dbuy .dqty{justify-content:center}
  .seg{display:flex;gap:6px;background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:15px;padding:5px;max-width:360px;-webkit-backdrop-filter:blur(12px) saturate(160%);backdrop-filter:blur(12px) saturate(160%)}
  .seg button{flex:1;border:none;background:transparent;color:var(--soft);font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:13.5px;padding:9px 6px;border-radius:11px;cursor:pointer;transition:background .18s,color .18s,box-shadow .18s}
  .seg button.on{background:rgba(199,125,107,.14);color:var(--accent);font-weight:700;box-shadow:inset 0 0 0 1px rgba(199,125,107,.32),0 3px 9px rgba(199,125,107,.16)}
  .seg button i{font-style:normal;font-weight:600;font-size:11px;opacity:.6;margin-left:3px}
  .seg button.on i{opacity:.95;color:var(--accent)}
  .elecedit{margin-top:14px;background:none;border:none;color:var(--soft);font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:12.5px;cursor:pointer;padding:2px 0}
  .elecprices{margin-top:8px;background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:13px;padding:6px 12px}
  .epp{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;font-size:13.5px;color:var(--text);border-bottom:1px solid var(--strokeSoft)}
  .epp:last-child{border-bottom:none}
  .epp .eur{display:flex;align-items:center;gap:4px;color:var(--soft);font-weight:600}
  .epp .eur input{width:62px;text-align:right;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);border-radius:9px;padding:6px 8px;font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:14px}
  .iitem{padding:12px 0;border-bottom:1px solid var(--strokeSoft)}
  .iitem:last-child{border-bottom:none}
  .iitem .iline{display:flex;align-items:center;gap:10px;font-size:15px;color:var(--text);margin:0 0 8px}
  .iitem .iname{flex:1;font-weight:700}
  .ithumb{width:46px;height:46px;border-radius:12px;object-fit:cover;flex:none;border:1px solid var(--strokeSoft)}
  .ibd{display:flex;justify-content:space-between;font-size:13px;color:var(--soft);margin-top:4px;margin-left:56px}
  .ibd.ifin{color:var(--text);font-weight:600;margin-top:7px}
  .ibd.isub{color:var(--text);font-weight:700;font-size:14.5px;margin-top:7px}
  #invoiceSheet .cttot{font-size:18px;align-items:baseline;margin-top:8px}
  #invoiceSheet #invTot{font-size:30px;font-weight:800;color:var(--text)}
  .invav{width:46px;height:46px;border-radius:50%;object-fit:cover;flex:none;border:1px solid var(--strokeSoft);box-shadow:0 2px 8px rgba(0,0,0,.2)}
  .invtt{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:18px;color:var(--text)}
  .bnav{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none;align-self:flex-start}
  .dadd2{margin-top:12px;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:14px;border-radius:16px;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);color:var(--text);font-weight:700;font-size:15px;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 8px 22px rgba(0,0,0,.18);transition:transform .12s}
  .dadd2:active{transform:scale(.96)}
  .dadd2 svg{width:21px;height:21px;stroke:var(--text);filter:drop-shadow(0 1px 1px rgba(0,0,0,.3)) drop-shadow(0 -.7px .7px rgba(255,255,255,.5))}
  @media(min-width:560px){.dgrid{grid-template-columns:1fr 1fr;grid-template-areas:"photo opts" "buy opts";align-items:start}.dbuy{margin-top:6px}}
  .crow{display:flex;align-items:center;gap:12px;padding:10px;border-radius:16px;background:var(--glass2);border:1px solid var(--strokeSoft);margin-bottom:10px}
  .crow img{width:52px;height:52px;border-radius:12px;object-fit:cover;flex:none;border:1px solid var(--strokeSoft)}
  .crow .cinfo{flex:1;min-width:0}
  .crow .cn{font-weight:700;font-size:15px;color:var(--text)}
  .crow .cp{font-size:12px;color:var(--soft);margin-top:1px;line-height:1.3}
  .crow .cprice{font-size:12.5px;color:var(--faint);margin-top:2px}
  .qstep.csmall{gap:6px}
  .qstep.csmall button{width:30px;height:30px;border-radius:9px;font-size:17px}
  .qstep.csmall span{min-width:16px;text-align:center;font-weight:600}
  .cttot{display:flex;justify-content:space-between;align-items:center;font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:19px;color:var(--text);margin:14px 2px 12px;padding-top:14px;border-top:1px solid var(--strokeSoft)}
  #cartSheet .sheet{min-height:46vh}
  #cartSheet h4{font-size:20px}
  #cartSheet h4 .gico{width:27px;height:27px}
  #cartSheet .cn{font-size:16.5px}
  #cartSheet .cp{font-size:13.5px}
  #cartSheet .cttot{font-size:21px}
  #cartSheet .qsend{font-size:16.5px}
  .inv .invhead{display:flex;justify-content:flex-start;align-items:center;gap:11px;margin-bottom:6px}
  .invmeta{font-size:13px;color:var(--soft);display:flex;align-items:center;gap:6px}
  .invitems{margin:6px 0 2px}
  .iline{display:flex;justify-content:space-between;font-size:15px;color:var(--text);margin-top:12px}
  .iline .ix{color:var(--soft);font-size:13px}

  /* ORDINI */
  .banner{border-radius:20px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .banner .txt{flex:1;min-width:140px;font-size:14px}
  .btnY{border:none;border-radius:12px;padding:9px 14px;font-weight:600;font-size:13px;cursor:pointer;background:#2e7d4f;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}
  .btnN{border:1px solid var(--strokeSoft);border-radius:12px;padding:9px 12px;font-weight:600;font-size:13px;cursor:pointer;background:transparent;color:var(--text)}
  .osec{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:var(--soft);margin:4px 4px 12px}
  .ord{display:flex;gap:12px;align-items:center;border-radius:20px;padding:10px;margin-bottom:10px}
  .ord img{width:56px;height:56px;border-radius:14px;object-fit:cover}
  .ord .t{font-weight:600} .ord .s{font-size:12.5px;color:var(--soft)}
  .badge{font-size:11px;font-weight:700;padding:4px 9px;border-radius:20px;white-space:nowrap}
  .bp{background:rgba(210,150,40,.18);color:#b07c1e} .bc{background:rgba(46,125,79,.18);color:#2e7d4f}
  body.dark .bp{color:#e3b261} body.dark .bc{color:#7fc79b}

  /* PROFILO */
  .pcard{border-radius:26px;padding:22px;display:flex;align-items:center;gap:16px;margin-bottom:14px}
  .pcard .pav{width:68px;height:68px;border-radius:50%;border:2px solid rgba(217,194,163,.7)}
  .pcard .nm{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:24px}
  .pcard .em{font-size:13.5px;color:var(--soft)}
  .stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
  .stat{border-radius:20px;padding:16px} .stat .n{font-family:'Inter',system-ui,sans-serif;font-size:28px;font-weight:600} .stat .l{font-size:13px;color:var(--soft)}
  .logout{width:100%;border-radius:16px;padding:14px;border:1px solid var(--strokeSoft);background:transparent;color:var(--heart);font-weight:600;font-size:15px;cursor:pointer}

  .note{text-align:center;color:var(--faint);font-size:12.5px;margin:26px 0 0}
  .screen{display:none} .screen.on{display:block;animation:scrIn .3s cubic-bezier(.22,1,.36,1) both}
  @keyframes scrIn{from{opacity:0}to{opacity:1}}
  @keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes itemIn{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}
  .grid .card{opacity:0}
  .card.in,.cat.in,.ord.in,.banner.in{animation:itemIn .5s cubic-bezier(.2,.8,.25,1) both}
  svg{display:block}
  #toast{position:fixed;left:50%;transform:translateX(-50%);bottom:120px;z-index:95;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
  .tt{padding:11px 18px;border-radius:30px;font-size:13.5px;color:#fff;background:rgba(20,18,16,.82);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);animation:fu .35s both;box-shadow:0 8px 24px rgba(0,0,0,.3)}
  @media (prefers-reduced-motion: reduce){.blob{animation:none}.px{transform:none!important}.screen.on,.card.in,.cat.in,.ord.in,.banner.in{animation:none!important}.grid .card{opacity:1}.ipick,.ipick .sheet,.welcome,.wcard{transition:none}}

/* ---- supplemento React (login, hero, admin, stati vuoti) ---- */
.boot{min-height:100vh;display:grid;place-items:center;color:var(--soft);font-weight:600}
.wrap{max-width:680px;margin:0 auto;padding:62px 0 132px;min-height:100vh;min-height:100dvh}
.wrap .grid{padding:0 18px}
.grid{grid-template-columns:repeat(2,1fr);gap:12px}
.grid .card{opacity:1}
.px{padding-left:18px;padding-right:18px}
.kick{font-size:13px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin:10px 0 2px}
.hero{font-size:40px;line-height:1.04;font-weight:800;color:var(--text);margin:0 0 18px}
/* Hero text area: tono identitario viene dal kick terracotta e dallo sfondo Strato — no overlay aggiuntivo */
.herocard{position:relative;margin:0 18px 18px;border-radius:26px;overflow:hidden;box-shadow:var(--elev3);cursor:pointer;aspect-ratio:16/11}
.herocard img{width:100%;height:100%;object-fit:cover;display:block}
.herotag{position:absolute;left:14px;bottom:14px;background:rgba(244,236,224,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(199,125,107,.22);border-radius:15px;padding:9px 13px}
body.dark .herotag{background:rgba(51,39,35,.84);border-color:rgba(199,125,107,.28)}
.herotag .ht{font-weight:700;color:var(--text)}
.herotag .hp{font-size:13px;color:var(--soft)}
.searchbox{width:calc(100% - 36px);margin:0 18px 16px;padding:13px 16px;border-radius:15px;border:1px solid rgba(199,125,107,.22);background:rgba(244,236,222,.55);color:var(--text);font-family:inherit;font-size:15px;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
body.dark .searchbox{background:rgba(199,125,107,.09);border-color:rgba(199,125,107,.24)}
.empty{color:var(--faint);font-size:14px;padding:6px 18px}
/* ---- PIACIUTI: empty state editoriale ---- */
.liked-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:54vh;padding:0 36px;text-align:center;animation:likedEmptyIn .3s cubic-bezier(.22,1,.36,1) both}
@keyframes likedEmptyIn{from{opacity:0;filter:blur(4px);transform:translateY(8px)}to{opacity:1;filter:blur(0);transform:none}}
.liked-empty-mark{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:rgba(199,125,107,.12);border:1.5px solid rgba(199,125,107,.22);margin:0 auto 32px;box-shadow:0 4px 18px rgba(199,125,107,.14)}
.liked-empty-mark svg{width:24px;height:24px;stroke:#C77D6B;fill:rgba(199,125,107,.18)}
.liked-empty-title{font-family:'Inter',system-ui,sans-serif;font-size:28px;font-weight:800;letter-spacing:-.6px;line-height:1.1;color:var(--text);margin:0 0 18px}
.liked-empty-sub{font-family:'Inter',system-ui,sans-serif;font-size:15px;font-weight:400;line-height:1.6;color:var(--soft);margin:0;letter-spacing:.01em}
/* ---- PWA INSTALL MODAL ---- */
.pwa-overlay{position:fixed;inset:0;z-index:300;background:rgba(45,36,32,.48);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;animation:pwaFade .3s cubic-bezier(.22,1,.36,1) both}
@keyframes pwaFade{from{opacity:0}to{opacity:1}}
.pwa-sheet{width:100%;max-width:500px;background:var(--sheetbg);border-radius:32px 32px 0 0;padding:24px 24px calc(28px + env(safe-area-inset-bottom));animation:pwaUp .32s cubic-bezier(.22,1,.36,1) both;box-shadow:0 -6px 48px rgba(45,36,32,.24);border-top:1px solid rgba(199,125,107,.14)}
@keyframes pwaUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
.pwa-pill{width:36px;height:4px;border-radius:2px;background:rgba(199,125,107,.22);margin:0 auto 22px}
.pwa-icon{width:68px;height:68px;border-radius:18px;display:block;margin:0 auto 18px;box-shadow:0 8px 24px rgba(45,36,32,.20)}
.pwa-title{font-family:'Inter',system-ui,sans-serif;font-size:21px;font-weight:800;text-align:center;color:var(--text);letter-spacing:-.45px;line-height:1.2;margin:0 0 8px}
.pwa-sub{font-size:14px;text-align:center;color:var(--soft);line-height:1.58;margin:0 0 18px;padding:0 4px}
.pwa-benefits{list-style:none;padding:12px 14px;margin:0 0 20px;display:flex;flex-direction:column;gap:10px;background:rgba(217,194,163,.22);border-radius:18px;border:1px solid rgba(199,125,107,.12)}
.pwa-benefit{display:flex;align-items:center;gap:11px;font-size:13.5px;color:var(--soft)}
.pwa-bico{width:26px;height:26px;border-radius:50%;background:rgba(199,125,107,.14);display:grid;place-items:center;flex:none;border:1px solid rgba(199,125,107,.18)}
.pwa-bico svg{width:13px;height:13px;stroke:var(--accent);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pwa-btn-p{width:100%;padding:15px;border-radius:16px;border:none;background:linear-gradient(135deg,#C77D6B,#A65435);color:#fff;font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 6px 20px rgba(166,84,53,.30);transition:transform .18s cubic-bezier(.22,1,.36,1),box-shadow .18s;letter-spacing:-.1px}
.pwa-btn-p:active{transform:scale(.97);box-shadow:0 3px 10px rgba(166,84,53,.18)}
.pwa-btn-later{width:100%;padding:12px;border:none;background:transparent;color:var(--soft);font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:15px;cursor:pointer;margin-top:6px}
.pwa-steps{display:flex;flex-direction:column;gap:14px;margin:0 0 20px}
.pwa-step{display:flex;align-items:flex-start;gap:13px}
.pwa-snum{width:26px;height:26px;border-radius:50%;background:rgba(199,125,107,.14);border:1.5px solid rgba(199,125,107,.28);display:grid;place-items:center;flex:none;font-size:12px;font-weight:700;color:var(--accent)}
.pwa-stxt{padding-top:3px;font-size:14px;color:var(--soft);line-height:1.5}
.pwa-stxt strong{color:var(--text);font-weight:600}
.pwa-share-ico{display:inline-block;vertical-align:middle;margin:0 2px;width:16px;height:16px;stroke:var(--accent);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
/* Profile App row */
.pwa-prow{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;margin:0 18px;border-radius:16px;background:var(--glass2);border:1px solid var(--strokeSoft);cursor:pointer;transition:opacity .15s}
.pwa-prow.installed{cursor:default;opacity:.8}
.pwa-prowl{display:flex;align-items:center;gap:12px}
.pwa-prow-ico{width:40px;height:40px;border-radius:11px;box-shadow:0 3px 10px rgba(45,36,32,.16)}
.pwa-prowt{font-weight:700;font-size:15px;color:var(--text)}
.pwa-prows{font-size:12.5px;color:var(--soft);margin-top:2px}
.pwa-prow-check svg{width:20px;height:20px;stroke:var(--accent);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.pwa-prow-arr{opacity:.35;display:flex}
.push-prow{margin-top:10px}
.push-prow.busy{pointer-events:none;opacity:.72}
.push-prow.disabled{cursor:not-allowed;opacity:.58}
.push-prow-ico{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:none;color:var(--accent);background:rgba(199,125,107,.12);border:1px solid rgba(199,125,107,.18);box-shadow:inset 0 1px 0 var(--hi)}
.push-prow-ico svg{width:21px;height:21px}
.pwa-prow:focus-visible{outline:none;box-shadow:0 0 0 2px rgba(199,125,107,.28), inset 0 1px 0 var(--hi)}
.catgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:0 18px}
.cat{display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 12px 18px;border-radius:22px;text-align:center;cursor:pointer;background:rgba(217,194,163,.30);border:1px solid rgba(199,125,107,.16);box-shadow:0 2px 8px rgba(140,90,55,.08),inset 0 1px 0 rgba(255,243,228,.5)}
body.dark .cat{background:rgba(199,125,107,.09);border-color:rgba(199,125,107,.20);box-shadow:0 2px 8px rgba(0,0,0,.2),inset 0 1px 0 rgba(199,125,107,.08)}
.cat .ci{display:grid;place-items:center}
.cat .ci .gico{width:54px;height:54px}
.cat .catn{font-weight:700;font-size:18px;color:var(--text)}
.heartred svg{stroke:#F0231A;fill:rgba(240,35,26,.18)}
.cempty{text-align:center;color:var(--soft);padding:42px 0 16px;font-size:19px;font-weight:600}
.osec{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:var(--accent);margin:4px 20px 12px}
.qsend{display:flex;align-items:center;justify-content:center;gap:9px;width:calc(100% - 36px);margin:8px 18px 0;padding:15px;border-radius:17px;border:none;background:linear-gradient(135deg,var(--b3,#e0a890),#c2715f);color:#fff;font-family:inherit;font-weight:700;font-size:15.5px;cursor:pointer;box-shadow:0 2px 6px rgba(120,60,40,.16), 0 14px 32px rgba(120,60,40,.24)}
.qsend:disabled{opacity:.6}
.invtot{font-size:30px;font-weight:800;color:var(--text)}
.invtotrow{align-items:baseline}
/* profilo */
.pcard{display:flex;align-items:center;gap:14px;margin:0 18px;padding:16px;border-radius:20px;background:rgba(217,194,163,.32);border:1px solid rgba(199,125,107,.18);box-shadow:0 4px 16px rgba(140,90,55,.10)}
body.dark .pcard{background:rgba(90,64,48,.28);border-color:rgba(199,125,107,.22)}
.pav{width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid var(--strokeSoft)}
.pname{font-weight:700;font-size:18px;color:var(--text)}
.prole{font-size:13px;color:var(--soft)}
.psec{font-weight:700;font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:var(--soft);margin:18px 20px 10px}
.throw{display:flex;gap:8px;padding:0 18px}
.thopt{flex:1;padding:12px;border-radius:14px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-family:inherit;font-weight:600;cursor:pointer}
.thopt.on{background:var(--glassDock);color:var(--accent);box-shadow:inset 0 1px 0 var(--hi),0 0 0 1.5px var(--accent)}
.logout{display:flex;align-items:center;justify-content:center;gap:8px;width:calc(100% - 36px);margin:22px 18px 0;padding:13px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-family:inherit;font-weight:600;cursor:pointer}
/* login */
.loginwrap{min-height:100vh;display:grid;place-items:center;padding:22px}
.loginbox{padding:34px 28px;border-radius:26px;text-align:center;max-width:360px;width:100%;background:var(--glassDock);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi),0 24px 60px rgba(0,0,0,.32)}
.loginbox.glass{-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%)}
.brand2.big{font-size:30px;justify-content:center}
.brand2.big .mk{width:40px;height:40px}
.lsub{color:var(--soft);margin:6px 0 22px}
.gbtn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 6px 16px rgba(0,0,0,.12)}
/* admin */
.sheet.admin{max-height:88vh;overflow-y:auto}
.afield{display:flex;flex-direction:column;gap:5px;margin:10px 0}
.afield label{font-size:12.5px;font-weight:600;color:var(--soft)}
.afield input,.afield select,.afield textarea{padding:11px 12px;border-radius:12px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-family:inherit;font-size:14.5px}
.afrow{display:flex;gap:10px}
.afrow .afield{flex:1}
.afrow3{display:flex;gap:8px}
.afrow3 .afield{flex:1}
.afrow3 input{width:100%}
.achk{display:flex;align-items:center;gap:9px;margin:8px 0;font-size:14px;color:var(--text);cursor:pointer}
.colrow{display:flex;gap:11px;align-items:center;background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:15px;padding:10px;margin-bottom:9px}
.colthumb{width:50px;height:50px;border-radius:11px;object-fit:cover;flex:none;border:1px solid var(--strokeSoft)}
.colfields{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
.colfields input[type=text],.colfields>input{padding:8px 10px;border-radius:10px;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);font-family:inherit}
.colpicks{display:flex;align-items:center;gap:8px}
.colpicks input[type=color]{width:34px;height:34px;border:none;border-radius:9px;background:none;cursor:pointer}
.upbtn{width:36px;height:36px;border-radius:10px;border:1px solid var(--strokeSoft);background:var(--glassDock);display:grid;place-items:center;cursor:pointer;color:var(--text)}
.coldel{width:36px;height:36px;border-radius:10px;border:1px solid var(--strokeSoft);background:var(--glass2);color:#c0392b;display:grid;place-items:center;cursor:pointer;margin-left:auto}
.addcolor{display:flex;align-items:center;gap:7px;background:none;border:1px dashed var(--strokeSoft);border-radius:12px;padding:10px 14px;color:var(--soft);font-family:inherit;font-weight:600;cursor:pointer;margin:2px 0 12px}
.adminProductView{padding-bottom:calc(90px + env(safe-area-inset-bottom, 0px))}
.adminProductCard{margin:0 14px;padding:18px;border-radius:30px;overflow:visible}
.adminProductHead{margin-bottom:12px}
.adminProductTitle{display:flex;align-items:center;gap:10px;margin:4px 0 12px;color:var(--text);font-size:28px;line-height:1.05;letter-spacing:-.62px}
.adminProductTitle svg{width:22px;height:22px;color:var(--accent)}
.adminProductCard .qsend,.adminProductCard .delbtn{width:100%;margin:12px 0 0}
.adminProductCard .addcolor{width:100%;justify-content:center;margin:4px 0 12px}
.saveaddons{margin-top:8px;background:var(--glassDock);border:1px solid var(--strokeSoft);border-radius:11px;padding:9px 14px;color:var(--text);font-family:inherit;font-weight:600;cursor:pointer}
.elecedit{margin-top:14px;background:none;border:none;color:var(--soft);font-family:inherit;font-weight:600;font-size:12.5px;cursor:pointer;padding:2px 0}
.card{opacity:1}
.orddot{position:absolute;top:8px;right:8px;width:8px;height:8px;border-radius:50%;background:#e0584a}

/* ---- fix porting ---- */
.dnav.home.act svg{stroke:url(#g_home)}
.dnav.search.act svg{stroke:url(#g_search)}
.dnav.cats.act svg{stroke:url(#g_cats)}
.dnav.like.act svg{stroke:url(#g_heartT)}
.dnav.orders.act svg{stroke:url(#g_orders)}
.dnav.act svg{fill:none}
.sheet h4 svg{width:26px;height:26px;flex:none}
.dbacklbl{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:18px;color:var(--text)}
.dedit{margin-left:auto;width:40px;height:40px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}
.dedit svg{width:18px;height:18px}
.cedit{position:absolute;top:10px;left:10px;width:34px;height:34px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);display:grid;place-items:center;color:var(--text);cursor:pointer;z-index:3}
.cedit svg{width:16px;height:16px}
.cedit.hero{top:14px;left:14px;width:38px;height:38px}
.brand2 .mk svg{width:18px;height:18px}

/* ---- title icon sizing ---- */
.title .ticon{display:grid;place-items:center}
.title .ticon svg{width:26px;height:26px;display:block;stroke:var(--text);fill:none}
.title .ticon.heartred svg{stroke:#F0231A;fill:rgba(240,35,26,.16)}
.title .ticon.heartred svg,.heartred svg{width:26px;height:26px}
/* ---- safe-area / full screen ---- */
.topbar{padding-top:calc(10px + env(safe-area-inset-top));padding-left:calc(14px + env(safe-area-inset-left));padding-right:calc(14px + env(safe-area-inset-right))}
.wrap{padding-top:calc(62px + env(safe-area-inset-top))}
  .sheet{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.dockwrap{bottom:calc(8px + env(safe-area-inset-bottom))}
#toast{bottom:calc(120px + env(safe-area-inset-bottom))}
.sheet{padding-bottom:calc(18px + env(safe-area-inset-bottom))}

/* ---- card: tile piu' compatta, testo piu' leggibile ---- */
.card{min-width:0}
.card .ph{aspect-ratio:1.1}
.cbody{padding:10px 11px 11px;display:flex;flex-direction:column;gap:6px;min-width:0}
.cbody .cardcat{display:flex;align-items:center;gap:5px;margin-bottom:4px;font-size:11.5px;font-weight:600;color:var(--soft);min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cbody .cardcat .gico{width:14px;height:14px;flex:none}
.cbody .row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.cbody .ct{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:15px;color:var(--text);line-height:1.15;min-width:0}
.cbody .cp{font-weight:700;font-size:15px;white-space:nowrap;color:var(--text)}
.cbody .mat{font-size:11.5px;color:var(--soft)}
.cbody .addcart{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:9px;border-radius:13px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-weight:600;font-size:12.5px;cursor:pointer}
.cbody .addcart svg{width:18px;height:18px;display:block}
.cbody .addcart .gico{width:16px;height:16px}

/* ---- sezione colore dettaglio ---- */
.dlabel.dcolor{font-size:13.2px;margin-bottom:16px}
.dswatches{gap:18px}
.dsw{width:46px;height:46px;border:2.5px solid rgba(255,255,255,.92);box-shadow:0 0 0 1px rgba(0,0,0,.28),0 2px 7px rgba(0,0,0,.3),inset 0 1px 3px rgba(255,255,255,.55)}
.dswbox.on .dsw{border-color:#fff;box-shadow:0 0 0 2px #fff,0 0 0 4.5px var(--text),0 0 14px 3px rgba(255,255,255,.6),inset 0 1px 3px rgba(255,255,255,.55);transform:scale(1.12)}
body.dark .dsw{border-color:rgba(255,255,255,.85);box-shadow:0 0 0 1px rgba(0,0,0,.5),0 2px 7px rgba(0,0,0,.45),inset 0 1px 3px rgba(255,255,255,.4)}
body.dark .dswbox.on .dsw{border-color:#fff;box-shadow:0 0 0 2px #1a1714,0 0 0 4.5px #fff,0 0 16px 4px rgba(255,255,255,.5),inset 0 1px 3px rgba(255,255,255,.4)}

/* ---- pulsante cambia foto (admin) sul dettaglio ---- */
.dphoto{position:relative}
.dphotobtn{position:absolute;right:12px;bottom:12px;width:44px;height:44px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);display:grid;place-items:center;color:var(--text);cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.25);z-index:3}

/* ---- topbar: back + carrello accanto al profilo ---- */
.topbar{pointer-events:none}
.topbar button,.topbar .tb-right{pointer-events:auto}
.tb-back{width:40px;height:40px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);display:grid;place-items:center;color:var(--text);cursor:pointer;box-shadow:inset 0 1px 0 var(--hi), var(--elev1)}
.tb-back svg{width:22px;height:22px;stroke:var(--text)}
.tb-btn.cart{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 var(--hi), var(--elev1)}
.tb-btn.cart svg{width:23px;height:23px;stroke:var(--text);fill:none}
.tb-btn.cart .cbadge{display:none!important}
.tb-right{gap:10px}

/* ---- parallasse leggera su scroll (solo immagine hero) ---- */
.herocard img{transform:scale(1.08);transition:none}

/* ---- topbar: frosted glass trasparente e corto allo scroll ----
   Non colora la status bar: sfoca soltanto ciò che passa sotto. */
.topscrim{position:fixed;top:0;left:0;right:0;height:calc(72px + env(safe-area-inset-top,0px));z-index:49;pointer-events:none;background:rgba(128,128,128,.001);-webkit-backdrop-filter:blur(15px) saturate(128%);backdrop-filter:blur(15px) saturate(128%);-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 56%,rgba(0,0,0,.58) 78%,transparent 100%);mask-image:linear-gradient(180deg,#000 0%,#000 56%,rgba(0,0,0,.58) 78%,transparent 100%);opacity:min(.96,calc(var(--par,0) / 84));transition:opacity .14s linear}

/* ---- animazione apertura carrello dal basso ---- */
.ipick.on .sheet{animation:sheetUp .4s cubic-bezier(.2,.85,.25,1) both}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.ipick.on{animation:scrimIn .32s ease both}
@keyframes scrimIn{from{background:rgba(0,0,0,0)}to{background:rgba(0,0,0,.4)}}

/* ---- ordini: margine laterale (~3mm) ---- */
.banner{margin-left:12px;margin-right:12px}
.ord{margin-left:12px;margin-right:12px}
.osec{margin-left:14px;margin-right:14px}

/* ---- titolo con azione (es. + categorie) ---- */
.titlerow{display:flex;align-items:center;justify-content:space-between;gap:12px}
.titlerow .title{margin:10px 0 16px}
.tb-back.addnew{flex:none}

/* ---- pencil di modifica sulle tile categoria ---- */
.catedit2{left:auto;right:8px;top:8px}

/* ---- icon picker categorie ---- */
.iggroup{font-size:11.5px;font-weight:700;color:var(--soft);text-transform:uppercase;letter-spacing:.08em;margin:18px 2px 9px;opacity:.7}
.ig{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
/* Tile icona: stato default */
.ib{aspect-ratio:1;border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:14px;display:grid;place-items:center;cursor:pointer;color:var(--text);transition:background .2s,box-shadow .2s,transform .15s}
.ib:active{transform:scale(.93)}
/* Selected: bordo terracotta caldo, niente nero */
.ib.on{background:var(--card);border-color:rgba(199,125,107,.45);box-shadow:inset 0 1px 0 var(--hi),0 0 0 1.5px rgba(199,125,107,.38),0 4px 12px var(--shcol)}
body.dark .ib.on{border-color:rgba(209,124,86,.50);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 0 1.5px rgba(209,124,86,.40)}
/* Focus: ring a contrasto separato dallo stile selected */
.ib:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}

/* ---- pulsante elimina ---- */
.delbtn{width:calc(100% - 36px);display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 18px 0;padding:13px;border-radius:15px;border:1px solid rgba(192,57,43,.4);background:rgba(192,57,43,.1);color:#c0392b;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer}
.delbtn svg{width:18px;height:18px}

/* ---- feedback "press" su tutti i pulsanti ---- */
button{transition:transform .14s cubic-bezier(.22,.7,.28,1.5)}
button:active{transform:scale(.93)}
.card,.cat,.herocard{transition:transform .16s cubic-bezier(.22,.7,.28,1.4);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.card:active,.cat:active,.herocard:active{transform:scale(.94)}

/* ---- nascondi scrollbar (scroll resta attivo) ---- */
*{scrollbar-width:none;-ms-overflow-style:none}
*::-webkit-scrollbar{width:0;height:0;display:none}

/* ---- chiusura carrello (slide-down + fade scrim) ---- */
.ipick.on.closing .sheet{animation:sheetDown .34s cubic-bezier(.4,0,.7,.4) both}
.ipick.on.closing{animation:scrimOut .34s ease both}
@keyframes sheetDown{from{transform:translateY(0)}to{transform:translateY(100%)}}
@keyframes scrimOut{from{background:rgba(0,0,0,.4)}to{background:rgba(0,0,0,0)}}

/* ---- foglio dall'ALTO (notifiche): identico al carrello ma scende dall'alto ---- */
.ipick.top{align-items:flex-start}
.ipick.top .sheet{border-radius:28px;box-shadow:0 8px 36px rgba(43,33,27,.30),0 2px 6px rgba(43,33,27,.14);transform:translateY(-100%);padding:16px 18px 20px}
.ipick.top.on .sheet{transform:translateY(0);animation:sheetTopIn .4s cubic-bezier(.2,.85,.25,1) both}
.ipick.top.on.closing .sheet{animation:sheetTopOut .34s cubic-bezier(.4,0,.7,.4) both}
@keyframes sheetTopIn{from{transform:translateY(-100%)}to{transform:translateY(0)}}
@keyframes sheetTopOut{from{transform:translateY(0)}to{transform:translateY(-100%)}}
.ipick.top .sheetclose{margin:14px auto 0}

/* ---- wrapper foglio: porta l'animazione di slide; il pulsante di chiusura
   sta FUORI dal foglio (sopra per carrello/dettaglio, sotto per notifiche) ---- */
.ipick .sheetwrap{width:100%;max-width:520px;display:flex;flex-direction:column;align-items:center;transform:translateY(100%);transition:transform .36s cubic-bezier(.2,.8,.2,1)}
.ipick.on .sheetwrap{transform:translateY(0);animation:sheetUp .4s cubic-bezier(.2,.85,.25,1) both}
.ipick.on.closing .sheetwrap{animation:sheetDown .34s cubic-bezier(.4,0,.7,.4) both}
/* il foglio dentro al wrapper non slitta da solo (slitta il wrapper) */
.sheetwrap .sheet{transform:none!important;animation:none!important;max-width:100%}
/* pulsante chiusura sopra al foglio (carrello/dettaglio) */
.sheetwrap>.sheetclose{margin:0 0 12px}
/* variante dall'alto: wrapper scende dall'alto e il pulsante sta SOTTO il foglio */
.ipick.top .sheetwrap{transform:translateY(-100%)}
.ipick.top.on .sheetwrap{transform:translateY(0);animation:sheetTopIn .4s cubic-bezier(.2,.85,.25,1) both}
.ipick.top.on.closing .sheetwrap{animation:sheetTopOut .34s cubic-bezier(.4,0,.7,.4) both}
.ipick.top .sheetwrap>.sheetclose{margin:12px 0 0}

/* ---- modale conferma ordine (centrata, vetro frostato, auto-dismiss) ---- */
.odone{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.34);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);animation:odIn .3s ease both}
.odone.out{animation:odOut .4s ease both}
.odcard{width:100%;max-width:340px;text-align:center;padding:32px 28px;border-radius:28px;background:var(--glassDock);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi),0 26px 64px rgba(0,0,0,.42);animation:odCard .44s cubic-bezier(.2,.85,.25,1) both}
.odone.out .odcard{animation:odCardOut .4s ease both}
.odicon{width:66px;height:66px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;background:rgba(199,125,107,.16);color:var(--accent);box-shadow:inset 0 1px 0 var(--hi)}
.odicon svg{width:32px;height:32px;stroke:var(--accent)}
.odt{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:22px;color:var(--text);margin-bottom:9px}
.ods{font-size:13.5px;color:var(--soft);line-height:1.5}
.authcard .authgbtn{margin-top:20px}
.authlater{margin-top:10px;width:100%;padding:11px;border:none;background:transparent;color:var(--soft);font-family:inherit;font-weight:600;font-size:13.5px;cursor:pointer;border-radius:12px}
.authlater:active{transform:scale(.97)}
@keyframes odIn{from{opacity:0}to{opacity:1}}
@keyframes odOut{from{opacity:1}to{opacity:0}}
@keyframes odCard{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes odCardOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.96)}}

/* ---- carosello rimosso: la home usa una singola tile .herocard ---- */

/* ---- transizione apertura/chiusura dettaglio ---- */

/* ---- galleria foto (fino a 5 per colore) ---- */
.dgallery{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;border-radius:24px;-webkit-overflow-scrolling:touch}
.dgallery .dimg{flex:0 0 100%;scroll-snap-align:center;width:100%;aspect-ratio:1;object-fit:cover;display:block;border-radius:24px}
.gdots{display:flex;justify-content:center;gap:6px;margin-top:9px}
.gdot{width:6px;height:6px;border-radius:50%;background:var(--faint)}

/* ---- editor: righe colore con 5 foto ---- */
.colrow2{background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:15px;padding:11px;margin-bottom:10px}
.colhead{display:flex;align-items:center;gap:8px}
.colname{flex:1;min-width:0;padding:8px 10px;border-radius:10px;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);font-family:inherit;font-size:14px}
.colhead input[type=color]{width:34px;height:34px;border:none;border-radius:9px;background:none;cursor:pointer;flex:none}
.colphotos{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.colph{position:relative;width:60px;height:60px;border-radius:11px;overflow:hidden;border:1px solid var(--strokeSoft)}
.colph img{width:100%;height:100%;object-fit:cover;display:block}
.colphdel{position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:none;background:rgba(0,0,0,.6);color:#fff;font-size:15px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}
.colphmain{position:absolute;bottom:0;left:0;right:0;font-size:8.5px;font-weight:600;text-align:center;background:rgba(0,0,0,.55);color:#fff;padding:1px 0}
.coladd{width:60px;height:60px;border-radius:11px;border:1.5px dashed var(--strokeSoft);display:grid;place-items:center;cursor:pointer;color:var(--soft);background:var(--glassDock)}
.colhint{font-size:11px;color:var(--faint);margin-top:7px}

/* ---- dettaglio come popup a foglio (stile carrello) ---- */
:root{--sheetbg:#f6f1ea}
body.dark{--sheetbg:#1f1b17}
:root{--detailGlass:linear-gradient(180deg,rgba(249,242,234,.82),rgba(244,233,222,.80));--detailBorder:rgba(199,125,107,.20);--priceCol:#8F4E37}
body.dark{--detailGlass:linear-gradient(180deg,rgba(40,32,26,.84),rgba(30,24,20,.84));--detailBorder:rgba(209,124,86,.22);--priceCol:#E6A079}
.sheet.detailsheet{position:relative;background:var(--detailGlass);-webkit-backdrop-filter:blur(26px) saturate(185%);backdrop-filter:blur(26px) saturate(185%);max-height:calc(100vh - 96px - env(safe-area-inset-top));max-height:calc(100dvh - 96px - env(safe-area-inset-top));padding-top:14px;border:1px solid var(--detailBorder);box-shadow:inset 0 1px 0 var(--hi),0 -14px 44px rgba(0,0,0,.34)}
.detailsheet .detailedit{position:absolute;top:12px;right:16px;margin:0;z-index:4}
.detailsheet .dgrid{margin-top:6px}

/* ================= DESIGN SYSTEM — premium warm (light/dark auto) ============= */
:root{
  --text:#2D2621; --soft:#6E6257; --faint:rgba(110,98,87,.55);
  --glass:rgba(252,247,240,.46); --glass2:rgba(250,242,233,.62);
  --strokeSoft:rgba(199,125,107,.14); --hi:rgba(255,255,255,.5); --glassDock:rgba(246,236,225,.74);
  --bg:#F4EFE8; --bg2:#EFE7DD;
  --accent:#C77D6B; --accent2:#A65435; --accentDark:#8B4A32;
  --icon:#9A7D6A; --heart:#C2553F; --success:#6E8B69; --warning:#C89C5B;
  --txtShadow:rgba(70,45,30,.14); --shcol:rgba(120,80,55,.12); --shblur:42px; --shy:12px;
  --elev1:0 1px 2px rgba(74,45,28,.20), 0 3px 10px rgba(74,45,28,.24);
  --elev2:0 2px 6px rgba(74,45,28,.18), 0 10px 24px rgba(74,45,28,.30);
  --elev3:0 5px 14px rgba(74,45,28,.18), 0 20px 44px rgba(74,45,28,.34);
  --card:rgba(244,236,222,.62); --sheetbg:#F3EDE4;
  --scrim:rgba(247,242,235,.9); --scrim2:rgba(247,242,235,.5);
  --app-bg-solid:#eadccf;
  --app-bg-gradient:
    radial-gradient(circle at 18% 8%, rgba(188,139,103,.16), transparent 34%),
    radial-gradient(circle at 88% 18%, rgba(151,134,105,.12), transparent 32%),
    linear-gradient(180deg,#f3eadf 0%,#eadccf 48%,#dfcfbf 100%);
  --sheet-scrim:rgba(43,33,27,.64);
}
body.dark{
  --text:#F2E5D5; --soft:#B9A897; --faint:rgba(185,168,151,.5);
  --glass:rgba(214,184,155,.06); --glass2:rgba(214,184,155,.10);
  --strokeSoft:rgba(209,124,86,.16); --hi:rgba(255,255,255,.1); --glassDock:rgba(45,36,32,.78);
  --bg:#2D2420; --bg2:#3B2B25;
  --accent:#CC7E5E; --accent2:#B7795E; --accentDark:#A65435;
  --icon:#9A8472; --heart:#DD8468; --success:#7A9774; --warning:#D1A366;
  --txtShadow:rgba(0,0,0,.5); --shcol:rgba(0,0,0,.5);
  --elev1:0 1px 2px rgba(0,0,0,.34), 0 6px 16px rgba(0,0,0,.42);
  --elev2:0 2px 8px rgba(0,0,0,.34), 0 16px 36px rgba(0,0,0,.46);
  --elev3:0 4px 12px rgba(0,0,0,.34), 0 28px 60px rgba(0,0,0,.52);
  --card:rgba(51,39,35,.54); --sheetbg:#3B2B25;
  --scrim:rgba(45,36,32,.9); --scrim2:rgba(45,36,32,.5);
  --app-bg-solid:#312720;
  --app-bg-gradient:
    radial-gradient(circle at 18% 8%, rgba(154,101,72,.18), transparent 34%),
    radial-gradient(circle at 86% 16%, rgba(119,103,82,.14), transparent 34%),
    linear-gradient(180deg,#241b18 0%,#1d1716 52%,#171211 100%);
  --sheet-scrim:rgba(17,13,12,.74);
}

/* ======================= SFONDO — canvas unico Strato ==================
   Il canvas non deve avere un punto in cui “finisce” e ricomincia.
   Il colore base vive su html/body; il gradiente atmosferico è un solo layer fixed
   viewport-sized. #root e le viste restano trasparenti: nessun blocco di pagina può
   scorrere sopra un background diverso. */
html,
body{
  min-height:100%;
  background-color:var(--app-bg-solid)!important;
  background-image:none!important;
}
body{
  overflow-x:hidden;
}
#root{
  position:relative;
  z-index:1;
  min-height:100%;
  background:transparent!important;
}
#appbg{
  position:fixed;
  inset:0;
  width:100vw;
  height:100vh;
  min-height:100vh;
  z-index:0;
  pointer-events:none;
  background-color:var(--app-bg-solid);
  background-image:var(--app-bg-gradient);
  background-size:100vw 100vh;
  background-position:center center;
  background-repeat:no-repeat;
  transform:translateZ(0);
  will-change:auto;
}
@supports (height:100dvh){
  #appbg{height:100dvh;min-height:100dvh;background-size:100vw 100dvh}
}
@supports (height:100lvh){
  #appbg{height:100lvh;min-height:100lvh;background-size:100vw 100lvh}
}
.wrap,
.screen,
.appview{
  background:transparent!important;
}

/* ---- vetro: frosted ceramic — Earth Tone ---- */
.glass{background:rgba(239,231,221,.38);-webkit-backdrop-filter:blur(26px) saturate(125%);backdrop-filter:blur(26px) saturate(125%);border:1px solid rgba(199,125,107,.12)}
body.dark .glass{background:rgba(199,125,107,.07);border-color:rgba(199,125,107,.16)}

/* ---- icone monocromatiche (famiglia terracotta) ---- */
.gico{stroke:var(--accent);fill:rgba(199,125,107,.10)}
body.dark .gico{fill:rgba(209,124,86,.12)}
.dock .dnav svg{stroke:var(--icon)!important;fill:none}
.dock .dnav.act svg{stroke:var(--accent)!important}
.heart.liked svg{stroke:var(--heart)!important;fill:rgba(199,125,107,.16)!important}
body.dark .heart.liked svg{fill:rgba(209,124,86,.18)!important}
.title .ticon.heartred svg,.heartred svg{stroke:var(--heart)!important;fill:rgba(199,125,107,.14)!important}

/* ---- micro-interazioni: morbide, senza rimbalzo ---- */
button{transition:transform .22s cubic-bezier(.4,0,.2,1),opacity .22s ease,background .22s ease}
button:active{transform:scale(.97)}
.card,.cat,.herocard{transition:transform .24s cubic-bezier(.4,0,.2,1)}
.card:active,.cat:active,.herocard:active{transform:scale(.985)}

/* ---- dock sempre ancorata al bordo visibile (no jitter con barra Safari) ---- */
.dockwrap{position:fixed;bottom:calc(8px + env(safe-area-inset-bottom))}

/* ---- testo aspetto profilo ---- */
.paspect{color:var(--soft);font-size:13.5px;margin:2px 2px 18px;line-height:1.5}

/* ---- selettore tema: segmented premium (Luce/Buio/Automatico) ---- */
.themeseg{display:flex;gap:6px;padding:6px;margin:0 18px;background:var(--glass);border:1px solid var(--strokeSoft);border-radius:18px;-webkit-backdrop-filter:blur(22px) saturate(120%);backdrop-filter:blur(22px) saturate(120%);box-shadow:inset 0 1px 0 var(--hi),0 6px 20px var(--shcol)}
.segbtn{flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;padding:13px 6px;border:none;background:transparent;border-radius:13px;color:var(--soft);font-family:inherit;font-weight:500;font-size:12.5px;letter-spacing:.01em;cursor:pointer;transition:background .35s ease,color .35s ease,box-shadow .35s ease,transform .2s cubic-bezier(.4,0,.2,1)}
.segbtn .segico{display:grid;place-items:center}
.segbtn .segico svg{width:22px;height:22px;display:block;stroke:currentColor}
.segbtn .seglbl{font-weight:600}
.segbtn:active{transform:scale(.97)}
.segbtn.on{background:var(--glassDock);color:var(--accent);box-shadow:0 4px 14px var(--shcol),inset 0 1px 0 var(--hi)}

/* ---- transizione morbida al cambio tema ---- */
body,.card,.cat,.herocard,.glass,.sheet,.detailsheet,.topbar,.dock,.cbody,.ord,.banner,.segbtn,.title,.kick,.empty,.mat,.cardcat{transition:background-color .42s ease,color .38s ease,border-color .42s ease,box-shadow .42s ease}
.gico,.dnav svg,.heart svg,.ticon svg{transition:stroke .4s ease,fill .4s ease}

/* ============================ BRIEF: e-commerce premium ====================== */
/* ---- card: gerarchia editoriale parte inferiore ---- */
.cbody{padding:14px 14px 15px;display:flex;flex-direction:column;gap:0;min-width:0;background:linear-gradient(180deg,rgba(217,194,163,.18) 0%,rgba(239,231,221,.08) 100%)}
body.dark .cbody{background:linear-gradient(180deg,rgba(90,64,48,.22) 0%,rgba(59,43,37,.08) 100%)}
.cbody .cardcat{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--soft);margin:0 0 9px}
.cbody .cardcat .gico{width:13px;height:13px;flex:none}
.cbody .ct{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:16px;line-height:1.18;color:var(--text);margin:0 0 4px;min-width:0}
.cbody .mat{font-size:11.5px;color:var(--soft);margin:0 0 9px}
.cbody .cp{font-weight:700;font-size:16.5px;color:var(--text);margin:0 0 13px;letter-spacing:.01em}
.configbtn{width:100%;padding:11px;border-radius:13px;border:1px solid rgba(199,125,107,.26);background:linear-gradient(180deg,rgba(199,125,107,.15),rgba(199,125,107,.09));color:var(--accent);font-family:inherit;font-weight:700;font-size:13px;letter-spacing:.02em;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 5px 14px rgba(199,125,107,.13);transition:background .28s ease,box-shadow .28s ease,transform .2s cubic-bezier(.4,0,.2,1)}
.configbtn:hover{background:linear-gradient(180deg,rgba(199,125,107,.22),rgba(199,125,107,.13))}
.configbtn:active{transform:scale(.97)}
body.dark .configbtn{border-color:rgba(209,124,86,.32);background:linear-gradient(180deg,rgba(209,124,86,.2),rgba(209,124,86,.11));color:#E7A57E;box-shadow:inset 0 1px 0 var(--hi),0 5px 14px rgba(0,0,0,.3)}

/* ---- card: ombra a strati (sospesa) + lift elegante ---- */
.card{box-shadow:0 1px 3px rgba(70,45,30,.05),0 10px 26px var(--shcol),0 24px 50px rgba(90,55,35,.05);transition:transform .3s ease-out,box-shadow .3s ease-out}
body.dark .card{box-shadow:0 1px 3px rgba(0,0,0,.3),0 14px 34px rgba(0,0,0,.45)}
.card:active,.card:hover{transform:scale(1.02);box-shadow:0 4px 10px rgba(70,45,30,.07),0 18px 40px var(--shcol),0 34px 70px rgba(90,55,35,.08)}
body.dark .card:active,body.dark .card:hover{box-shadow:0 6px 16px rgba(0,0,0,.4),0 26px 60px rgba(0,0,0,.55)}
.herocard{transition:transform .3s ease-out,box-shadow .3s ease-out}
.herocard:hover,.herocard:active{transform:scale(1.015)}
.cat:active{transform:scale(.985)}

/* ---- dock a 4 (Home/Esplora/Piaciuti/Ordini) ---- */
.dock.dock4{gap:4px}
.dock.dock5{gap:2px}
.dock.dock5 .dnav{width:51px}
@media(max-width:360px){.dock.dock5 .dnav{width:46px}}
.dnav.liked.act svg{stroke:var(--accent);fill:none}
.dnav.cart{position:relative}
.cartbadge{display:none!important}
/* Hard kill legacy numeric cart badges: Strato usa solo il punto materico. */
.dnav.cart .cbadge,
.dnav.cart .cartbadge,
.tb-btn.cart .cbadge,
.tb-btn.cart .cartbadge{display:none!important}

.dnav.profile svg{stroke:var(--icon)}
.dnav.profile.act svg{stroke:var(--accent)}

/* ---- campanella notifiche (topbar) ---- */
.tb-btn.bell{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 var(--hi), var(--elev1);color:var(--text)}
.tb-btn.bell svg{width:22px;height:22px;stroke:var(--text);fill:none}

/* Badge v2 — punto frosted matte, definito in CSS vettoriale */
.softdot{
  position:absolute;
  width:8px;
  height:8px;
  border-radius:50%;
  pointer-events:none;
  background:
    linear-gradient(145deg, rgba(206,132,105,.74), rgba(155,96,73,.62)),
    rgba(196,122,94,.42);
  border:1px solid rgba(255,244,235,.38);
  -webkit-backdrop-filter:blur(10px) saturate(135%);
  backdrop-filter:blur(10px) saturate(135%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.18),
    inset 0 -1px 1px rgba(92,58,44,.10),
    0 1px 4px rgba(90,55,42,.18);
  transform:translateZ(0);
}
.cartdot{top:10px;right:12px}
.belldot{top:8px;right:9px}
body.dark .softdot{
  background:
    linear-gradient(145deg, rgba(207,132,101,.66), rgba(137,82,62,.56)),
    rgba(184,105,78,.34);
  border-color:rgba(255,235,220,.22);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -1px 1px rgba(0,0,0,.16),
    0 1px 5px rgba(0,0,0,.26);
}

/* ---- foglio notifiche ---- */

.notifrow{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);margin-bottom:9px;cursor:pointer;color:var(--text);font-family:inherit;transition:background .25s ease,transform .2s ease}
.notifrow:active{transform:scale(.985)}
.notifdot{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 8px rgba(199,125,107,.35)}
.notifdot.s-pending{background:var(--warning)}
.notifdot.s-confirmed{background:var(--success)}
.notifdot.s-rejected{background:#b06a52}
.notifdot.s-completed{background:#7f8f6c}
.notiftxt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.notiftxt b{font-size:14px;font-weight:700;color:var(--text)}
.notifb{font-size:12.5px;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.notifarrow{color:var(--faint);font-size:22px;line-height:1;flex:none}
.bgnote{margin:9px 18px 0;font-size:11.5px;color:var(--soft);line-height:1.45}

/* ---- riga Tema + Esci (collegati) ---- */
.prefrow{display:flex;gap:10px;align-items:stretch;margin:0 18px}
.prefrow .themeseg{flex:1;margin:0}
.themeseg.compact .segbtn{padding:11px 4px;gap:6px;font-size:10.5px}
.themeseg.compact .segbtn .segico svg{width:20px;height:20px}
.logout.side{flex:none;width:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;margin:0;padding:11px 18px;border-radius:18px;border:1px solid var(--strokeSoft);background:var(--glass);color:var(--soft);font-family:inherit;font-weight:600;font-size:10.5px;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi)}
.logout.side svg{width:20px;height:20px}
.logout.side:active{transform:scale(.97)}

/* ---- evidenziazione ordine da notifica ---- */
.ofocus{animation:ofocusPulse 2.4s cubic-bezier(.4,0,.2,1)}
@keyframes ofocusPulse{0%{box-shadow:0 0 0 0 rgba(199,125,107,0)}22%{box-shadow:0 0 0 3px rgba(199,125,107,.55),0 8px 24px rgba(199,125,107,.2)}100%{box-shadow:0 0 0 0 rgba(199,125,107,0)}}
.badge.br{background:rgba(176,106,82,.16);color:#b06a52}
.orddel{flex:none;width:34px;height:34px;margin-left:8px;border-radius:11px;border:1px solid rgba(192,57,43,.35);background:rgba(192,57,43,.08);color:#c0392b;display:grid;place-items:center;cursor:pointer;transition:transform .12s,background .2s}
.orddel:active{transform:scale(.9)}
.orddel svg{width:18px;height:18px}
.notifhead{display:flex;align-items:center;justify-content:space-between;gap:12px}
.notifclear{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--soft);font-family:inherit;font-weight:600;font-size:12.5px;padding:7px 12px;border-radius:20px;cursor:pointer;transition:transform .12s,background .2s}
.notifclear:active{transform:scale(.95)}
.notifclear svg{width:15px;height:15px}

/* ---- dock: tab ordini ---- */
.dnav.orders{position:relative}
.dnav.orders svg{stroke:var(--icon)}
.dnav.orders.act svg{stroke:var(--accent)}
.dnav.orders .orddot{position:absolute;top:7px;right:calc(50% - 16px);width:8px;height:8px;border-radius:50%;background:var(--accent);border:1.6px solid var(--glassDock)}

/* ---- detail: colori in sola lettura ---- */
.dswatches.readonly{pointer-events:none}
.dswbox.ro{cursor:default}

/* ===================== PROFILO — premium ===================== */
@keyframes profIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.profilePage .title{margin-bottom:20px}
.profileHero,.profilePage .profileSection,.profileLogoutWrap{animation:profIn .5s cubic-bezier(.22,1,.36,1) both}
.profilePage .profileSection:nth-of-type(1){animation-delay:.04s}
.profilePage .profileSection:nth-of-type(2){animation-delay:.09s}
.profilePage .profileSection:nth-of-type(3){animation-delay:.14s}
.profileLogoutWrap{animation-delay:.18s}
.profileHero{display:flex;align-items:center;gap:18px;margin:0 18px;padding:22px;border-radius:26px;background:var(--card);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi),0 10px 30px var(--shcol)}
.profileAvatar{width:74px;height:74px;border-radius:50%;object-fit:cover;flex:none;border:1px solid var(--strokeSoft);box-shadow:0 4px 14px var(--shcol)}
.profileIdentity{min-width:0;display:flex;flex-direction:column;gap:7px}
.profileName{font-weight:700;font-size:21px;letter-spacing:-.3px;line-height:1.12;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.profileRolePill{align-self:flex-start;display:inline-flex;align-items:center;padding:4px 11px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:.04em;color:var(--accent2);background:rgba(199,125,107,.12);border:1px solid rgba(199,125,107,.24)}
body.dark .profileRolePill{color:var(--accent);background:rgba(199,125,107,.15);border-color:rgba(199,125,107,.30)}
.profileMicrocopy{margin:1px 0 0;font-size:13px;line-height:1.45;color:var(--soft)}
.profileSection{margin-top:26px}
.profileSectionTitle{margin:0 22px 12px;font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--soft)}
.profileAdminCard{margin:0 18px;padding:8px;border-radius:22px;background:var(--glass2);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi)}
.profileAdminActions{display:flex;flex-direction:column;gap:6px}
.profileSubtleButton{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:13px;border-radius:16px;border:1px solid transparent;background:transparent;color:var(--text);font-family:inherit;cursor:pointer;transition:background .25s cubic-bezier(.22,1,.36,1),transform .18s}
.profileSubtleButton:hover{background:var(--glass)}
.profileSubtleButton:active{transform:scale(.985)}
.profileSubtleIcon{flex:none;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 4px 12px var(--shcol)}
.profileSubtleIcon svg{width:19px;height:19px}
.profileSubtleText{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.profileSubtleT{font-weight:600;font-size:15px;color:var(--text)}
.profileSubtleS{font-size:12.5px;color:var(--soft)}
.profileSubtleArr{flex:none;display:flex;color:var(--soft);opacity:.5}
.profileSubtleArr svg{width:18px;height:18px}
.profilePage .themeseg{margin:0 18px;gap:4px;padding:5px;background:var(--glass2);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi)}
.profilePage .segbtn{transition:background .3s cubic-bezier(.22,1,.36,1),color .3s,box-shadow .3s,transform .18s}
.profilePage .segbtn.on{background:var(--card);color:var(--accent);box-shadow:0 2px 8px var(--shcol),inset 0 1px 0 var(--hi)}
.profilePage .segbtn:active{transform:scale(.97)}
.profilePage .pwa-prow{box-shadow:inset 0 1px 0 var(--hi);margin-bottom:0}
.profileLogoutWrap{display:flex;justify-content:center;margin:34px 18px 4px}
.profileLogout{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:14px;border:1px solid var(--strokeSoft);background:transparent;color:var(--soft);font-family:inherit;font-weight:500;font-size:14px;cursor:pointer;transition:background .25s,color .25s,transform .18s}
.profileLogout svg{width:17px;height:17px}
.profileLogout:hover{background:var(--glass);color:var(--text)}
.profileLogout:active{transform:scale(.985)}
.profilePage button:focus-visible,.profilePage .pwa-prow:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
@media(prefers-reduced-motion:reduce){
  .profileHero,.profilePage .profileSection,.profileLogoutWrap{animation:none!important}
  .profilePage .segbtn,.profileSubtleButton,.profileLogout{transition:none!important}
}

/* ===================== NOTIFICHE — push-row + toggle switch ===================== */
.push-row{display:flex;align-items:center;gap:14px;padding:13px 16px;margin:0 18px;border-radius:18px;background:var(--glass2);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi);transition:opacity .25s}
.push-row--denied{opacity:.6}
.push-row--busy{opacity:.75;pointer-events:none}
.push-row-ico{flex:none;display:flex;color:var(--accent);opacity:.85}
.push-row-ico svg{width:20px;height:20px}
.push-row-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.push-row-title{font-size:15px;font-weight:600;color:var(--text);line-height:1.2}
.push-row-sub{font-size:12.5px;font-weight:400;color:var(--soft);line-height:1.4}

/* Toggle switch */
.push-toggle{flex:none;position:relative;width:46px;height:27px;border-radius:999px;border:none;padding:0;cursor:pointer;background:var(--bg2);box-shadow:inset 0 0 0 1.5px var(--strokeSoft);transition:background .3s cubic-bezier(.22,1,.36,1),box-shadow .3s cubic-bezier(.22,1,.36,1),transform .15s cubic-bezier(.22,1,.36,1)}
.push-toggle--on{background:var(--accent);box-shadow:inset 0 0 0 1.5px transparent,0 2px 8px var(--shcol)}
.push-toggle--busy{opacity:.55;cursor:default}
.push-toggle:disabled{cursor:default}
.push-toggle:active:not(:disabled){transform:scale(.955)}
.push-toggle-knob{position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18);transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s cubic-bezier(.22,1,.36,1)}
.push-toggle--on .push-toggle-knob{transform:translateX(19px);box-shadow:0 2px 6px rgba(0,0,0,.22)}
.push-toggle:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}

/* Dark overrides */
body.dark .push-toggle{background:var(--bg2)}
body.dark .push-toggle--on{background:var(--accent)}
body.dark .push-toggle-knob{background:rgba(255,255,255,.92)}

/* Reduced motion */
@media (prefers-reduced-motion:reduce){
  .push-toggle,.push-toggle-knob,.push-row{transition:none!important}
}

/* ===================== PIACIUTI — redesign premium ===================== */

/* Sottotitolo condizionale */
.liked-page-sub{margin:-6px 0 18px;font-size:14px;font-weight:400;color:var(--soft);line-height:1.45;font-style:italic}

/* Griglia wrapper: respiro leggermente aumentato */
.liked-grid-wrap{padding:0 18px}
.liked-grid-wrap .grid{gap:16px}

/* Card variante liked: più editoriale */
.liked-card{border-radius:24px}
/* dark mode: bordo caldo appena più leggibile */
body.dark .liked-card{box-shadow:inset 0 0 0 1px rgba(199,125,107,.14),var(--elev2)}

/* Categoria: più raffinata */
.liked-card .cbody .cardcat{font-size:9.5px;letter-spacing:.12em;color:var(--soft);opacity:.75}

/* Materiale: più morbido */
.liked-card .cbody .mat{font-size:11px;color:var(--soft);opacity:.8}

/* Prezzo: visibile ma meno dominante */
.liked-card .cbody .cp{font-size:15px;font-weight:600;letter-spacing:.005em;color:var(--text);opacity:.85;margin-bottom:12px}

/* CTA editoriale "Dettagli" */
.liked-configbtn{
  width:100%;padding:10px;border-radius:12px;
  border:1px solid rgba(199,125,107,.28);
  background:transparent;
  color:var(--accent2);
  font-family:inherit;font-weight:600;font-size:12.5px;letter-spacing:.03em;
  cursor:pointer;
  transition:background .24s cubic-bezier(.22,1,.36,1),transform .16s cubic-bezier(.22,1,.36,1),box-shadow .24s;
}
.liked-configbtn:hover{background:rgba(199,125,107,.08)}
.liked-configbtn:active{transform:scale(.985)}
.liked-configbtn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
body.dark .liked-configbtn{border-color:rgba(199,125,107,.30);color:var(--accent)}
body.dark .liked-configbtn:hover{background:rgba(199,125,107,.10)}

/* Focus ring caldo su card e pulsante like */
.liked-card:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
.liked-card .lk:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 3px var(--accent)}

/* Stagger ingresso card piaciuti */
@keyframes likedCardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.liked-grid-wrap .card.in{animation:likedCardIn .42s cubic-bezier(.22,1,.36,1) both}
.liked-grid-wrap .card:nth-child(1){animation-delay:0ms}
.liked-grid-wrap .card:nth-child(2){animation-delay:40ms}
.liked-grid-wrap .card:nth-child(3){animation-delay:80ms}
.liked-grid-wrap .card:nth-child(4){animation-delay:120ms}
.liked-grid-wrap .card:nth-child(5){animation-delay:160ms}
.liked-grid-wrap .card:nth-child(6){animation-delay:200ms}
.liked-grid-wrap .card:nth-child(n+7){animation-delay:220ms}

/* Bottom spacer dock */
.liked-bottom-spacer{height:calc(80px + env(safe-area-inset-bottom, 0px))}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .liked-grid-wrap .card.in{animation:none!important;opacity:1!important;transform:none!important}
  .liked-configbtn{transition:none!important}
}

/* ===================== ORDINI — premium redesign ===================== */

.ordersPage{padding-bottom:0}
.ordersHero{margin:0 0 18px}
.ordersHero .title{margin-bottom:4px!important}
.ordersSubtitle{margin:0;color:var(--soft);font-size:15px;font-weight:400;line-height:1.45;letter-spacing:-.08px}
.ordersList{display:flex;flex-direction:column;gap:16px;margin-top:18px}

/* Card ordine: meno dashboard, più richiesta editoriale */
.orderCard{display:flex;align-items:center;gap:15px;border-radius:25px;padding:17px 16px;margin:0 14px;min-height:100px;cursor:pointer;transition:transform .18s cubic-bezier(.22,1,.36,1),box-shadow .25s cubic-bezier(.22,1,.36,1),background-color .3s,border-color .3s}
.orderCard:active{transform:scale(.985)}
.orderCard:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}

.orderThumb{flex:none;width:64px;height:64px;border-radius:18px;object-fit:cover;align-self:center;box-shadow:0 4px 14px rgba(72,50,32,.12),inset 0 1px 0 rgba(255,255,255,.25);border:1px solid var(--strokeSoft);background:var(--glass2)}
.orderAvatar{flex:none;width:46px;height:46px;border-radius:50%;object-fit:cover;align-self:center;border:1px solid var(--strokeSoft);box-shadow:0 3px 12px rgba(72,50,32,.13)}

.orderBody{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px;padding-top:0;align-self:center}
.orderTitle{font-weight:750;font-size:16px;letter-spacing:-.22px;line-height:1.18;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.orderMeta{font-size:12.8px;font-weight:450;color:var(--soft);line-height:1.38;white-space:normal;display:flex;flex-direction:column;gap:2px}
.orderMeta strong{font-weight:650;color:var(--text)}
.orderNote{margin:2px 0 0;font-size:12.5px;line-height:1.45;color:var(--soft);font-weight:400;max-width:96%}
.orderCta{display:none}

.orderSide{flex:none;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:8px;align-self:stretch;min-width:78px;padding-top:0}
.ostat{display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;border:1px solid transparent}
.ostat--confirmed{background:rgba(199,125,107,.16);color:#9E553F;border-color:rgba(199,125,107,.34)}
body.dark .ostat--confirmed{background:rgba(199,125,107,.18);color:#D99A82;border-color:rgba(199,125,107,.36)}
.ostat--pending{background:rgba(184,154,119,.16);color:#7D654B;border-color:rgba(184,154,119,.30)}
body.dark .ostat--pending{background:rgba(184,154,119,.18);color:#CDB79A;border-color:rgba(184,154,119,.34)}
.ostat--rejected{background:rgba(126,104,92,.14);color:#715A4E;border-color:rgba(126,104,92,.28)}
body.dark .ostat--rejected{background:rgba(126,104,92,.20);color:#C6AA9C;border-color:rgba(126,104,92,.36)}
.ostat--completed{background:rgba(127,143,108,.16);color:#647252;border-color:rgba(127,143,108,.32)}
body.dark .ostat--completed{background:rgba(127,143,108,.20);color:#B7C6A3;border-color:rgba(127,143,108,.38)}

.orderAdminActions{display:flex;flex-direction:column;gap:6px;margin-top:2px;align-items:flex-end}
.orderCompleteBtn{border:1px solid rgba(127,143,108,.32);border-radius:12px;padding:7px 10px;background:rgba(127,143,108,.13);color:#647252;font-family:inherit;font-weight:750;font-size:12px;cursor:pointer;white-space:nowrap}
body.dark .orderCompleteBtn{background:rgba(127,143,108,.18);border-color:rgba(127,143,108,.38);color:#B7C6A3}
.orderCard--pend .orderSide{min-width:88px}


.orderFilters{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;margin:18px 14px 0;padding:4px 2px 6px}
.orderFilters::-webkit-scrollbar{display:none}
.orderFilter{flex:none;display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border-radius:999px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--soft);font-family:inherit;font-size:12.5px;font-weight:700;letter-spacing:.01em;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi);transition:background .22s ease,color .22s ease,border-color .22s ease,transform .14s ease}
.orderFilter:active{transform:scale(.97)}
.orderFilter.on{background:rgba(199,125,107,.15);border-color:rgba(199,125,107,.30);color:var(--accent)}
body.dark .orderFilter.on{background:rgba(199,125,107,.18);border-color:rgba(199,125,107,.34);color:#D99A82}
.orderFilter em{font-style:normal;min-width:19px;height:19px;padding:0 6px;border-radius:999px;background:rgba(126,104,92,.10);color:var(--soft);display:inline-grid;place-items:center;font-size:11px;font-weight:760}
.orderFilter.on em{background:rgba(199,125,107,.18);color:var(--accent)}
body.dark .orderFilter em{background:rgba(255,255,255,.06)}
body.dark .orderFilter.on em{background:rgba(199,125,107,.20);color:#D99A82}
.ordersFilterEmpty{margin:28px 22px 0;color:var(--soft);font-size:14px;line-height:1.45;text-align:center}
.orderArchivedHint{font-size:11px;font-weight:720;color:var(--soft);opacity:.72}

.ordersEmpty{min-height:calc(100vh - 360px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px 28px 42px;gap:16px}
.ordersEmptyIcon{width:60px;height:60px;border-radius:50%;background:rgba(199,125,107,.08);border:1px solid rgba(199,125,107,.20);display:grid;place-items:center;color:var(--accent);opacity:.76}
.ordersEmptyIcon svg{width:27px;height:27px;stroke:var(--accent)}
.ordersEmptyText{font-size:15px;font-weight:430;color:var(--soft);line-height:1.5;margin:0;max-width:280px}
.ordersExploreCta{margin-top:2px;padding:12px 28px;border-radius:15px;border:1px solid rgba(199,125,107,.28);background:rgba(199,125,107,.13);color:var(--accent);font-family:inherit;font-weight:750;font-size:14px;cursor:pointer;transition:background .25s,transform .15s,box-shadow .25s,border-color .25s}
.ordersExploreCta:hover{background:rgba(199,125,107,.18);border-color:rgba(199,125,107,.36)}
.ordersExploreCta:active{transform:scale(.985)}
.ordersExploreCta:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
body.dark .ordersExploreCta{background:rgba(199,125,107,.18);border-color:rgba(199,125,107,.34);color:#d9957d}
body.dark .ordersExploreCta:hover{background:rgba(199,125,107,.24)}

.ordersBottomSpacer{height:calc(80px + env(safe-area-inset-bottom, 0px))}
.orderCard.in{animation:itemIn .45s cubic-bezier(.22,1,.36,1) both}

@media(max-width:390px){
  .orderCard{gap:12px;padding:15px 13px;min-height:96px}
  .orderThumb{width:58px;height:58px;border-radius:16px}
  .orderSide{min-width:68px;gap:8px}
  .ostat{font-size:10px;padding:4px 8px}
}
@media(prefers-reduced-motion:reduce){
  .orderCard{transition:none!important;animation:none!important}
  .ordersExploreCta{transition:none!important}
}


/* ===================== DETTAGLIO ORDINE — vista interna, no sheet ===================== */
.orderDetailPage{padding-bottom:calc(88px + env(safe-area-inset-bottom, 0px))}
.orderDetailHero{margin:0 0 16px}
.orderDetailTitle{margin:0;color:var(--text);font-size:28px;font-weight:760;letter-spacing:-.62px;line-height:1.05}
.orderDetailSubtitle{display:none}
.orderDetailCard{margin:0 14px;border-radius:30px;padding:18px;border:1px solid var(--strokeSoft);box-shadow:0 12px 34px rgba(72,50,32,.11),inset 0 1px 0 var(--hi)}
body.dark .orderDetailCard{box-shadow:0 14px 38px rgba(0,0,0,.25),inset 0 1px 0 var(--hi)}
.orderDetailHead{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--strokeSoft)}
.orderDetailIdentity{display:flex;align-items:center;gap:12px;min-width:0}
.orderDetailIdentityText{min-width:0}
.orderDetailName{font-family:'Inter',system-ui,sans-serif;font-weight:760;font-size:20px;letter-spacing:-.35px;line-height:1.08;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.orderDetailDate{margin-top:5px;font-size:13.5px;line-height:1.35;color:var(--soft);font-weight:430}
.orderDetailStatus{justify-self:end;align-self:center;display:flex;align-items:center;min-height:48px}
.orderDetailStatus .ostat{padding:7px 11px;font-size:10.5px}
.orderDetailCard .invav{width:50px;height:50px}
.orderDetailCard .invitems{margin-top:0}
.orderDetailItem{padding:6px 0 18px;margin-bottom:4px;border-bottom:1px solid var(--strokeSoft)}
.orderDetailItem:last-child{margin-bottom:0}
.orderDetailItemTop{display:grid;grid-template-columns:94px minmax(0,1fr);gap:14px;align-items:start;margin-bottom:0}
.orderDetailThumb{width:94px;height:94px;border-radius:22px;object-fit:cover;border:1px solid var(--strokeSoft);box-shadow:0 8px 22px rgba(72,50,32,.14),inset 0 1px 0 rgba(255,255,255,.22);background:var(--glass2)}
body.dark .orderDetailThumb{box-shadow:0 10px 26px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.08)}
.orderDetailProduct{min-width:0}
.orderDetailProductLine{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.orderDetailProductName{font-size:22px;font-weight:780;letter-spacing:-.35px;line-height:1.12;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:normal;max-width:100%}
.orderDetailQty{flex:none;font-size:13.5px;font-weight:650;color:var(--soft)}
.orderDetailProductMeta{margin-top:8px;display:flex;flex-direction:column;gap:3px;font-size:13.5px;line-height:1.35;color:var(--soft);font-weight:430}
.orderDetailProductMeta strong{color:var(--text);font-weight:650}
.orderDetailOptions{margin-top:12px;display:flex;flex-direction:column;gap:7px;color:var(--soft);font-size:13.2px;line-height:1.35}
.orderOptionRow{display:grid;grid-template-columns:22px minmax(0,1fr);align-items:center;gap:8px;min-height:22px}
.orderOptionIcon{width:22px;height:22px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;color:var(--accent);background:rgba(199,125,107,.10);border:1px solid rgba(199,125,107,.16)}
.orderOptionIcon svg{width:14px;height:14px;stroke:currentColor}
.orderOptionDot{width:5px;height:5px;border-radius:999px;background:currentColor;display:block;opacity:.8}
.orderDetailItemPrice{display:block;margin-top:14px;padding:0;border:0;background:transparent;color:var(--text);font-size:17px;font-weight:760;letter-spacing:-.2px;box-shadow:none}
body.dark .orderOptionIcon{background:rgba(199,125,107,.13);border-color:rgba(199,125,107,.24);color:#D99A82}
body.dark .orderDetailItemPrice{background:transparent;border-color:transparent;box-shadow:none}
.orderDetailConfig{display:none}
.orderDetailCard .ibd{display:none}
.orderDetailCard .ibd span:first-child{color:var(--soft)}
.orderDetailCard .isub{display:none}
.orderDetailCard .invtotrow{margin-top:16px;padding-top:16px;border-top:1px solid var(--strokeSoft)}
.orderDetailCard .invtot{font-size:31px;letter-spacing:-.62px}

.orderDanger{margin:14px 14px 0}
.orderDangerBtn{width:100%;border:1px solid rgba(126,104,92,.22);background:rgba(126,104,92,.08);color:var(--soft);border-radius:18px;padding:13px 16px;font-family:inherit;font-size:13px;font-weight:720;cursor:pointer;transition:background .22s ease,transform .14s ease,color .22s ease,border-color .22s ease}
.orderDangerBtn:active{transform:scale(.985)}
.orderDangerBtn:hover{background:rgba(126,104,92,.12);border-color:rgba(126,104,92,.30);color:var(--text)}
.orderDangerConfirm{border:1px solid rgba(126,104,92,.26);background:var(--glass2);border-radius:22px;padding:15px;display:flex;align-items:center;justify-content:space-between;gap:14px;box-shadow:inset 0 1px 0 var(--hi)}
.orderDangerConfirm b{display:block;font-size:13.5px;color:var(--text);letter-spacing:-.1px;margin-bottom:3px}
.orderDangerConfirm span{display:block;font-size:12.5px;color:var(--soft);line-height:1.35}
.orderDangerActions{display:flex;gap:8px;align-items:center;flex:none}
.orderDangerCancel,.orderDangerDelete{border-radius:14px;padding:10px 12px;font-family:inherit;font-weight:760;font-size:12.5px;cursor:pointer;transition:transform .14s ease,background .22s ease}
.orderDangerCancel{border:1px solid var(--strokeSoft);background:var(--glass);color:var(--soft)}
.orderDangerDelete{border:1px solid rgba(99,68,51,.32);background:rgba(99,68,51,.13);color:#634433}
.orderDangerCancel:active,.orderDangerDelete:active{transform:scale(.96)}
body.dark .orderDangerDelete{background:rgba(192,153,127,.14);border-color:rgba(192,153,127,.30);color:#D8B89F}
@media(max-width:390px){.orderDangerConfirm{align-items:stretch;flex-direction:column}.orderDangerActions{justify-content:flex-end}}

.orderDetailNote{margin:14px 14px 0;padding:14px 16px;border-radius:22px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--soft);font-size:13.5px;line-height:1.45}
@media(max-width:390px){
  .orderDetailCard{margin:0 10px;padding:15px;border-radius:27px}
  .orderDetailHead{gap:10px}
  .orderDetailName{font-size:18px}
  .orderDetailItemTop{grid-template-columns:82px minmax(0,1fr);gap:12px}
  .orderDetailThumb{width:82px;height:82px;border-radius:19px}
  .orderDetailProductName{font-size:20px}
  .orderDetailCard .invtot{font-size:27px}
}
@media(prefers-reduced-motion:reduce){.orderDetailPage{animation:none!important}}

/* ===================== HOME — premium editorial ===================== */

/* Headline hero: leggermente alleggerita (800→700, 40px→37px) */
.hero{font-size:37px;font-weight:700;line-height:1.07}

/* Label A COLPO D'OCCHIO sotto headline */
.homekick{margin:10px 0 14px}

/* Respiro tra hero image e sezione Lasciati ispirare */
.herocard{margin-bottom:26px}

/* Titolo sezione "Lasciati ispirare": meno dominante */
.home-sec-title{font-size:22px;font-weight:700;letter-spacing:-.3px;margin-top:4px;margin-bottom:14px}

/* Herotag — targhetta materica, meno glass */
.herotag{
  background:rgba(246,239,228,.90);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  border:1px solid rgba(199,125,107,.16);
  box-shadow:0 4px 18px rgba(70,45,25,.10);
}
body.dark .herotag{
  background:rgba(43,33,27,.92);
  border-color:rgba(199,125,107,.20);
  box-shadow:0 4px 18px rgba(0,0,0,.32);
}
.herotag .ht{font-size:14px;font-weight:700;letter-spacing:-.1px}
.herotag .hp{font-size:12.5px;font-weight:500;color:var(--soft)}

/* Hero image: crop più intenzionale */
.herocard img{object-position:center 35%}

/* ===================== TOPBAR — più calda, meno glass ===================== */

/* Override del topbar::after per luce e buio */
.topbar::after{
  background:linear-gradient(to bottom, rgba(244,236,222,.94) 0%, rgba(244,236,222,.68) 44%, transparent 100%);
  -webkit-backdrop-filter:blur(5px) saturate(130%);backdrop-filter:blur(5px) saturate(130%);
}
body.dark .topbar::after{
  background:linear-gradient(to bottom, rgba(43,33,27,.94) 0%, rgba(43,33,27,.68) 44%, transparent 100%);
}

/* ===================== CARD — scaffold stabile + raffinamenti ===================== */

/* cbody: flex:1 per riempire l'altezza disponibile della card */
.cbody{flex:1}

/* Titolo: spazio riservato a 2 righe, line-clamp */
.cbody .ct{
  min-height:calc(1.18em * 2);
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}

/* Prezzo: meno dominante */
.cbody .cp{
  font-size:15px;
  font-weight:600;
  margin-top:auto;
  opacity:.9;
}

/* CTA → prezzo spinge tutto in basso, cta segue subito */
.configbtn,.liked-configbtn{margin-top:0}

/* Categoria: più raffinata */
.cbody .cardcat{
  font-size:9.5px;
  letter-spacing:.12em;
  opacity:.7;
}

/* Materiale: più morbido */
.cbody .mat{opacity:.72}

/* Cuore: più discreto */
.lk{
  background:rgba(246,239,228,.78);
  border-color:rgba(199,125,107,.18);
}
body.dark .lk{
  background:rgba(55,42,36,.82);
  border-color:rgba(199,125,107,.22);
}

/* Card dark mode: bordo caldo per separazione dal fondo */
body.dark .card{box-shadow:0 1px 3px rgba(0,0,0,.32),0 14px 34px rgba(0,0,0,.44),inset 0 0 0 1px rgba(199,125,107,.10)}

/* Card light mode: ombre più diffuse */
.card{box-shadow:0 1px 3px rgba(70,45,30,.04),0 8px 22px var(--shcol),0 20px 44px rgba(90,55,35,.04)}

/* ===================== SCREEN TRANSITION — translateY leggero ===================== */
@keyframes scrIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* ===================== GLOBAL WRAP PADDING ===================== */
/* .wrap ha già 132px → sufficiente per la dock. Qui solo sicurezza mobile. */
.wrap{padding-bottom:max(132px, calc(80px + env(safe-area-inset-bottom, 24px)))}

/* Reduced motion — nuove animazioni */
@media(prefers-reduced-motion:reduce){
  @keyframes scrIn{from{opacity:1;transform:none}to{opacity:1;transform:none}}
  .cbody .cp,.cbody .ct,.lk,.herotag,.topbar::after{transition:none!important}
}

/* ===================== SHEET — scroll lock e safe-area ===================== */
html.sheet-open,body.sheet-open{overflow:hidden!important;overscroll-behavior:none!important}
/* .ipick: inset:0 copre tutto il viewport (inclusa la dock, z-index:85 > 72).
   overflow:hidden clipa il contenuto animato durante slide e drag-to-close. */
.ipick{overflow:hidden;bottom:-96px;padding-bottom:96px;box-sizing:border-box}
/* L'overlay viene esteso sotto il viewport e compensato con padding: copre la safe-area iOS senza spostare il foglio. */
/* scroll interno dello sheet */
.ipick .sheet{touch-action:pan-y}

/* ===================== FLOATING SHEET — pannello premium ==================
   Il padding sul wrapper crea il gap intenzionale tra sheet e bordo display.
   La dock resta ferma sotto lo scrim: non viene nascosta né spostata.
   Border-radius completo. Nessun pseudo-elemento, nessun cerotto. */

/* Wrapper bottom: gap visivo intenzionale dal bordo inferiore del display */
.ipick:not(.top) .sheetwrap{
  padding:0 10px calc(12px + env(safe-area-inset-bottom));
  box-sizing:border-box;
}
/* Wrapper top (notifiche): gap visivo intenzionale dal bordo superiore */
.ipick.top .sheetwrap{
  padding:calc(12px + env(safe-area-inset-top)) 10px 0;
  box-sizing:border-box;
}
/* Detailsheet: border-radius completo, max-height allineato al dvh */
.sheet.detailsheet{
  border-radius:28px;
  max-height:calc(100dvh - 20px - env(safe-area-inset-top));
}
/* Dark mode: ombra più profonda su sfondo scuro */
body.dark .ipick .sheet{
  box-shadow:0 8px 40px rgba(0,0,0,.50),0 2px 8px rgba(0,0,0,.30);
}

/* Backdrop caldo (espresso warm invece di nero freddo) */
@keyframes scrimIn{from{background:rgba(43,33,27,0)}to{background:var(--sheet-scrim)}}
@keyframes scrimOut{from{background:var(--sheet-scrim)}to{background:rgba(43,33,27,0)}}
.ipick.on{background:var(--sheet-scrim)}
.ipick.on.closing{background:rgba(43,33,27,0)}

/* Sheet base: più materica, meno glass */
.ipick .sheet{
  background:rgba(246,239,228,.96);
  -webkit-backdrop-filter:blur(10px) saturate(140%);backdrop-filter:blur(10px) saturate(140%);
  border-color:rgba(199,125,107,.14);
}
body.dark .ipick .sheet{
  background:rgba(38,29,24,.97);
  border-color:rgba(199,125,107,.18);
}

/* Detailsheet: già usa --detailGlass, riduco blur eccessivo */
.sheet.detailsheet{
  -webkit-backdrop-filter:blur(14px) saturate(150%);backdrop-filter:blur(14px) saturate(150%);
}

/* Sheetclose: più discreto e caldo */
.sheetclose{
  width:38px;height:38px;
  border-color:rgba(199,125,107,.20);
  background:rgba(246,239,228,.80);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 3px 10px rgba(43,33,27,.12);
}
body.dark .sheetclose{
  background:rgba(55,42,34,.90);
  border-color:rgba(199,125,107,.24);
}
.sheetclose:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}

/* gdot: più raffinato, indicatore attivo terracotta soft */
.gdot{width:5px;height:5px;background:rgba(199,125,107,.25);border:0;padding:0;appearance:none;-webkit-appearance:none;border-radius:50%;transition:background .2s,width .2s,border-radius .2s;cursor:pointer}
.gdot--on{background:rgba(199,125,107,.70);width:14px;border-radius:3px}
.gdot:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 3px rgba(199,125,107,.65)}

/* dkick: categoria leggermente alleggerita */
.dkick{font-weight:700;letter-spacing:.12em;color:rgba(166,84,53,.85)}



/* ===================== HOME ONLY — ingresso più lento e più ampio ===================== */
@keyframes homeViewIn {
  from {
    opacity: 0;
    transform: translateY(13px) scale(.998);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.homeview,
.screen.homeview,
.homeScreen,
.screen.homeScreen{
  animation: homeViewIn .68s cubic-bezier(.19,.85,.25,1) both!important;
}

.homeview .hero,
.homeview .heroCard,
.homeview .heroCopy,
.homeview .sectionTitle,
.homeview .grid,
.homeview .card,
.homeScreen .hero,
.homeScreen .heroCard,
.homeScreen .heroCopy,
.homeScreen .sectionTitle,
.homeScreen .grid,
.homeScreen .card{
  animation-duration:.74s!important;
  animation-timing-function:cubic-bezier(.19,.85,.25,1)!important;
}


.homeview .hero,
.homeview .heroCard,
.homeview .heroCopy,
.homeview .sectionTitle,
.homeview .grid,
.homeview .card,
.homeScreen .hero,
.homeScreen .heroCard,
.homeScreen .heroCopy,
.homeScreen .sectionTitle,
.homeScreen .grid,
.homeScreen .card{
  animation-delay:.07s!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview,
  .screen.homeview,
  .homeScreen,
  .screen.homeScreen,
  .homeview .hero,
  .homeview .heroCard,
  .homeview .heroCopy,
  .homeview .sectionTitle,
  .homeview .grid,
  .homeview .card,
  .homeScreen .hero,
  .homeScreen .heroCard,
  .homeScreen .heroCopy,
  .homeScreen .sectionTitle,
  .homeScreen .grid,
  .homeScreen .card{
    animation:none!important;
    transition:none!important;
  }
}



/* ===================== HOME HERO ONLY — comparsa più lenta ===================== */
.homeview .hero,
.homeview .heroCard,
.homeview .heroCopy,
.homeScreen .hero,
.homeScreen .heroCard,
.homeScreen .heroCopy{
  animation-duration:.92s!important;
  animation-delay:.12s!important;
  animation-timing-function:cubic-bezier(.19,.85,.25,1)!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview .hero,
  .homeview .heroCard,
  .homeview .heroCopy,
  .homeScreen .hero,
  .homeScreen .heroCard,
  .homeScreen .heroCopy{
    animation:none!important;
    transition:none!important;
  }
}


/* ===================== STRATO MOTION TUNING — soft premium ingressi ===================== */
:root{
  --strato-ease-soft:cubic-bezier(.19,.85,.25,1);
  --strato-view-dur:.46s;
  --strato-item-dur:.54s;
}

.appview{
  animation-duration:var(--strato-view-dur)!important;
  animation-timing-function:var(--strato-ease-soft)!important;
}

.viewStage,
.productview,
.cartview,
.ordersview,
.updatesview,
.adminProductView{
  animation-duration:var(--strato-view-dur)!important;
  animation-timing-function:var(--strato-ease-soft)!important;
}

.productview .dphoto,
.productview .dinfo,
.productview .dopts,
.productview .buybox,
.cartview .cartPageTitle,
.cartview .crow,
.cartview .ctotal,
.ordersview .title,
.ordersview .filters,
.ordersview .orderTile,
.ordersview .ordercard,
.updatesview .notifhead,
.updatesview .notifrow,
.adminProductView .adminProductCard,
.adminProductView .field,
.adminProductView .qsend{
  animation-duration:var(--strato-item-dur)!important;
  animation-timing-function:var(--strato-ease-soft)!important;
}

.productview .dinfo,
.cartview .crow,
.ordersview .orderTile,
.ordersview .ordercard,
.updatesview .notifrow,
.adminProductView .field{
  animation-delay:.04s;
}

.productview .dopts,
.cartview .ctotal,
.adminProductView .qsend{
  animation-delay:.08s;
}

.productview .buybox{
  animation-delay:.11s;
}

@media (prefers-reduced-motion: reduce){
  .appview,
  .viewStage,
  .productview,
  .cartview,
  .ordersview,
  .updatesview,
  .adminProductView,
  .productview .dphoto,
  .productview .dinfo,
  .productview .dopts,
  .productview .buybox,
  .cartview .cartPageTitle,
  .cartview .crow,
  .cartview .ctotal,
  .ordersview .title,
  .ordersview .filters,
  .ordersview .orderTile,
  .ordersview .ordercard,
  .updatesview .notifhead,
  .updatesview .notifrow,
  .adminProductView .adminProductCard,
  .adminProductView .field,
  .adminProductView .qsend{
    animation:none!important;
    transition:none!important;
  }
}


/* ===================== VISTE INTERNE — no sheet per prodotto, carrello, aggiornamenti ===================== */
.appview{padding:0 18px 12px;animation:scrIn .3s cubic-bezier(.22,1,.36,1) both}
.viewhead{display:flex;align-items:flex-start;gap:13px;margin:4px 0 16px}
.viewback{width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);display:grid;place-items:center;box-shadow:inset 0 1px 0 var(--hi),0 5px 16px var(--shcol);cursor:pointer;flex:none}
.viewback svg{width:21px;height:21px}
.viewback:active{transform:scale(.985)}
.viewback:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
.vieweyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);margin:0 0 3px}
.viewtitle{margin:0;font-family:'Inter',system-ui,sans-serif;font-size:25px;line-height:1.08;letter-spacing:-.03em;color:var(--text)}
.viewsub{margin:5px 0 0;color:var(--soft);font-size:13.5px;line-height:1.45}
.productview .viewhead{margin-bottom:14px}
.detailview-card{border-radius:30px;border:1px solid var(--detailBorder);background:var(--detailGlass);box-shadow:inset 0 1px 0 var(--hi),0 12px 34px rgba(74,45,28,.12);padding:14px;overflow:hidden}
body.dark .detailview-card{box-shadow:inset 0 1px 0 var(--hi),0 18px 46px rgba(0,0,0,.38)}
.detailview-card .dgrid{margin-top:0}
.cartview-card,.updatesview-card{border-radius:28px;border:1px solid var(--strokeSoft);background:var(--glassDock);box-shadow:var(--elev2);padding:14px 14px 16px;overflow:hidden}
.cartview .cartitems,.updatesview .cartitems{margin-top:4px}
.cartview .cempty,.updatesview .cempty{padding:38px 8px 28px}
.cartview .qsend{width:100%;margin:12px 0 0}
.cartview .cttot{margin:16px 2px 8px}
.cartempty-action{width:100%;margin:4px 0 0;border:1px solid rgba(199,125,107,.22);background:rgba(199,125,107,.08);color:var(--text);font-family:inherit;font-weight:650;padding:13px;border-radius:16px;cursor:pointer}
.updatesview .notifclear{margin-left:auto}
.updatesview .notifrow{background:rgba(246,239,228,.54)}
body.dark .updatesview .notifrow{background:rgba(55,42,34,.62)}
@media(min-width:720px){.appview{padding-left:22px;padding-right:22px}.detailview-card,.cartview-card,.updatesview-card{padding:18px}}


/* Titolo prodotto: più raffinato */
.dttl{font-size:26px;letter-spacing:-.025em;line-height:1.08}

/* Prezzo: meno dominante */
.dprice{font-size:24px;font-weight:700}

/* Pill materiale: più morbida */
.dmat{
  background:rgba(199,125,107,.08);
  border-color:rgba(199,125,107,.18);
  color:var(--soft);
  font-weight:500;
  font-size:12px;
}

/* Label sezione: più elegante */
.dlabel{font-weight:600;letter-spacing:.05em}

/* CTA Aggiungi: materica, warm */
.dadd2{
  background:var(--card);
  border-color:rgba(199,125,107,.22);
  box-shadow:inset 0 1px 0 var(--hi),0 6px 18px var(--shcol);
  -webkit-backdrop-filter:none;backdrop-filter:none;
  font-size:14.5px;letter-spacing:.01em;
  gap:10px;
}
.dadd2:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
body.dark .dadd2{
  background:rgba(55,42,34,.92);
  border-color:rgba(199,125,107,.26);
  color:rgba(246,236,220,.95);
}

/* seg: più caldo in light/dark */
.seg{
  background:rgba(246,239,228,.72);
  border-color:rgba(199,125,107,.14);
  -webkit-backdrop-filter:none;backdrop-filter:none;
}
body.dark .seg{background:rgba(38,29,24,.80);border-color:rgba(199,125,107,.18)}
.seg button{font-size:13px;padding:9px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.seg button.on{
  background:rgba(199,125,107,.12);
  color:var(--accent2);
  box-shadow:inset 0 0 0 1px rgba(199,125,107,.28),0 2px 8px rgba(199,125,107,.10);
}
body.dark .seg button.on{color:var(--accent);background:rgba(199,125,107,.16)}
.seg button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 3px var(--accent)}
/* Struttura interna opzione: nome su riga, prezzo/meta su riga sotto */
.segopt{display:block;line-height:1.2;font-weight:600}
.seg button i{font-style:normal;font-weight:500;font-size:11px;opacity:.6;white-space:nowrap;display:block;line-height:1.2}
.seg button.on i{opacity:.85;color:inherit}

/* Sezione configurazione luce */
.eleccard{
  margin:18px 0 0;
  padding:14px 14px 12px;
  border-radius:18px;
  background:rgba(217,194,163,.12);
  border:1px solid rgba(199,125,107,.14);
  display:flex;flex-direction:column;gap:12px;
}
body.dark .eleccard{background:rgba(90,64,48,.12);border-color:rgba(199,125,107,.18)}
.eleccard-head{display:flex;flex-direction:column;gap:3px}
.eleccard-title{font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--soft)}
.eleccard-sub{font-size:12px;color:var(--soft);opacity:.7}
.elecrow{display:flex;flex-direction:column;gap:6px}
.eleclbl{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--soft)}
.eleclbl svg{opacity:.7;width:17px;height:17px}

/* qstep: controlli quantità più caldi */
.qstep button{
  background:var(--card);
  border-color:rgba(199,125,107,.18);
  box-shadow:inset 0 1px 0 var(--hi);
}
.qstep button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 3px var(--accent)}

/* Reduced motion per drag */
@media(prefers-reduced-motion:reduce){
  .sheetwrap{transition:none!important;transform:none!important}
  .gdot,.dmat,.seg button,.dadd2,.sheetclose{transition:none!important}
}



/* ===================== STRATO VIEWS V2B — transizioni premium senza cambiare canvas =====================
   Nota: niente override di html/body/#root/#appbg.
   Manteniamo il background della versione stabile fullscreen: il rettangolo basso nasceva dal tentativo V2 di ricalcolare il canvas globale. */
.screen.on,
.appview{
  animation:viewIn .36s cubic-bezier(.22,.8,.26,1) both!important;
  transform-origin:50% 16%;
}
@keyframes viewIn{
  from{opacity:0;transform:translateY(10px) scale(.997);filter:blur(2px)}
  70%{filter:blur(0)}
  to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
}
.viewhead{
  margin:6px 0 22px;
  animation:viewHeadIn .42s cubic-bezier(.22,.8,.26,1) .04s both;
}
@keyframes viewHeadIn{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:translateY(0)}
}
.vieweyebrow{letter-spacing:.16em;color:rgba(166,84,53,.78)}
body.dark .vieweyebrow{color:rgba(230,160,121,.78)}
.viewtitle{font-size:clamp(27px,7vw,36px);letter-spacing:-.045em;font-weight:760}
.viewsub{max-width:440px;margin-top:8px;font-size:14px;line-height:1.55;color:var(--soft)}
.viewback{
  width:44px;height:44px;
  background:rgba(246,239,228,.62);
  -webkit-backdrop-filter:blur(18px) saturate(130%);
  backdrop-filter:blur(18px) saturate(130%);
}
body.dark .viewback{background:rgba(47,37,31,.68)}

.productview{padding-top:2px;padding-bottom:24px}
.productview .viewhead{margin-bottom:18px}
.detailview-card{
  border-radius:34px;
  padding:18px;
  background:linear-gradient(180deg,rgba(250,244,236,.68),rgba(238,226,212,.44));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.52),0 16px 42px rgba(74,45,28,.10);
}
body.dark .detailview-card{
  background:linear-gradient(180deg,rgba(52,40,33,.68),rgba(31,24,20,.52));
  box-shadow:inset 0 1px 0 rgba(255,240,220,.10),0 20px 52px rgba(0,0,0,.34);
}
.detailview-card .dgrid{gap:20px}
.productview .dphoto{animation:viewObjectIn .46s cubic-bezier(.22,.8,.26,1) .08s both}
.productview .dopts{animation:viewObjectIn .46s cubic-bezier(.22,.8,.26,1) .14s both}
.productview .dbuy{animation:viewObjectIn .46s cubic-bezier(.22,.8,.26,1) .20s both}
@keyframes viewObjectIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.productview .dimg{border-radius:28px;box-shadow:0 18px 48px rgba(74,45,28,.14)}
body.dark .productview .dimg{box-shadow:0 22px 56px rgba(0,0,0,.42)}
.productview .dttl{font-size:clamp(28px,8vw,38px);letter-spacing:-.045em;line-height:1.02;margin-top:6px}
.productview .dprice{font-size:clamp(23px,6vw,28px);font-weight:720}
.productview .ddesc{font-size:14.5px;line-height:1.68;color:var(--soft)}
.productview .dlabel{margin-top:22px}
.productview .dbuy{align-items:stretch;border-top:1px solid rgba(199,125,107,.12);padding-top:18px;margin-top:2px}
.productview .dbuy .dlabel.dctr{text-align:center;margin-left:0;width:100%}
.productview .dbuy .dqty{justify-content:center}
.productview .dbuy .dadd2{
  max-width:none;
  border-radius:18px;
  padding:15px 16px;
  background:linear-gradient(135deg,rgba(199,125,107,.76),rgba(166,84,53,.82));
  -webkit-backdrop-filter:blur(18px) saturate(155%);
  backdrop-filter:blur(18px) saturate(155%);
  border-color:rgba(255,238,218,.28);
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.34),0 14px 32px rgba(166,84,53,.22);
}
body.dark .productview .dbuy .dadd2{
  background:linear-gradient(135deg,rgba(199,125,107,.68),rgba(166,84,53,.74));
  border-color:rgba(255,238,218,.18);
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,240,220,.14),0 16px 34px rgba(0,0,0,.30);
}
.productview .dbuy .dadd2 svg{stroke:#fff;filter:none}

/* ---- product detail: no secondary hero header; topbar owns navigation ---- */
.productview--clean{padding-top:10px}
.productview--clean .detailview-card{margin-top:0}

.cartview-card,
.updatesview-card{
  border-radius:32px;
  padding:18px;
  background:linear-gradient(180deg,rgba(250,244,236,.70),rgba(239,229,217,.52));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 16px 42px rgba(74,45,28,.10);
  animation:viewObjectIn .44s cubic-bezier(.22,.8,.26,1) .10s both;
}
body.dark .cartview-card,
body.dark .updatesview-card{
  background:linear-gradient(180deg,rgba(52,40,33,.70),rgba(31,24,20,.58));
  box-shadow:inset 0 1px 0 rgba(255,240,220,.10),0 22px 52px rgba(0,0,0,.34);
}
.cartview .crow,
.updatesview .notifrow{
  border-radius:20px;
  background:rgba(252,247,240,.50);
  transition:transform .24s cubic-bezier(.22,.8,.26,1),background .24s ease,border-color .24s ease;
}
body.dark .cartview .crow,
body.dark .updatesview .notifrow{background:rgba(62,47,38,.46)}
.cartview .crow:active,
.updatesview .notifrow:active{transform:scale(.992)}
/* Carrello: header sullo stesso asse di Esplora, Piaciuti e Ordini.
   Tile più editoriale: miniatura centrata, quantità e prezzo sulla stessa linea. */
.cartview .title.cartPageTitle{margin:10px -14px 4px}
.cartPageSub{margin:0 -14px 16px;color:var(--soft);font-size:13.5px;line-height:1.45}
.cartview .cartitems{display:grid;gap:14px}
.cartview .crow.cartrow{
  display:grid;
  grid-template-columns:76px minmax(0,1fr);
  grid-template-rows:auto auto auto;
  align-items:center;
  column-gap:15px;
  row-gap:9px;
  padding:17px;
  margin-bottom:0;
  border-radius:25px;
  min-height:132px;
}
.cartview .crow.cartrow img.cartThumb{
  grid-column:1;
  grid-row:1 / 3;
  justify-self:center;
  align-self:center;
  width:76px;
  height:76px;
  border-radius:19px;
  box-shadow:0 8px 20px rgba(74,45,28,.10);
}
.cartMain{display:contents;min-width:0}
.cartTopLine{grid-column:2;grid-row:1;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;min-width:0}
.cartTextBlock{min-width:0;flex:1;padding-top:1px}
.cartview .cartName{font-size:15.5px;line-height:1.18;letter-spacing:-.01em;padding-right:2px}
.cartColor{margin-top:4px;font-size:12.5px;line-height:1.35;color:var(--soft);font-weight:400}
.cartColor span{font-weight:400;color:var(--soft)}
.cartOptions{grid-column:2;grid-row:2;display:grid;gap:5px;margin-top:1px;min-width:0}
.cartBottomLine{grid-column:1 / -1;grid-row:3;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px;padding-top:2px}
.cartQty{flex:none;margin-top:0;align-self:center;justify-self:start}
.cartview .cartQty button{width:28px;height:28px;border-radius:10px;font-size:16px;background:rgba(246,239,228,.58);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
body.dark .cartview .cartQty button{background:rgba(55,42,34,.58)}
.cartview .cartQty span{min-width:16px;font-size:13px;font-weight:700}
.cartOptionRow{display:flex;align-items:center;gap:7px;color:var(--soft);font-size:12.5px;line-height:1.35}
.cartOptionIcon{width:18px;height:18px;border-radius:9px;display:grid;place-items:center;flex:none;color:rgba(166,84,53,.88);background:rgba(199,125,107,.08);border:1px solid rgba(199,125,107,.12)}
.cartOptionIcon svg{width:13px;height:13px;stroke:currentColor}
.cartOptionDot{width:5px;height:5px;border-radius:50%;background:currentColor;display:block;opacity:.72}
.cartItemPrice{margin-left:auto;color:var(--text);font-size:15.4px;font-weight:540;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
body.dark .cartOptionIcon{color:rgba(224,157,126,.92);background:rgba(199,125,107,.12);border-color:rgba(199,125,107,.16)}
.cartnote{margin:8px 2px 0;color:var(--soft);font-size:13px;line-height:1.45;text-align:center}
.updatesview .cempty{line-height:1.55;color:var(--soft)}
.updatesview .notifhead{margin-bottom:14px}

@media(min-width:560px){
  .productview .dgrid{gap:22px;align-items:start}
  .productview .dbuy{border-top:0;padding-top:0;margin-top:10px}
}
@media(prefers-reduced-motion:reduce){
  .screen.on,.appview,.viewhead,.productview .dphoto,.productview .dopts,.productview .dbuy,.cartview-card,.updatesview-card{animation:none!important;opacity:1!important;transform:none!important;filter:none!important}
  .wrap,.cartview .crow,.updatesview .notifrow{transition:none!important}
}

/* ---- tuning trasparenze principali: +5/6% soft ----
   Alleggerisce solo dock, back topbar e campanella notifiche.
   Non modifica card, sheet, sfondo, fullscreen o altri elementi glass. */
.dock{
  background:rgba(247,243,238,.76);
  -webkit-backdrop-filter:blur(22px) saturate(185%);
  backdrop-filter:blur(22px) saturate(185%);
}
.tb-back,
.tb-btn.bell{
  background:rgba(247,243,238,.77);
  -webkit-backdrop-filter:blur(16px) saturate(160%);
  backdrop-filter:blur(16px) saturate(160%);
}
body.dark .dock{
  background:rgba(45,36,32,.72);
  -webkit-backdrop-filter:blur(22px) saturate(178%);
  backdrop-filter:blur(22px) saturate(178%);
}
body.dark .tb-back,
body.dark .tb-btn.bell{
  background:rgba(45,36,32,.73);
  -webkit-backdrop-filter:blur(16px) saturate(152%);
  backdrop-filter:blur(16px) saturate(152%);
}


/* ===================== HOME HERO ONLY — editorial reveal =====================
   Cambia il gesto della hero: non scivola, si rivela.
   Solo Home, nessuna altra schermata. */
@keyframes homeHeadlineEditorial {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes homeHeroCardEditorial {
  from {
    opacity: .52;
    transform: scale(1.012);
  }
  58% {
    opacity: .92;
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes homeHeroTagEditorial {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.homeview .hero,
.homeScreen .hero{
  animation: homeHeadlineEditorial .82s cubic-bezier(.19,.85,.25,1) .10s both!important;
}

.homeview .herocard,
.homeScreen .herocard{
  animation: homeHeroCardEditorial .92s cubic-bezier(.19,.85,.25,1) .12s both!important;
  transform-origin:center center;
  will-change:opacity, transform;
}

.homeview .herocard .herotag,
.homeScreen .herocard .herotag{
  animation: homeHeroTagEditorial .78s cubic-bezier(.19,.85,.25,1) .28s both!important;
}

.homeview .herocard .lk,
.homeview .herocard .cedit,
.homeScreen .herocard .lk,
.homeScreen .herocard .cedit{
  animation: homeHeroTagEditorial .70s cubic-bezier(.19,.85,.25,1) .34s both!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview .hero,
  .homeScreen .hero,
  .homeview .herocard,
  .homeScreen .herocard,
  .homeview .herocard .herotag,
  .homeScreen .herocard .herotag,
  .homeview .herocard .lk,
  .homeview .herocard .cedit,
  .homeScreen .herocard .lk,
  .homeScreen .herocard .cedit{
    animation:none!important;
    transition:none!important;
  }
}


/* ===================== HOME HERO ONLY — immagine stabile =====================
   Niente zoom e niente fade/opacità sulla card immagine hero.
   Restano solo headline/tag/pulsanti con ingresso morbido. */
.homeview .herocard,
.homeScreen .herocard{
  animation:none!important;
  opacity:1!important;
  transform:none!important;
  will-change:auto!important;
}

.homeview .herocard img,
.homeScreen .herocard img{
  opacity:1!important;
  will-change:auto!important;
}


/* ===================== SCROLL PERFORMANCE — no parallax / no --par =====================
   Mantiene topbar, dock e glass. Rimuove solo movimento legato allo scroll. */
.herocard img{
  transform:scale(1.08)!important;
  transition:none!important;
}

.topscrim{
  opacity:.72!important;
  transition:none!important;
}


/* ===================== HOME ANIMATION — scroll-safe v2 =====================
   Base unica, niente motion layer duplicato.
   La Home non anima più come grande contenitore scrollabile:
   lo scroll resta libero mentre restano micro-ingressi su elementi leggeri. */

.homeview,
.screen.homeview{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
  contain:none!important;
}

/* Struttura e immagine hero sempre stabili: niente zoom, niente fade, niente blur. */
.homeview .herocard{
  opacity:1!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard img{
  opacity:1!important;
  transform:scale(1.08)!important;
  transition:none!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

/* Gli elementi sotto la hero non devono animarsi mentre l'utente può iniziare a scrollare. */
.homeview .grid,
.homeview .grid .card{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}

/* Animazione percepita: solo elementi leggeri e sopra la hero. */
@keyframes homeTextScrollSafeIn{
  from{
    opacity:0;
    transform:translate3d(0,10px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

@keyframes homeSmallScrollSafeIn{
  from{
    opacity:0;
    transform:translate3d(0,8px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

.homeview > .px .hero{
  animation:homeTextScrollSafeIn .86s cubic-bezier(.19,.85,.25,1) .08s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview > .px .homekick{
  animation:homeSmallScrollSafeIn .74s cubic-bezier(.19,.85,.25,1) .16s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard .herotag{
  animation:homeSmallScrollSafeIn .78s cubic-bezier(.19,.85,.25,1) .20s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation:homeSmallScrollSafeIn .70s cubic-bezier(.19,.85,.25,1) .24s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

/* Dopo l'ingresso, non tenere layer inutili vivi. */
.homeview.motionDone .hero,
.homeview.motionDone .homekick,
.homeview.motionDone .herotag,
.homeview.motionDone .lk,
.homeview.motionDone .cedit{
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview > .px .hero,
  .homeview > .px .homekick,
  .homeview .herocard .herotag,
  .homeview .herocard .lk,
  .homeview .herocard .cedit{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME ANIMATION — light restore =====================
   Reintroduce movimento senza rianimare container/griglia/card.
   Scroll-safe: hero card solo translate3d, no fade, no scale, no blur. */
@keyframes homeHeroCardLightIn{
  from{transform:translate3d(0,10px,0)}
  to{transform:translate3d(0,0,0)}
}

@keyframes homeSectionTitleLightIn{
  from{
    opacity:0;
    transform:translate3d(0,8px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

.homeview .herocard{
  animation:homeHeroCardLightIn .82s cubic-bezier(.19,.85,.25,1) .08s both!important;
  opacity:1!important;
  will-change:transform;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
  transform-origin:center center;
}

.homeview .herocard img{
  opacity:1!important;
  transform:scale(1.08)!important;
  transition:none!important;
  will-change:auto!important;
}

.homeview .home-sec-title{
  animation:homeSectionTitleLightIn .68s cubic-bezier(.19,.85,.25,1) .22s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

/* La griglia e le card restano ferme: niente cascata pesante durante lo scroll iniziale. */
.homeview .grid,
.homeview .grid .card{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}

.homeview.motionDone .herocard,
.homeview.motionDone .home-sec-title{
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview .herocard,
  .homeview .home-sec-title{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME TEXT MOTION — smoother v2 =====================
   Solo qualità ingresso testi Home. Nessuna animazione nuova su griglia/card. */
@keyframes homeTextSmoothIn{
  0%{
    opacity:.06;
    transform:translateY(8px);
  }
  48%{
    opacity:.82;
  }
  100%{
    opacity:1;
    transform:translateY(0);
  }
}

@keyframes homeSmallTextSmoothIn{
  0%{
    opacity:.08;
    transform:translateY(7px);
  }
  52%{
    opacity:.84;
  }
  100%{
    opacity:1;
    transform:translateY(0);
  }
}

@keyframes homeSectionTitleSmoothIn{
  0%{
    opacity:.10;
    transform:translateY(7px);
  }
  100%{
    opacity:1;
    transform:translateY(0);
  }
}

.homeview > .px .hero{
  animation:homeTextSmoothIn .94s cubic-bezier(.16,.82,.28,1) .08s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

.homeview > .px .homekick{
  animation:homeSmallTextSmoothIn .82s cubic-bezier(.16,.82,.28,1) .17s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

.homeview .herocard .herotag{
  animation:homeSmallTextSmoothIn .84s cubic-bezier(.16,.82,.28,1) .24s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation:homeSmallTextSmoothIn .76s cubic-bezier(.16,.82,.28,1) .26s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

.homeview .home-sec-title{
  animation:homeSectionTitleSmoothIn .76s cubic-bezier(.16,.82,.28,1) .24s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

/* Mantieni esplicitamente ferme griglia e card prodotto. */
.homeview .grid,
.homeview .grid .card{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview > .px .hero,
  .homeview > .px .homekick,
  .homeview .herocard .herotag,
  .homeview .herocard .lk,
  .homeview .herocard .cedit,
  .homeview .home-sec-title{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME TEXT TIMING — smoother curve =====================
   Solo tempi/easing/movimento/opacità iniziale dei testi Home.
   Nessuna modifica a scroll, struttura, hero image, griglia o card. */
@keyframes homeTextTimingSmoothIn{
  from{
    opacity:.18;
    transform:translate3d(0,6px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

@keyframes homeSmallTextTimingSmoothIn{
  from{
    opacity:.22;
    transform:translate3d(0,5px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

.homeview > .px .hero{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .04s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview > .px .homekick{
  animation:homeSmallTextTimingSmoothIn .92s cubic-bezier(.12,.72,.22,1) .13s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard .herotag{
  animation:homeSmallTextTimingSmoothIn .90s cubic-bezier(.12,.72,.22,1) .19s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation:homeSmallTextTimingSmoothIn .82s cubic-bezier(.12,.72,.22,1) .22s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .home-sec-title{
  animation:homeTextTimingSmoothIn .82s cubic-bezier(.12,.72,.22,1) .26s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

@media (prefers-reduced-motion: reduce){
  .homeview > .px .hero,
  .homeview > .px .homekick,
  .homeview .herocard .herotag,
  .homeview .herocard .lk,
  .homeview .herocard .cedit,
  .homeview .home-sec-title{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME TEXT MOTION — unified on headline =====================
   La headline “Design contemporaneo…” è la base.
   Stesso movimento/tempo/easing per il resto dei testi Home, con soli delay gerarchici. */
.homeview > .px .hero{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .04s both!important;
  will-change:auto!important;
}

.homeview > .px .homekick{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .12s both!important;
  will-change:auto!important;
}

.homeview .herocard .herotag{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .20s both!important;
  will-change:auto!important;
}

.homeview .herocard .herotag .ht,
.homeview .herocard .herotag .hp{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
}

.homeview .home-sec-title{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .28s both!important;
  will-change:auto!important;
}

/* I pulsanti restano leggeri ma seguono la stessa curva, senza diventare protagonisti. */
.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .24s both!important;
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview > .px .hero,
  .homeview > .px .homekick,
  .homeview .herocard .herotag,
  .homeview .home-sec-title,
  .homeview .herocard .lk,
  .homeview .herocard .cedit{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}






/* ===================== HOME GRID WRAP — liked motion model =====================
   Segue il modello reale di Piaciuti:
   wrapper dedicato + .card.in + likedCardIn + stagger.
   Solo le prime 2 card Home si animano; dalla terza in poi restano statiche. */

.home-grid-wrap{
  padding:0 18px;
}

.home-grid-wrap .grid{
  gap:16px;
}

/* Override mirato del blocco statico Home, solo dentro questo wrapper. */
.homeview .home-grid-wrap .grid .card.in{
  animation:likedCardIn .42s cubic-bezier(.22,1,.36,1) both!important;
  opacity:1;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

/* Stagger identico nella logica di Piaciuti, ma limitato alle prime due. */
.homeview .home-grid-wrap .grid .card.in:nth-child(1){
  animation-delay:0ms!important;
}

.homeview .home-grid-wrap .grid .card.in:nth-child(2){
  animation-delay:40ms!important;
}

/* Dalla terza in poi: statiche per preservare scroll fluido. */
.homeview .home-grid-wrap .grid .card.in:nth-child(n+3){
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}

.homeview.motionDone .home-grid-wrap .grid .card.in:nth-child(1),
.homeview.motionDone .home-grid-wrap .grid .card.in:nth-child(2){
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview .home-grid-wrap .grid .card.in{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME MOTION — slower instant timing =====================
   Partenza immediata, durata più distesa.
   Non cambia struttura, scroll, hero image, layout o logiche. */

/* Testi Home: stessa animazione approvata, solo più lenta. */
.homeview > .px .hero{
  animation-duration:1.24s!important;
  animation-delay:0s!important;
}

.homeview > .px .homekick{
  animation-duration:1.16s!important;
  animation-delay:0s!important;
}

.homeview .herocard .herotag{
  animation-duration:1.16s!important;
  animation-delay:0s!important;
}

.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation-duration:1.10s!important;
  animation-delay:0s!important;
}

.homeview .home-sec-title{
  animation-duration:1.12s!important;
  animation-delay:0s!important;
}

/* Prime 2 card Home: modello Piaciuti, ma più disteso. */
.homeview .home-grid-wrap .grid .card.in:nth-child(1){
  animation:likedCardIn .68s cubic-bezier(.22,1,.36,1) 0ms both!important;
}

.homeview .home-grid-wrap .grid .card.in:nth-child(2){
  animation:likedCardIn .72s cubic-bezier(.22,1,.36,1) 40ms both!important;
}

/* Dalla terza in poi resta tutto statico. */
.homeview .home-grid-wrap .grid .card.in:nth-child(n+3){
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}


/* ===================== CARRELLO VUOTO — immagine sotto al sottotitolo =====================
   Stato vuoto come vera pagina: niente altezza residua da sheet, niente scroll fantasma.
   Ordine editoriale: titolo pagina, messaggio, visual ambientale, CTA. */
.cartemptypage{
  --cart-empty-top:calc(62px + env(safe-area-inset-top));
  --cart-empty-bottom:max(132px, calc(80px + env(safe-area-inset-bottom, 24px)));
  height:calc(100svh - var(--cart-empty-top) - var(--cart-empty-bottom));
  min-height:0;
  display:flex;
  flex-direction:column;
  padding-bottom:0!important;
  overflow:hidden;
  overscroll-behavior:none;
}

@supports (height:100dvh){
  .cartemptypage{height:calc(100dvh - var(--cart-empty-top) - var(--cart-empty-bottom))}
}

.cartemptypage .cartPageTitle{
  position:relative;
  z-index:3;
  flex:0 0 auto;
  margin-bottom:2px;
}

.cartEmptyFull{
  position:relative;
  flex:1 1 auto;
  min-height:0;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0 12px 8px;
  overflow:hidden;
  isolation:isolate;
  border-radius:38px;
}

.cartEmptyFull::before{
  content:"";
  position:absolute;
  inset:0 0 6px;
  border-radius:inherit;
  pointer-events:none;
  z-index:0;
  background:
    radial-gradient(circle at 50% 46%, rgba(255,253,248,.30), transparent 44%),
    radial-gradient(circle at 50% 74%, rgba(199,125,107,.075), transparent 64%);
}

.cartEmptyFullContent{
  position:relative;
  z-index:2;
  width:min(100%, 390px);
  min-height:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
  margin:0;
  padding:6px 18px 14px;
}

.cartEmptyFullContent h3{
  margin:0 0 10px;
  color:var(--text);
  font-size:30px;
  line-height:1.06;
  letter-spacing:-.045em;
  font-weight:760;
}

.cartEmptyFullContent p{
  margin:0;
  max-width:278px;
  color:var(--soft);
  font-size:14px;
  line-height:1.5;
}

.cartEmptyFullArt{
  position:relative;
  flex:0 0 auto;
  width:clamp(330px, 104vw, 560px);
  height:clamp(238px, 39svh, 420px);
  max-width:none;
  margin:8px auto 10px;
  pointer-events:none;
  z-index:1;
  opacity:1;
}

.cartEmptyFullArt img{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:contain;
  display:block;
  opacity:.94;
  filter:saturate(.85) contrast(1.02);
  transform:translateZ(0);
  user-select:none;
  -webkit-user-drag:none;
}

.cartEmptyFullArtDark{display:none!important}

.cartEmptyFullCta{
  width:min(100%, 216px);
  min-width:166px;
  height:52px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0 28px;
  margin:0;
  border-radius:999px;
  border:1px solid rgba(199,125,107,.22);
  background:
    linear-gradient(180deg, rgba(199,125,107,.88), rgba(151,103,75,.88)),
    rgba(199,125,107,.22);
  color:#fffaf4;
  font-size:16px;
  font-weight:740;
  letter-spacing:-.015em;
  line-height:1;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 14px 30px rgba(112,72,48,.18);
  opacity:.90;
}

body.dark .cartEmptyFull::before{
  background:
    radial-gradient(circle at 50% 38%, rgba(199,125,107,.105), transparent 44%),
    radial-gradient(circle at 50% 78%, rgba(255,238,218,.04), transparent 64%);
}

body.dark .cartEmptyFullArtLight{display:none!important}
body.dark .cartEmptyFullArtDark{display:block!important}
body.dark .cartEmptyFullArt img{
  opacity:.90;
  filter:saturate(.85) contrast(1.03);
}

body.dark .cartEmptyFullCta{
  border-color:rgba(199,125,107,.28);
  background:
    linear-gradient(180deg, rgba(157,105,73,.76), rgba(108,73,52,.76)),
    rgba(199,125,107,.16);
  color:var(--text);
  box-shadow:inset 0 1px 0 rgba(255,238,218,.11),0 15px 34px rgba(0,0,0,.24);
}

@media(max-height:720px){
  .cartemptypage .cartPageTitle{margin-bottom:0}
  .cartEmptyFull{padding-bottom:4px}
  .cartEmptyFullContent{padding-top:2px;padding-bottom:10px}
  .cartEmptyFullContent h3{font-size:28px;margin-bottom:8px}
  .cartEmptyFullArt{width:clamp(310px, 98vw, 500px);height:clamp(198px, 33svh, 330px);margin:4px auto 8px}
  .cartEmptyFullCta{height:50px}
}

@media(max-width:380px){
  .cartEmptyFull{padding-left:8px;padding-right:8px;border-radius:34px}
  .cartEmptyFullContent{width:min(100%, 328px);padding-left:14px;padding-right:14px}
  .cartEmptyFullContent h3{font-size:27px}
  .cartEmptyFullArt{width:clamp(316px, 102vw, 480px);height:clamp(216px, 37svh, 360px)}
  .cartEmptyFullCta{width:min(100%, 204px);min-width:158px;height:50px;font-size:15.5px}
}

@media(prefers-reduced-motion:reduce){
  .cartEmptyFullArt,.cartEmptyFullArt img{transition:none;transform:none}
}


`;
const GRADS_SVG = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="g_white" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe4e8"/></linearGradient>
<linearGradient id="g_red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A7E"/><stop offset="1" stop-color="#F0231A"/></linearGradient>
<linearGradient id="g_amber" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC066"/><stop offset="1" stop-color="#E8801C"/></linearGradient>
<linearGradient id="g_gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#F2A310"/></linearGradient>
<linearGradient id="g_blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FDBFF"/><stop offset="1" stop-color="#1593EE"/></linearGradient>
<linearGradient id="g_violet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D6B6FF"/><stop offset="1" stop-color="#7C4DE0"/></linearGradient>
<linearGradient id="g_pink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB3D1"/><stop offset="1" stop-color="#E0457E"/></linearGradient>
<linearGradient id="g_teal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FE9D4"/><stop offset="1" stop-color="#0FA68C"/></linearGradient>
<linearGradient id="g_green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE8A6"/><stop offset="1" stop-color="#5BA34D"/></linearGradient>
<linearGradient id="g_clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b29a"/><stop offset="1" stop-color="#8c6856"/></linearGradient>
<linearGradient id="g_home" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#F2A310"/></linearGradient>
<linearGradient id="g_search" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FDBFF"/><stop offset="1" stop-color="#1593EE"/></linearGradient>
<linearGradient id="g_cats" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC066"/><stop offset="1" stop-color="#E8801C"/></linearGradient>
<linearGradient id="g_heartT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A7E"/><stop offset="1" stop-color="#F0231A"/></linearGradient>
<linearGradient id="g_orders" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FE9D4"/><stop offset="1" stop-color="#0FA68C"/></linearGradient></defs></svg>`;

const CART_EMPTY_ART_LIGHT = "data:image/png;base64,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7WeXN158flUgbnLfrijKIIgIIeP1eFWFkzJyXn31qYUG/c9476vGWA8jaP04FyubrIUkmepaSihVNimKoiiKoigjIE+qpDFSu3VjyV6/4iUMMQ/xm4BMsp5JV1eAsFqV2gvPndna3Vum9/TOz5mmT1GKjZBy9uxZtXBSis/a2po5f/68q11v/mVD/hkIdyCxdVNHDxbT+be61SmKoiiKoijjRARRvW6ar7y0bBYXJmnsM3WY89ukvlgCy6q1fvdbz5xpNBsVY+BV9leUokDxEPfxj388Gtc3qMJJGQkkZX19nd/80qcfFvg/Q7JmTZBmYo2XN8927KYsGjBcURRFURRFGSck6J239bozxsyNdVOWqdSYhAkDVq6/zZ23315hUCG864ztqijKdKA4gRy/++KzTwCxAcmov0IVTspIuHTpkjl//rypEp+Edx8QmBpETEeGkKxrXULPe4qiKIqiKIoyQkgKSO41mscQBoHI/Bg4paG6RRKPgyko2kgvdnGJ0Zuvr27evH5KKhWm8bVU8aQoU0JEgjDY29jdfs+/+t1/+18kr45cPxSM+obK/JFknfDnfvyjp156/vKfs0a2RMTut3zo0qIoiqIoiqJMDvHRnTuh0BuYOQpgzfa/adzwqRzxGoOF+l6097WvHg8+/JHGyonj25600G2BokwVkkFgZWFc91cLJ+XIiAhFhP/iX//S3yWjhyjimaxlPdlBFEVRFEVRFGWCCOkbggX35msV02w6yPzJp0Rs5ZQmip58AQhUqxLubrm9N19biYLQivfUvYKiTI8ocub08krtP/2BH74OAOvrT45cAawKJ+VIEBAC8vpX/uCB73nXe37Ue3hB4h6XdadTFEVRFEVRlCkgxrC5sxN6smJtML/iKTHd2FXeIVhZor12pXrnpRfPsFKZlvpLUZQED8pWbXdsnm+qcFKOxsWLRgA67P7F48tLD1pj9gBpnxupX7aiKIqiKIoyLTyBsAJcv+btndtEGMxlwHAgdambct0JWEOPbz1Tqb395oIJQkfn1cxJUaYEIaDH2NyMNYaTcmhIGhFxrz/z2ccbtehPQ2QbYjr7FD0AO50CKoqiKIqiKPONAegdvPfWhnMmk+bploqgazMWgXGy9fpr99j7HrpetbbOJLx5Noi4utspypiJ08l773Hs6aefDoHvHbniSS2clCOwDl68aKOm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";
const CART_EMPTY_ART_DARK = "data:image/png;base64,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";
const ICONS={
    vaso:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M9 3h6l-1 4c1.7 1 2.8 2.8 2.8 5A5.8 5.8 0 1 1 7.2 12c0-2.2 1.1-4 2.8-5z"/>`},
    lampada:{g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M8 3h8l2.4 7.5H5.6z"/><path d="M12 10.5V17"/><path d="M8.6 21h6.8l-1-4H9.6z"/>`},
    scatola:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="m4 7 8 4 8-4"/><path d="M12 11v10"/>`},
    gemma:{g:'g_violet',f:'rgba(124,77,224,.16)',d:`<path d="M7 3h10l4 6-9 12L3 9z"/><path d="M3 9h18"/>`},
    stella:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<path d="M12 3.5 14.6 9l6 .6-4.5 4 1.4 6L12 16.6 6.5 19.6l1.4-6L3.4 9.6 9.4 9z"/>`},
    fulmine:{g:'g_teal',f:'rgba(15,166,140,.16)',d:`<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>`},
    regalo:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13h14v8H5z"/><path d="M12 9v12"/><path d="M12 9C9.5 9 8 4.5 12 4.5 13.7 4.5 13.7 9 12 9z"/>`},
    fiore:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<circle cx="12" cy="6.6" r="2.6"/><circle cx="17.4" cy="10.6" r="2.6"/><circle cx="15.3" cy="16.9" r="2.6"/><circle cx="8.7" cy="16.9" r="2.6"/><circle cx="6.6" cy="10.6" r="2.6"/><circle cx="12" cy="12" r="2.1"/>`},
    tazza:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M5 8h12v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/>`},
    borsa:{g:'g_teal',f:'rgba(15,166,140,.16)',d:`<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>`},
    l_tavolo:{g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M8 3h8l2 7H6z"/><path d="M12 10v7"/><path d="M8.5 21h7l-1-4h-5z"/>`},
    l_sospensione:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M12 2v3"/><path d="M5 12a7 7 0 0 1 14 0z"/><path d="M9.5 12a2.5 2.5 0 0 0 5 0"/>`},
    l_piantana:{g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M8 4h8l1 5H7z"/><path d="M9 9 6.5 21M15 9l2.5 12M12 9v12"/>`},
    l_comodino:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M6.5 11a5.5 5.5 0 0 1 11 0z"/><path d="M9.5 15h5l1 6h-7z"/>`},
    l_lampadina:{g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M9 17a5.5 5.5 0 1 1 6 0 2.5 2.5 0 0 0-1 2v.5h-4V19a2.5 2.5 0 0 0-1-2z"/><path d="M9.7 21.5h4.6"/>`},
    v_classico:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M9 3h6l-1 3.5c1.8 1.2 3 3.2 3 5.5a6 6 0 0 1-12 0c0-2.3 1.2-4.3 3-5.5z"/>`},
    v_ampolla:{g:'g_teal',f:'rgba(15,166,140,.16)',d:`<path d="M10.5 3h3v5a6 6 0 1 1-3 0z"/>`},
    v_tubo:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<path d="M8 6h8v11.5a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 8 17.5z"/><ellipse cx="12" cy="6" rx="4" ry="1.3"/>`},
    v_anfora:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M9.5 5h5l-.5 2.2a5.5 5.5 0 1 1-4 0z"/><path d="M9.3 6.2C6 6.2 6 11.4 10 11.8M14.7 6.2c3.3 0 3.3 5.2-.7 5.6"/>`},
    v_conico:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<path d="M7 5.5h10l-2 13.5h-6z"/><ellipse cx="12" cy="5.5" rx="5" ry="1.2"/>`},
    a_sedia:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<rect x="8" y="3" width="8" height="4.5" rx="1"/><path d="M8 7.5v4.5M16 7.5v4.5"/><path d="M7 12h10"/><path d="M8.5 12v8M15.5 12v8"/>`},
    a_poltrona:{g:'g_violet',f:'rgba(124,77,224,.16)',d:`<path d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5H5z"/><path d="M5 16v3M19 16v3"/><path d="M8 9V7a1.6 1.6 0 0 1 1.6-1.6h4.8A1.6 1.6 0 0 1 16 7v2"/>`},
    a_tavolo:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M3 7.5h18v2H3z"/><path d="M5.5 9.5V20M18.5 9.5V20"/>`},
    a_libreria:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<rect x="4.5" y="3" width="15" height="18" rx="1.6"/><path d="M4.5 9h15M4.5 15h15"/><path d="M8 4.6v3.4M10.5 4.6v3.4M15 15.6v3.8"/>`},
    a_armadio:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<rect x="5.5" y="3" width="13" height="18" rx="1.4"/><path d="M12 3v18"/><path d="M10 10.5v2.5M14 10.5v2.5"/><path d="M7.5 21v1.4M16.5 21v1.4"/>`},
    d_stella:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<path d="M12 3.5 14.6 9l6 .6-4.5 4 1.4 6L12 16.6 6.5 19.6l1.4-6L3.4 9.6 9.4 9z"/>`},
    d_cuore:{g:'g_red',f:'rgba(240,35,26,.16)',d:`<path d="M19 14c1.49-1.46 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>`},
    d_fiocco:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="M9.6 4.2 12 6.1l2.4-1.9M9.6 19.8 12 17.9l2.4 1.9M4.3 9.6 6.7 9l-.6-2.5M19.7 9.6 17.3 9l.6-2.5M4.3 14.4 6.7 15l-.6 2.5M19.7 14.4 17.3 15l.6 2.5"/>`},
    d_fiore:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<circle cx="12" cy="6.6" r="2.6"/><circle cx="17.4" cy="10.6" r="2.6"/><circle cx="15.3" cy="16.9" r="2.6"/><circle cx="8.7" cy="16.9" r="2.6"/><circle cx="6.6" cy="10.6" r="2.6"/><circle cx="12" cy="12" r="2.1"/>`},
    d_cornice:{g:'g_violet',f:'rgba(124,77,224,.16)',d:`<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="m7 16 3.2-3.6 2.3 2.3 2.3-2.8L18 16z"/><circle cx="9" cy="9" r="1.5"/>`},
    c_scatola:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<path d="M4 8h16v11a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19z"/><path d="M4 8 6.2 4h11.6L20 8"/><path d="M12 8v12.5"/>`},
    c_cestino:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M4 9h16l-1.5 10.2a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7z"/><path d="M3.3 9h17.4"/><path d="M8 9a4 4 0 0 1 8 0"/>`},
    c_barattolo:{g:'g_teal',f:'rgba(15,166,140,.16)',d:`<rect x="6" y="8" width="12" height="13" rx="2.5"/><rect x="7.5" y="3.8" width="9" height="4.2" rx="1.3"/><path d="M9 12.5h6"/>`},
    c_portapenne:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M7.5 9h9l-1 11a1.5 1.5 0 0 1-1.5 1.4h-4A1.5 1.5 0 0 1 8.5 20z"/><path d="M11 9 12 3M14.2 9 15.6 3.4"/>`},
    c_ciotola:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 21h6"/>`},

  /* ── OROLOGI ─────────────────────────────────── */
  o_parete:  {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.5 2"/>`},
  o_sveglia: {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<circle cx="12" cy="13" r="7.5"/><path d="M12 10v4l2.5 1.5"/><path d="M6.5 7 5 5.5M17.5 7l1.5-1.5"/><path d="M10 21.5h4"/>`},
  o_clessidra:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M6 3h12M6 21h12M8 3l4 9-4 9M16 3l-4 9 4 9"/>`},
  o_quadrante:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<circle cx="12" cy="12" r="9"/><path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2"/><path d="M12 12l2.5-3.5"/>`},

  /* ── SCRIVANIA ───────────────────────────────── */
  s_scrivania:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M2 14h20v3H2z"/><path d="M5 17v5M19 17v5"/><path d="M5 14v-7h7"/>`},
  s_supporto: {g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M8 4h8a1 1 0 0 1 1 1v11H7V5a1 1 0 0 1 1-1z"/><path d="M7 10h10"/><path d="M9 16v3h6v-3"/>`},
  s_fermacarte:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M5 14l7-11 7 11z"/><path d="M5 14h14"/><path d="M7 14l-1 6h12l-1-6"/>`},
  s_leggio:   {g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M5 5h14v9l-7 3-7-3z"/><path d="M5 14H3v5h18v-5h-2"/><path d="M9 12v5M15 12v5"/>`},

  /* ── PARETE ──────────────────────────────────── */
  p_mensola:  {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M3 11h18v3H3z"/><path d="M6 14v4M18 14v4"/>`},
  p_gancio:   {g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M8 4h8"/><path d="M12 4v7a4 4 0 0 1-4 4H6a2 2 0 0 0 0 4h1"/>`},

  /* ── TAVOLA ──────────────────────────────────── */
  t_vassoio:  {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M4 11h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M2 13h20"/><path d="M4 13h16v2H4z"/>`},
  t_sottopiatto:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<ellipse cx="12" cy="15" rx="9" ry="5"/><ellipse cx="12" cy="15" rx="5.5" ry="3"/>`},

  /* ── STAGIONALI ──────────────────────────────── */
  st_candela: {g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M10 11h4v11H10z"/><path d="M12 8c-1.5 1.5-2 3-1 4.5"/><path d="M12 8c1.5 1.5 2 3 1 4.5"/>`},
  st_albero:  {g:'g_green',f:'rgba(91,163,77,.16)',d:`<path d="M12 2 6 11h5L8 19h4v4h0M12 2l6 9h-5l3 8h-4v4h0"/>`},
  st_ornamento:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<circle cx="12" cy="16" r="6.5"/><path d="M11 9.5h2v3h-2z"/><path d="M10.5 9.5 Q9 7 12 5 Q15 7 13.5 9.5"/>`},

  /* ── ALTRO ───────────────────────────────────── */
  altro_cubo: {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M4 8.5l8-4.5 8 4.5v9l-8 4.5-8-4.5z"/><path d="M4 8.5l8 4.5 8-4.5"/><path d="M12 13v9"/>`},
  altro_sfera:{g:'g_violet',f:'rgba(124,77,224,.16)',d:`<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3 Q5.5 12 12 21"/><path d="M12 3 Q18.5 12 12 21"/>`},
  altro_geo:  {g:'g_teal',f:'rgba(15,166,140,.16)',d:`<path d="M12 3l9 7-3.5 10h-11L3 10z"/>`},
  acc_portachiavi:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<circle cx="10" cy="9" r="5.5"/><circle cx="10" cy="9" r="2.5"/><path d="M14.5 12.5l5 5M16.5 16.5l2-2"/>`},
  acc_stand:  {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M8 4h8v9H8z"/><path d="M6 13h12l-1.5 5H7.5z"/>`}
};
function glassIcon(k, s = 26) {
  const ic = ICONS[k] || ICONS.vaso;
  return `<svg class="gico" width="${s}" height="${s}" viewBox="0 0 24 24" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ic.d}</svg>`;
}

/* coriandoli */
function confetti(el) {
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const cols = ["#BF6B4A", "#D6B89B", "#9C5C43", "#C89C5B", "#D17C56", "#B69A82"];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    const sz = 8 + Math.random() * 7;
    p.style.cssText = "position:fixed;left:" + cx + "px;top:" + cy + "px;width:" + sz + "px;height:" + sz + "px;border-radius:2px;background:" + cols[i % cols.length] + ";z-index:200;pointer-events:none;will-change:transform,opacity";
    document.body.appendChild(p);
    const ang = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 120;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 30;
    const rot = Math.random() * 720 - 360;
    p.animate(
      [{ transform: "translate(-50%,-50%) rotate(0) scale(1)", opacity: 1 },
       { transform: "translate(" + dx + "px," + (dy + 150) + "px) rotate(" + rot + "deg) scale(.5)", opacity: 0 }],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.18,.7,.3,1)" }
    ).onfinish = () => p.remove();
  }
}

const ICON_GROUPS = [
  { t: "Luce",       keys: ["l_tavolo","l_sospensione","l_piantana","l_comodino","l_lampadina"] },
  { t: "Forme",      keys: ["v_classico","v_ampolla","v_tubo","v_anfora","v_conico"] },
  { t: "Tempo",      keys: ["o_parete","o_sveglia","o_clessidra","o_quadrante"] },
  { t: "Arredo",     keys: ["a_sedia","a_poltrona","a_tavolo","a_libreria","a_armadio"] },
  { t: "Contenere",  keys: ["c_scatola","c_cestino","c_barattolo","c_ciotola","c_portapenne"] },
  { t: "Parete",     keys: ["p_mensola","p_gancio","d_cornice","a_libreria"] },
  { t: "Scrivania",  keys: ["s_scrivania","s_supporto","c_portapenne","s_fermacarte","s_leggio"] },
  { t: "Tavola",     keys: ["tazza","t_vassoio","c_ciotola","t_sottopiatto","c_barattolo"] },
  { t: "Decoro",     keys: ["d_fiore","d_cornice","d_stella","d_cuore","d_fiocco"] },
  { t: "Stagionali", keys: ["st_candela","st_albero","st_ornamento","d_fiocco","d_stella"] },
  { t: "Altro",      keys: ["altro_cubo","altro_sfera","altro_geo","acc_portachiavi","acc_stand","fulmine","gemma"] },
];

/* ============================ HELPERS ================================= */
const eur = (n) => (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return "";
  return d.getDate() + " " + MESI[d.getMonth()] + " " + d.getFullYear();
}
function gimg(a, b) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='600' height='600' fill='url(#g)'/><circle cx='300' cy='285' r='150' fill='rgba(255,255,255,.12)'/><circle cx='300' cy='285' r='95' fill='rgba(255,255,255,.10)'/></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function avatarURI(name) {
  const init = ((name || "?").trim()[0] || "?").toUpperCase();
  const cols = ["#1593EE", "#7C4DE0", "#E0457E", "#0FA68C", "#E8801C", "#5BA34D"];
  let h = 0;
  for (const ch of name || "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const c = cols[h % cols.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><circle cx='40' cy='40' r='40' fill='${c}'/><text x='40' y='53' font-family='Arial,sans-serif' font-size='38' font-weight='700' fill='#fff' text-anchor='middle'>${init}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function colImg(c) {
  if (!c) return gimg("#cfc4b4", "#9a8d79");
  return c.img || gimg(c.a, c.b);
}
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 2400;
        let w = img.width, h = img.height;
        if (w >= h && w > max) { h = Math.round((h * max) / w); w = max; }
        else if (h > w && h > max) { w = Math.round((w * max) / h); h = max; }
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        cv.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function mapPrint(r) {
  const cols = (r.print_colors || [])
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((c) => {
      const imgs = (c.images && c.images.length) ? c.images : (c.image_url ? [c.image_url] : []);
      return { id: c.id, name: c.name, a: c.color_a, b: c.color_b, img: imgs[0] || "", imgs };
    });
  if (!cols.length) {
    const img0 = r.images && r.images.length ? r.images[0] : "";
    cols.push({ id: null, name: "Unico", a: "#cfc4b4", b: "#9a8d79", img: img0, imgs: img0 ? [img0] : [] });
  }
  return {
    id: r.id,
    title: r.title,
    price: Number(r.price) || 0,
    material: r.material || "",
    desc: r.description || "",
    likeCount: r.like_count || 0,
    category_id: r.category_id || "",
    isElectrical: !!r.is_electrical,
    addons: { braided: Number(r.addon_braided) || 0, bulb: Number(r.addon_bulb) || 0, holder: Number(r.addon_holder) || 0 },
    allowBraided: r.allow_braided !== false,
    featured: !!r.featured,
    categoryName: r.categories ? r.categories.name : "",
    categoryIcon: r.categories ? r.categories.icon : "v_classico",
    cols,
    createdAt: r.created_at,
  };
}

/* ============================================================
   PWA INSTALL SYSTEM — progressive enhancement
   ============================================================ */
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled]           = useState(false);
  const [platform, setPlatform]             = useState("unknown");

  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || !!navigator.standalone;
    setInstalled(standalone);
    setPlatform(isIOS ? "ios" : "desktop");

    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); setPlatform("android"); };
    const onInstalled = () => { setInstalled(true); setDeferredPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setInstalled(true); setDeferredPrompt(null); }
    return outcome === "accepted";
  }, [deferredPrompt]);

  return { installed, platform, canPrompt: !!deferredPrompt, install };
}

/* PWA: benefit list */
const PWA_BENEFITS = [
  { text: "Accesso immediato dalla Home",      path: "M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" },
  { text: "Esperienza più fluida",              path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { text: "Notifiche e aggiornamenti",          path: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" },
  { text: "I tuoi preferiti sempre con te",     path: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
];

function PWAInstallModal({ onInstall, onLater }) {
  return (
    <div className="pwa-overlay" onClick={(e) => e.target === e.currentTarget && onLater()}>
      <div className="pwa-sheet" role="dialog" aria-modal="true">
        <div className="pwa-pill" />
        <img src="/icon-192.png" alt="Strato" className="pwa-icon" />
        <h2 className="pwa-title">Sempre a portata di mano.</h2>
        <p className="pwa-sub">Installa Strato sulla schermata Home per un'esperienza più rapida, immersiva e progettata per il tuo dispositivo.</p>
        <ul className="pwa-benefits">
          {PWA_BENEFITS.map((b, i) => (
            <li key={i} className="pwa-benefit">
              <span className="pwa-bico"><svg viewBox="0 0 24 24"><path d={b.path}/></svg></span>
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
        <button className="pwa-btn-p" onClick={onInstall}>Aggiungi alla Home</button>
        <button className="pwa-btn-later" onClick={onLater}>Più tardi</button>
      </div>
    </div>
  );
}

function PWAInstallIOSGuide({ onClose }) {
  return (
    <div className="pwa-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pwa-sheet" role="dialog" aria-modal="true">
        <div className="pwa-pill" />
        <img src="/icon-192.png" alt="Strato" className="pwa-icon" />
        <h2 className="pwa-title">Aggiungi Strato alla tua Home.</h2>
        <p className="pwa-sub">Per installare Strato, segui questi semplici passaggi:</p>
        <div className="pwa-steps">
          <div className="pwa-step">
            <div className="pwa-snum">1</div>
            <div className="pwa-stxt">Tocca l'icona
              <svg className="pwa-share-ico" viewBox="0 0 24 24"><path d="M8 12H5a1 1 0 00-1 1v6a1 1 0 001 1h14a1 1 0 001-1v-6a1 1 0 00-1-1h-3"/><polyline points="15 6 12 3 9 6"/><line x1="12" y1="14" x2="12" y2="3"/></svg>
              <strong>Condividi</strong> nella barra di Safari</div>
          </div>
          <div className="pwa-step">
            <div className="pwa-snum">2</div>
            <div className="pwa-stxt">Seleziona <strong>"Aggiungi alla schermata Home"</strong></div>
          </div>
          <div className="pwa-step">
            <div className="pwa-snum">3</div>
            <div className="pwa-stxt">Tocca <strong>Aggiungi</strong> per confermare</div>
          </div>
        </div>
        <button className="pwa-btn-p" onClick={onClose}>Ho capito</button>
      </div>
    </div>
  );
}

function Bg(){return null;}

/* ============================================================
   HAPTIC FEEDBACK — strategia progressiva a 3 livelli
   ============================================================
   Livello 1 — Vibration API (Android Chrome, alcuni browser):
     navigator.vibrate() — pattern discreti per tipo di azione.
     Escluso iOS: Safari/PWA non supportano vibrate(); verrebbe
     ignorato silenziosamente ma non ha senso includerlo.

   Livello 2 — CSS class injection per microanimazione visiva:
     Aggiunge .hap-[type] all'elemento target per 320ms.
     Scale + brightness transitional → sensazione di "risposta".
     Funziona su tutti i dispositivi, incluso iOS Safari e PWA.

   Livello 3 — No-op silenzioso:
     Se nessuna API è disponibile o il contesto non è supportato,
     le interazioni restano perfettamente funzionali senza alcuna
     regressione visiva o comportamento anomalo.

   Rilevamento capabilities a runtime (prima chiamata):
   - iOS Safari / WKWebView / PWA iOS: vibrate non disponibile
     → solo livello 2 (microanimazione CSS)
   - Android Chrome / Edge / Samsung Internet: vibrate disponibile
     → livello 1 + livello 2 in parallelo
   - Desktop: vibrate raramente disponibile
     → solo livello 2 (coerente, non invasivo)
   ============================================================ */

const _hapticCap = (() => {
  let cache = null;
  return () => {
    if (cache !== null) return cache;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const hasVibrate = !isIOS && typeof navigator.vibrate === "function";
    cache = { hasVibrate, isIOS };
    return cache;
  };
})();

/* Durate di vibrazione per tipo di azione [ms] */
const HAPTIC_PATTERNS = {
  like:    [18],          /* feedback leggero, positivo */
  unlike:  [10],          /* più breve, azione di rimozione */
  add:     [12],          /* risposta immediata, azione primaria */
  confirm: [20, 40, 20],  /* doppio impulso: azione critica completata */
  nav:     [8],           /* navigazione: quasi impercettibile */
};

/* CSS keyframes e classi iniettati dinamicamente una sola volta */
const _injectHapticCSS = (() => {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const s = document.createElement("style");
    s.id = "haptic-css";
    s.textContent = [
      "@keyframes hapLike{0%{transform:scale(1)}30%{transform:scale(1.28)}70%{transform:scale(.96)}100%{transform:scale(1)}}",
      "@keyframes hapAdd{0%{transform:scale(1)}40%{transform:scale(.95)}100%{transform:scale(1)}}",
      "@keyframes hapConfirm{0%{transform:scale(1)}25%{transform:scale(.96)}60%{transform:scale(1.03)}100%{transform:scale(1)}}",
      "@keyframes hapNav{0%{transform:scale(1)}35%{transform:scale(.95)}100%{transform:scale(1)}}",
      ".hap-like{animation:hapLike .28s cubic-bezier(.22,1,.36,1) both!important}",
      ".hap-unlike{animation:hapAdd .22s cubic-bezier(.22,1,.36,1) both!important}",
      ".hap-add{animation:hapAdd .24s cubic-bezier(.22,1,.36,1) both!important}",
      ".hap-confirm{animation:hapConfirm .32s cubic-bezier(.22,1,.36,1) both!important}",
      ".hap-nav{animation:hapNav .2s cubic-bezier(.22,1,.36,1) both!important}",
    ].join("");
    document.head.appendChild(s);
  };
})();

/**
 * useHaptic() → { tap }
 * tap(type, element?) — attiva il feedback appropriato.
 *   type: "like" | "unlike" | "add" | "confirm" | "nav"
 *   element: HTMLElement opzionale per microanimazione CSS (livello 2)
 */
function useHaptic() {
  const tap = useCallback((type, element) => {
    _injectHapticCSS();
    const cap = _hapticCap();

    /* Livello 1: Vibration API (Android/desktop supportato) */
    if (cap.hasVibrate) {
      const pattern = HAPTIC_PATTERNS[type] || HAPTIC_PATTERNS.nav;
      try { navigator.vibrate(pattern); } catch (_) { /* silenzio */ }
    }

    /* Livello 2: microanimazione CSS sull'elemento target */
    if (element && element instanceof HTMLElement) {
      const cls = "hap-" + type;
      element.classList.remove(cls);
      /* forza reflow per restart animazione in caso di tap rapidi */
      void element.offsetWidth;
      element.classList.add(cls);
      const tid = setTimeout(() => element.classList.remove(cls), 350);
      return () => clearTimeout(tid);
    }
  }, []);

  return { tap };
}



/* HTML grezzo (icone glass) reso in modo sicuro */
function Raw({ html, className, style }) {
  return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ============================ ICONE LINE (dock/topbar) ================ */
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M3 4h2.2l2.1 11a1.4 1.4 0 0 0 1.4 1.1h7.8a1.4 1.4 0 0 0 1.4-1.1L20 7H6.2" /></svg>
);
const HomeI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" /></svg>);
const SearchI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
const CatsI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1.4" /><rect width="7" height="7" x="14" y="3" rx="1.4" /><rect width="7" height="7" x="14" y="14" rx="1.4" /><rect width="7" height="7" x="3" y="14" rx="1.4" /></svg>);
const HeartI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>);
const OrdersI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h4" /></svg>);

/* ============================ CARD ==================================== */
function Card({ p, liked, onLike, onOpen, onEdit, context }) {
  const c0 = p.cols[0];
  const { tap } = useHaptic();
  const lkRef = useRef(null);
  const isLiked = context === "liked";
  const isHome  = context === "home";
  const quietCnt = isLiked || isHome; // nascondi badge conteggio in Home e Piaciuti
  const ctaLabel = isLiked ? "Scopri" : isHome ? "Scopri" : "Configura";
  const ctaCls   = isLiked ? "liked-configbtn" : "configbtn";
  const handleCardKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }
  };
  return (
    <div
      className={"card in" + (isLiked ? " liked-card" : "")}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKey}
      aria-label={p.title}
    >
      <div className="ph">
        <img src={colImg(c0)} alt={p.title + (p.category ? " · " + p.category : "")} loading="lazy" decoding="async" />
        <button
          ref={lkRef}
          className="lk"
          onClick={(e) => { e.stopPropagation(); tap(liked ? "unlike" : "like", lkRef.current); onLike(p.id); }}
          aria-label={liked ? "Rimuovi dai piaciuti" : "Salva nei piaciuti"}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <span className={"heart" + (liked ? " liked" : "")}><HeartI /></span>
        </button>
        {!quietCnt && <div className="cnt"><HeartI /> {p.likeCount}</div>}
        {onEdit && !isLiked && (
          <button className="cedit" onClick={(e) => { e.stopPropagation(); onEdit(p); }} aria-label="Modifica" onKeyDown={(e) => e.stopPropagation()}><Pencil /></button>
        )}
      </div>
      <div className="cbody">
        <div className="cardcat"><Raw html={glassIcon(p.categoryIcon, 14)} />{p.categoryName}</div>
        <div className="ct">{p.title}</div>
        <div className="mat">{p.material}</div>
        <div className="cp">{eur(p.price)}</div>
        <button
          className={ctaCls}
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          onKeyDown={(e) => e.stopPropagation()}
        >{ctaLabel}</button>
      </div>
    </div>
  );
}

/* ============================ APP ===================================== */
export default function App() {
  const [ready, setReady] = useState(false);
  const { tap } = useHaptic();
  /* PWA install */
  const { installed: pwaInstalled, platform: pwaPlatform, canPrompt: pwaCanPrompt, install: pwaInstall } = usePWAInstall();
  const [pwaModal, setPwaModal]   = useState(null); // null | "main" | "ios"
  const pwaShownRef               = useRef(false);
  const [pushInfo, setPushInfo] = useState({ supported: false, permission: "default", subscribed: false, busy: false });
  const [user, setUser] = useState(null);
  const [prints, setPrints] = useState([]);
  const [cats, setCats] = useState([]);
  const [likes, setLikes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("home");
  const [updatesReturnTab, setUpdatesReturnTab] = useState("home");
  const [orderFocus, setOrderFocus] = useState(null);
  const [notifSeen, setNotifSeen] = useState(() => { try { return JSON.parse(localStorage.getItem("strato_notif_seen") || "[]"); } catch (e) { return []; } });
  const [notifCleared, setNotifCleared] = useState(() => { try { return JSON.parse(localStorage.getItem("strato_notif_cleared") || "[]"); } catch (e) { return []; } });
  const [detailId, setDetailId] = useState(null);
  const [cart, setCart] = useState([]);
  const [authGate, setAuthGate] = useState(null);
  const [invId, setInvId] = useState(null);
  const [orderDone, setOrderDone] = useState(false);
  const [editing, setEditing] = useState(null); // {} nuovo, {id..} modifica, null chiuso
  const [editingCat, setEditingCat] = useState(null);
  const [theme, setTheme] = useState("auto"); // "light" | "dark" | "auto" (dispositivo)
  const [toasts, setToasts] = useState([]);
  const [q, setQ] = useState("");

  const isAdmin = user?.is_admin;
  const toast = (m) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, m }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  /* ---- tema ---- */
  const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const applyTheme = (t) => {
    const dark = t === "dark" || (t === "auto" && mq && mq.matches);
    document.body.classList.toggle("dark", !!dark);

    // Mantiene la status bar mobile nello stesso tono del canvas Strato.
    // Non modifica fullscreen, root, dock o sfondo: aggiorna solo il colore
    // che browser/PWA usano per l'area di sistema sopra la WebView.
    const statusColor = dark ? "#312720" : "#eadccf";
    document.documentElement.style.backgroundColor = statusColor;
    document.body.style.backgroundColor = statusColor;
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute("content", statusColor);
  };

  /* ---- scroll lock: quando uno sheet è aperto blocca lo scroll del body ---- */
  const anySheetOpen = !!editingCat;
  useEffect(() => {
    if (!anySheetOpen) return;
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("sheet-open");
    body.classList.add("sheet-open");
    // Blocca touchmove sul backdrop; lascia scrollare solo .ipick .sheet.
    const onTouchMove = (e) => {
      if (e.target.closest(".ipick .sheet")) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      html.classList.remove("sheet-open");
      body.classList.remove("sheet-open");
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [anySheetOpen]);

  const syncBackstop = () => {
    try {
      // Sfondo definitivo Strato: nessuna personalizzazione admin, nessuna immagine custom.
      // #appbg è un layer fisso CSS; html/body restano coerenti con le variabili tema.
      document.documentElement.style.removeProperty("background");
      document.body.style.removeProperty("background");
      document.body.style.removeProperty("background-image");
      let bg = document.getElementById("appbg");
      if (!bg) {
        bg = document.createElement("div");
        bg.id = "appbg";
        bg.setAttribute("aria-hidden", "true");
        document.body.insertBefore(bg, document.body.firstChild);
      }
      bg.removeAttribute("style");
      const r = document.getElementById("root");
      if (r) { r.style.position = "relative"; r.style.zIndex = "1"; }
    } catch (e) {}
  };

  useEffect(() => { applyTheme(theme); syncBackstop(); }, [theme]);
  useEffect(() => { document.body.removeAttribute("data-bg"); }, []);
  // Disabilita lo zoom (pinch su iOS, ctrl+rotella e ctrl +/- su desktop, doppio tap).
  useEffect(() => {
    const noGesture = (e) => e.preventDefault();
    const noWheelZoom = (e) => { if (e.ctrlKey) e.preventDefault(); };
    const noKeyZoom = (e) => { if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault(); };
    let lastTouch = 0;
    const noDblTap = (e) => { const now = Date.now(); if (now - lastTouch < 320) e.preventDefault(); lastTouch = now; };
    document.addEventListener("gesturestart", noGesture);
    document.addEventListener("gesturechange", noGesture);
    document.addEventListener("gestureend", noGesture);
    window.addEventListener("wheel", noWheelZoom, { passive: false });
    window.addEventListener("keydown", noKeyZoom);
    document.addEventListener("touchend", noDblTap, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", noGesture);
      document.removeEventListener("gesturechange", noGesture);
      document.removeEventListener("gestureend", noGesture);
      window.removeEventListener("wheel", noWheelZoom);
      window.removeEventListener("keydown", noKeyZoom);
      document.removeEventListener("touchend", noDblTap);
    };
  }, []);

  // Effetto morbido a molla quando si arriva a battuta (sopra o sotto) scrollando.
  // Trasla solo <main.wrap>: dock, topbar e sfondo (#appbg) restano fermi.
  // Risolve <main.wrap> in modo lazy: puo' montare dopo (boot/login iniziale).
  useEffect(() => {
    const MAX = 72;
    let offset = 0, raf = null, settleTO = null;
    const getWrap = () => document.querySelector("main.wrap");
    const atTop = () => window.scrollY <= 0;
    const atBottom = () => Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1;
    const apply = () => { const w = getWrap(); if (w) w.style.transform = offset ? "translateY(" + offset.toFixed(1) + "px)" : ""; };
    const spring = () => {
      offset *= 0.82;
      if (Math.abs(offset) < 0.4) { offset = 0; apply(); raf = null; return; }
      apply();
      raf = requestAnimationFrame(spring);
    };
    const release = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(spring); };
    const resist = (add) => {
      const next = offset + add;
      const r = 1 - Math.min(Math.abs(next) / (MAX * 2.2), 0.86);
      offset = Math.max(-MAX, Math.min(MAX, offset + add * r));
    };
    const onWheel = (e) => {
      if (e.ctrlKey) return;
      const dy = e.deltaY;
      if ((atTop() && dy < 0) || (atBottom() && dy > 0)) {
        resist(-dy * 0.32);
        apply();
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        clearTimeout(settleTO);
        settleTO = setTimeout(release, 70);
      } else if (offset) { release(); }
    };
    // Solo desktop (rotella): su mobile lo scroll resta nativo (momentum + rimbalzo iOS).
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(settleTO);
      const w = getWrap(); if (w) w.style.transform = "";
    };
  }, []);
  useEffect(() => {
    if (!mq) return;
    const h = () => { if (theme === "auto") { applyTheme("auto"); syncBackstop(); } };
    mq.addEventListener && mq.addEventListener("change", h);
    return () => { mq.removeEventListener && mq.removeEventListener("change", h); };
  }, [theme]);

  /* ---- carrello locale ---- */
  useEffect(() => {
    try { const s = localStorage.getItem("strato_cart"); if (s) setCart(JSON.parse(s) || []); } catch (e) {}
  }, []);
  const saveCart = (c) => { setCart(c); try { localStorage.setItem("strato_cart", JSON.stringify(c)); } catch (e) {} };
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);

  /* ---- caricamento dati ---- */
  const loadPrints = async () => {
    const { data } = await supabase
      .from("prints")
      .select("*, print_colors(*), categories(name,icon)")
      .order("created_at", { ascending: false });
    setPrints((data || []).map(mapPrint));
  };
  const loadCats = async () => {
    const { data } = await supabase.from("categories").select("*").order("position", { ascending: true });
    setCats(data || []);
  };
  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, prints(material))")
      .order("created_at", { ascending: false });
    setOrders((data || []).map((o) => ({
      id: o.id, user_id: o.user_id, who: o.customer_name || "Cliente", avatar: o.customer_avatar || "",
      status: o.status, total: Number(o.total) || 0, date: o.created_at,
      items: (o.order_items || []).map((it) => ({
        t: it.title, col: it.color_name, material: it.prints?.material || "", base: Number(it.base_price) || 0,
        adds: it.adds || [], opt: it.opt || "", price: Number(it.unit_price) || 0,
        qty: it.qty || 1, img: it.image_url || "",
      })),
    })));
  };

  const bootstrap = async (session) => {
    await Promise.all([loadPrints(), loadCats()]);
    if (!session) { setUser(null); setLikes([]); setOrders([]); return; }
    const au = session.user;
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", au.id).maybeSingle();
    if (prof?.pref_theme) setTheme(prof.pref_theme);
    const meta = au.user_metadata || {};
    setUser({
      id: au.id,
      name: prof?.full_name || meta.full_name || meta.name || (au.email ? au.email.split("@")[0] : "Utente"),
      avatar: prof?.avatar_url || meta.avatar_url || meta.picture || "",
      is_admin: !!prof?.is_admin,
    });
    const { data: l } = await supabase.from("likes").select("print_id").eq("user_id", au.id);
    setLikes((l || []).map((r) => r.print_id));
    await loadOrders();
  };

  useEffect(() => {
    let sub;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await bootstrap(session);
      setReady(true);
      const { data } = supabase.auth.onAuthStateChange((_e, sess) => { bootstrap(sess); });
      sub = data.subscription;
    })();
    return () => { sub && sub.unsubscribe(); };
  }, []);

  /* Mostra la PWA install modal una sola volta, dopo il primo login */
  useEffect(() => {
    if (!user) return;
    if (pwaInstalled) return;
    if (pwaShownRef.current) return;
    if (localStorage.getItem("pwa-install-dismissed") === "1") return;
    pwaShownRef.current = true;
    const t = setTimeout(() => setPwaModal("main"), 1400);
    return () => clearTimeout(t);
  }, [user, pwaInstalled]);


  const refreshPushInfo = useCallback(async () => {
    const st = await checkPushStatus();
    setPushInfo((prev) => ({ ...prev, ...st }));
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshPushInfo();
  }, [user, pwaInstalled, refreshPushInfo]);

  // Deep-link dalle notifiche: ?tab=orders[&order=...] apre la sezione ordini.
  useEffect(() => {
    if (!user) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      const o = params.get("order");
      if (t === "orders") { setTab("orders"); if (o) setOrderFocus(o); }
      if (t || o) window.history.replaceState({}, "", window.location.pathname);
    } catch (_) {}
  }, [user]);

  const togglePush = async () => {
    if (!user || pushInfo.busy) return;
    // Permesso negato: nessun tentativo (la card mostra lo stato bloccato).
    if (pushInfo.permission === "denied") return;
    // Attivazione su iOS richiede la PWA installata: apriamo la guida con garbo.
    if (!pushInfo.subscribed && pwaPlatform === "ios" && !pwaInstalled) {
      setPwaModal("ios");
      return;
    }
    setPushInfo((prev) => ({ ...prev, busy: true }));
    try {
      if (pushInfo.subscribed) {
        await disablePushNotifications(supabase, user.id);
        setPushInfo({ supported: true, permission: Notification.permission, subscribed: false, busy: false });
      } else {
        await enablePushNotifications(supabase, user.id);
        setPushInfo({ supported: true, permission: "granted", subscribed: true, busy: false });
      }
    } catch (e) {
      console.warn("Push toggle error", e);
      await refreshPushInfo();
      setPushInfo((prev) => ({ ...prev, busy: false }));
      toast("Non è stato possibile aggiornare le notifiche.");
    }
  };

  // parallax + scrim su scroll
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const sy = window.scrollY || 0;
      // Scroll performance: rimosso update continuo di --par per mantenere 120Hz fluido.
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [tab, detailId]);

  const changeColorPhoto = async (printId, colorId, file) => {
    if (!file) return;
    try {
      const blob = await compressImage(file);
      const path = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".jpg";
      const up = await supabase.storage.from("prints").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const url = supabase.storage.from("prints").getPublicUrl(path).data.publicUrl;
      const pr = prints.find((p) => p.id === printId);
      const col = pr && pr.cols.find((c) => c.id === colorId);
      const cur = col && col.imgs ? col.imgs.slice(0, 5) : [];
      const next = [...cur, url].slice(0, 5);
      await supabase.from("print_colors").update({ images: next, image_url: next[0] }).eq("id", colorId);
      await loadPrints();
      toast("Foto aggiunta");
    } catch (e) { toast("Errore upload foto"); }
  };

  const loginGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };
  const logout = async () => { await supabase.auth.signOut(); setTab("home"); };

  const savePrefs = async (patch) => {
    if (!user) return;
    await supabase.from("profiles").update(patch).eq("id", user.id);
  };
  const pickTheme = (t) => { setTheme(t); savePrefs({ pref_theme: t }); };

  const toggleLike = async (id) => {
    if (!user) { setAuthGate("per salvare i preferiti"); return; }
    const liked = likes.includes(id);
    setLikes(liked ? likes.filter((x) => x !== id) : [...likes, id]);
    setPrints((prev) => prev.map((p) => p.id === id ? { ...p, likeCount: Math.max(0, p.likeCount + (liked ? -1 : 1)) } : p));
    if (liked) await supabase.from("likes").delete().eq("user_id", user.id).eq("print_id", id);
    else await supabase.from("likes").insert({ user_id: user.id, print_id: id });
  };

  /* ---- carrello ---- */
  const addToCart = (line) => {
    tap("add");
    const ex = cart.find((x) => x.key === line.key);
    let next;
    if (ex) next = cart.map((x) => x.key === line.key ? { ...x, qty: x.qty + line.qty } : x);
    else next = [...cart, line];
    saveCart(next);
    toast(line.t + " ×" + line.qty + " nel carrello");
  };
  const cartStep = (i, d) => {
    const next = cart.map((c, j) => j === i ? { ...c, qty: c.qty + d } : c).filter((c) => c.qty > 0);
    saveCart(next);
  };
  const placeOrder = async () => {
    if (!user) { setAuthGate("per inviare la richiesta d'ordine"); return; }
    if (!cart.length) return;
    const { data: ord, error } = await supabase.from("orders").insert({
      user_id: user.id, customer_name: user.name, customer_avatar: user.avatar || "",
      status: "pending", total: cartTotal,
    }).select().single();
    if (error) { toast("Errore invio ordine"); return; }
    const rows = cart.map((c) => ({
      order_id: ord.id, print_id: c.pid || null, title: c.t, color_name: c.col,
      base_price: c.base, adds: c.adds || [], opt: c.opt || "", unit_price: c.price, qty: c.qty, image_url: c.img || "",
    }));
    const { error: e2 } = await supabase.from("order_items").insert(rows);
    if (e2) { toast("Errore righe ordine"); return; }
    // Notifica agli admin (non blocca la UX se fallisce).
    try {
      supabase.functions
        .invoke("push-notify", { body: { type: "new_order", order_id: ord.id } })
        .then(({ error }) => { if (error) console.warn("new_order push", error); })
        .catch((err) => console.warn("new_order push", err));
    } catch (err) { console.warn("new_order push", err); }
    tap("confirm");
    saveCart([]);
    await loadOrders();
    setTab("orders");
    setOrderDone(true);
  };
  const setOrderStatus = async (id, status) => {
    const order = orders.find((o) => o.id === id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast("Errore aggiornamento"); return; }

    if (order?.user_id && (status === "confirmed" || status === "rejected" || status === "completed")) {
      try {
        const { data: pushData, error: pushError } = await supabase.functions.invoke("push-notify", {
          body: { type: "order_status", order_id: id, status },
        });
        // La function risponde 200 anche quando non recapita nulla: leggiamo sent/total
        // per non lasciare invisibile un fallimento di consegna.
        if (pushError) {
          console.warn("Push notify error", pushError);
          let detail = "";
          try {
            if (pushError.context && typeof pushError.context.json === "function") {
              const b = await pushError.context.json();
              if (b && b.error) detail = String(b.error);
            }
          } catch (_) {}
          if (!detail) detail = pushError.message || "errore funzione";
          toast("Notifica non inviata: " + detail);
        } else if (pushData && typeof pushData.sent === "number") {
          if (pushData.total === 0) toast("Notifica: nessun dispositivo iscritto per l'utente");
          else if (pushData.sent < pushData.total) toast("Notifica rifiutata dal push server — controlla le chiavi VAPID");
        }
      } catch (_) {
        // La push non deve mai bloccare il flusso admin o l'aggiornamento ordine.
      }
    }

    await loadOrders();
    toast(status === "confirmed" ? "Ordine confermato" : (status === "completed" ? "Ordine completato" : "Richiesta rifiutata"));
  };

  const deleteOrder = async (id) => {
    const r1 = await supabase.from("order_items").delete().eq("order_id", id);
    if (r1.error) { toast("Errore: " + r1.error.message); return false; }
    const { data, error } = await supabase.from("orders").delete().eq("id", id).select("id");
    if (error) { toast("Errore: " + error.message); return false; }
    if (!data || data.length === 0) { toast("Eliminazione bloccata: manca una policy DELETE per gli admin (RLS)."); return false; }
    await loadOrders();
    toast("Ordine eliminato");
    return true;
  };

  /* ---- navigazione ---- */
  const open = (t) => {
    if ((t === "orders" || t === "profile" || t === "liked") && !user) { setAuthGate(t === "orders" ? "per vedere i tuoi ordini" : (t === "liked" ? "per vedere i tuoi preferiti" : "per accedere al profilo")); return; }
    setDetailId(null); setInvId(null); setEditing(null); setTab(t); window.scrollTo(0, 0);
  };

  const allNotifs = orders
    .filter((o) => isAdmin ? o.status === "pending" : (o.status === "confirmed" || o.status === "completed" || o.status === "rejected"))
    .slice()
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .map((o) => ({
      id: o.id, status: o.status, date: o.date,
      title: isAdmin ? "Nuova richiesta" : (o.status === "completed" ? "Ordine completato" : (o.status === "confirmed" ? "Ordine confermato" : "Ordine non accettato")),
      body: (o.items[0] ? o.items[0].t : "Ordine") + " · " + eur(o.total) + (isAdmin ? " · " + o.who : ""),
    }));
  const notifSig = (n) => n.id + ":" + n.status;
  const notifs = allNotifs.filter((n) => !notifCleared.includes(notifSig(n)));
  const unread = notifs.filter((n) => !notifSeen.includes(notifSig(n))).length;
  const markNotifsSeen = () => { const all = notifs.map(notifSig); setNotifSeen((prev) => { const m = [...new Set([...prev, ...all])]; try { localStorage.setItem("strato_notif_seen", JSON.stringify(m)); } catch (e) {} return m; }); };
  const clearNotifs = () => { const sigs = notifs.map(notifSig); setNotifCleared((prev) => { const m = [...new Set([...prev, ...sigs])]; try { localStorage.setItem("strato_notif_cleared", JSON.stringify(m)); } catch (e) {} return m; }); };
  const openNotifs = () => { setUpdatesReturnTab(tab === "updates" ? "home" : tab); setDetailId(null); setInvId(null); setTab("updates"); markNotifsSeen(); window.scrollTo(0, 0); };
  const onNotifClick = (id) => { setDetailId(null); setTab("orders"); setOrderFocus(id); window.scrollTo(0, 0); };
  const openDetail = (id) => { setInvId(null); setDetailId(id); window.scrollTo(0, 0); };
  const byId = (id) => prints.find((p) => p.id === id);

  if (!ready) {
    return (<><style>{CSS}</style><Bg /><Raw html={GRADS_SVG} /><div className="boot">Strato…</div></>);
  }

  const adminEdit = isAdmin ? (prod) => { setDetailId(null); setInvId(null); setEditing(prod); } : undefined;
  const deletePrint = async (id) => {
    try {
      await supabase.from("print_colors").delete().eq("print_id", id);
      const { error } = await supabase.from("prints").delete().eq("id", id);
      if (error) throw error;
      await Promise.all([loadPrints(), loadCats()]);
      setEditing(null); setDetailId(null);
      toast("Prodotto eliminato");
    } catch (e) { toast("Errore eliminazione"); }
  };
  const saveCategory = async (data) => {
    try {
      if (editingCat && editingCat.id) await supabase.from("categories").update(data).eq("id", editingCat.id);
      else await supabase.from("categories").insert({ ...data, position: cats.length });
      await loadCats(); setEditingCat(null); toast("Categoria salvata");
    } catch (e) { toast("Errore categoria"); }
  };
  const deleteCategory = async (id) => {
    try {
      await supabase.from("categories").delete().eq("id", id);
      await loadCats(); setEditingCat(null); toast("Categoria eliminata");
    } catch (e) { toast("Errore eliminazione"); }
  };
  const liked = (id) => likes.includes(id);
  const detail = detailId ? byId(detailId) : null;
  const inv = invId ? orders.find((o) => o.id === invId) : null;

  return (
    <>
      <style>{CSS}</style>
      <Bg />
      <Raw html={GRADS_SVG} />

      <div className="topscrim" aria-hidden="true" />
      <header className="topbar">
        {(detailId || inv || editing)
          ? <button className="tb-btn left tb-back" onClick={() => detailId ? setDetailId(null) : (inv ? setInvId(null) : setEditing(null))} aria-label="Torna indietro"><ChevronLeft /></button>
          : <div className="tb-spacer" />}
        <div className="brand2"><span className="mk"><Box /></span>Strato</div>
        <div className="tb-right">
          {user && (
            <button className="tb-btn bell" onClick={openNotifs} aria-label="Notifiche">
              <Bell />{unread > 0 && <span className="softdot belldot" />}
            </button>
          )}
          {user ? (
            <button className="tb-btn right" onClick={() => open("profile")} aria-label="Profilo">
              <img className="av" src={user.avatar || avatarURI(user.name)} alt={"Profilo di " + user.name} />
            </button>
          ) : (
            <button className="tb-btn right tb-login" onClick={() => setAuthGate("per continuare")} aria-label="Accedi"><User /></button>
          )}
        </div>
      </header>

      <main className="wrap">
        {editing ? (
          <AdminProduct
            editing={editing.id ? editing : null} cats={cats}
            onClose={() => setEditing(null)}
            onSaved={async () => { await Promise.all([loadPrints(), loadCats()]); setEditing(null); toast("Salvato"); }}
            onDelete={deletePrint}
            user={user} toast={toast}
          />
        ) : detail ? (
          <Detail
            key={detail.id} p={detail} cats={cats} prints={prints}
            onClose={() => setDetailId(null)} onOpen={openDetail}
            onAdd={addToCart} isAdmin={isAdmin} onEdit={adminEdit} onColorPhoto={changeColorPhoto}
            onSaveAddons={async (patch) => { await supabase.from("prints").update(patch).eq("id", detail.id); await loadPrints(); toast("Prezzi aggiornati"); }}
          />
        ) : (
          <>
            {tab === "home" && (
              <Home prints={prints} liked={liked} onLike={toggleLike} onOpen={openDetail} onEdit={adminEdit} />
            )}
            {tab === "search" && (
              <Screen title="Esplora" icon={<SearchI />} action={isAdmin ? <button className="tb-back addnew" onClick={() => setEditingCat({})} aria-label="Nuova categoria"><Plus /></button> : null}>
                <input className="searchbox" placeholder="Cerca per nome, materiale, categoria…" value={q} onChange={(e) => setQ(e.target.value)} />
                {!q.trim() && (
                  <>
                    <h3 className="osec">Categorie</h3>
                    {cats.length === 0 && <p className="empty">Nessuna categoria.{isAdmin ? " Tocca + per aggiungerne." : ""}</p>}
                    <div className="catgrid">
                      {cats.map((c) => (
                        <button key={c.id} className="cat glass" onClick={() => setQ(c.name)}>
                          {isAdmin && <span className="cedit catedit2" onClick={(e) => { e.stopPropagation(); setEditingCat(c); }}><Pencil /></span>}
                          <span className="ci"><Raw html={glassIcon(c.icon, 50)} /></span>
                          <span className="catn">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {q.trim() && (
                  <>
                    <Grid>
                      {prints.filter((p) => matchQ(p, q)).map((p) => (
                        <Card key={p.id} p={p} liked={liked(p.id)} onLike={toggleLike} onOpen={() => openDetail(p.id)} onEdit={adminEdit} />
                      ))}
                    </Grid>
                    {prints.filter((p) => matchQ(p, q)).length === 0 && <p className="empty">Nessun risultato.</p>}
                  </>
                )}
              </Screen>
            )}
            {tab === "liked" && (
              <Liked likedPrints={prints.filter((p) => liked(p.id))} onOpen={openDetail} onLike={toggleLike} onEdit={adminEdit} />
            )}
            {tab === "cart" && (
              <CartView cart={cart} total={cartTotal} onStep={cartStep} onConfirm={placeOrder} onGoExplore={() => open("search")} />
            )}
            {tab === "orders" && (
              inv ? (
                <OrderDetailView o={inv} isAdmin={isAdmin} onDelete={async (id) => { const ok = await deleteOrder(id); if (ok) setInvId(null); }} />
              ) : (
                <OrdersTab orders={orders} isAdmin={isAdmin} onOpenOrder={(id) => { setInvId(id); window.scrollTo(0, 0); }}
                  onConfirm={(id) => setOrderStatus(id, "confirmed")} onReject={(id) => setOrderStatus(id, "rejected")} onComplete={(id) => setOrderStatus(id, "completed")}
                  onDelete={deleteOrder}
                  orderFocus={orderFocus} clearFocus={() => setOrderFocus(null)}
                  onGoExplore={() => open("search")} />
              )
            )}
            {tab === "updates" && (
              <UpdatesView notifs={notifs} onItemClick={onNotifClick} onClear={clearNotifs} isAdmin={isAdmin} />
            )}
            {tab === "profile" && user && (
              <Profile user={user} theme={theme} onTheme={pickTheme} onLogout={logout}
                isAdmin={isAdmin} onNewProduct={() => setEditing({})}
                likedPrints={prints.filter((p) => liked(p.id))} onOpenProduct={openDetail} onLike={toggleLike} onEditProduct={adminEdit}
                pwaInstalled={pwaInstalled} onPWAInstall={() => setPwaModal("main")}
                pushSupported={pushInfo.supported} pushPermission={pushInfo.permission}
                pushSubscribed={pushInfo.subscribed} pushBusy={pushInfo.busy}
                onTogglePush={togglePush} />
            )}
          </>
        )}
      </main>
      {/* DOCK */}
      <div className="dockwrap">
        <div className="dock dock5">
          <button className={"dnav home" + (tab === "home" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("home"); }} aria-label="Home"><HomeI /></button>
          <button className={"dnav search" + (tab === "search" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("search"); }} aria-label="Esplora"><SearchI /></button>
          <button className={"dnav liked" + (tab === "liked" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("liked"); }} aria-label="Piaciuti"><HeartI /></button>
          <button className={"dnav cart" + (tab === "cart" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("cart"); }} aria-label={cartCount > 0 ? "Carrello con articoli" : "Carrello"}><CartIcon />{cartCount > 0 && <span className="softdot cartdot" />}</button>
          <button className={"dnav orders" + (tab === "orders" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("orders"); }} aria-label="I miei ordini"><OrdersI />{orders.some((o) => o.status === "pending") && isAdmin && <span className="orddot" />}</button>
        </div>
      </div>

      {orderDone && <OrderDoneModal onDone={() => setOrderDone(false)} />}

      {authGate && <AuthGate reason={authGate} onGoogle={loginGoogle} onClose={() => setAuthGate(null)} />}

      {/* PWA install modals */}
      {pwaModal === "main" && (
        <PWAInstallModal
          onInstall={async () => {
            if (pwaPlatform === "ios") { setPwaModal("ios"); return; }
            const ok = await pwaInstall();
            if (ok || !pwaCanPrompt) { setPwaModal(null); localStorage.setItem("pwa-install-dismissed","1"); }
            else setPwaModal(null);
          }}
          onLater={() => { setPwaModal(null); localStorage.setItem("pwa-install-dismissed","1"); }}
        />
      )}
      {pwaModal === "ios" && (
        <PWAInstallIOSGuide
          onClose={() => { setPwaModal(null); localStorage.setItem("pwa-install-dismissed","1"); }}
        />
      )}


      {editingCat && (
        <CategoryEditor cat={editingCat.id ? editingCat : null} onClose={() => setEditingCat(null)} onSave={saveCategory} onDelete={deleteCategory} />
      )}

      <div id="toast">{toasts.map((t) => <div className="tt" key={t.id}>{t.m}</div>)}</div>
    </>
  );
}

function matchQ(p, q) {
  if (!q) return true;
  const s = (p.title + " " + p.material + " " + p.categoryName).toLowerCase();
  return s.includes(q.toLowerCase());
}

function Box() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>);
}

/* ============================ SCHERMATE ============================== */
function Screen({ title, icon, children, heart, action }) {
  return (
    <section className="screen on">
      <div className="titlerow px">
        <h2 className="title">{icon && <span className={"ticon" + (heart ? " heartred" : "")}>{icon}</span>}{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function Grid({ children }) { return <div className="grid">{children}</div>; }

function Home({ prints, liked, onLike, onOpen, onEdit }) {
  const homeRef = useRef(null);
  // Una sola tile in evidenza: articolo casuale, nuovo ad ogni refresh del sito.
  const hero = useMemo(() => (prints.length ? prints[Math.floor(Math.random() * prints.length)] : null), [prints.length]);
  const { tap } = useHaptic();
  const heroLkRef = useRef(null);
  useEffect(() => {
    const el = homeRef.current;
    if (!el) return;
    el.classList.remove("motionDone");
    const t = window.setTimeout(() => el.classList.add("motionDone"), 1150);
    return () => window.clearTimeout(t);
  }, [hero?.id]);
  return (
    <section ref={homeRef} className="screen on homeview">
      <div className="px">
        <h1 className="hero">Design contemporaneo, plasmato strato dopo strato.</h1>
        <div className="kick homekick">A COLPO D'OCCHIO</div>
      </div>
      {hero && (
        <div className="herocard" key={hero.id} onClick={() => onOpen(hero.id)}>
          <img src={colImg(hero.cols[0])} alt={hero.title} loading="eager" fetchPriority="high" decoding="async" />
          <button ref={heroLkRef} className="lk" onClick={(e) => { e.stopPropagation(); tap(liked(hero.id) ? "unlike" : "like", heroLkRef.current); onLike(hero.id); }} aria-label={liked(hero.id) ? "Rimuovi dai piaciuti" : "Salva nei piaciuti"}>
            <span className={"heart" + (liked(hero.id) ? " liked" : "")}><HeartI /></span>
          </button>
          <div className="herotag"><div className="ht">{hero.title}</div><div className="hp">{eur(hero.price)}</div></div>
          {onEdit && <button className="cedit hero" onClick={(e) => { e.stopPropagation(); onEdit(hero); }} aria-label="Modifica"><Pencil /></button>}
        </div>
      )}
      <h2 className="title px home-sec-title">Lasciati ispirare</h2>
      {prints.length === 0 && <p className="empty">Nessun prodotto ancora.</p>}
      <div className="home-grid-wrap">
        <Grid>
          {prints.map((p) => <Card key={p.id} p={p} liked={liked(p.id)} onLike={onLike} onOpen={() => onOpen(p.id)} onEdit={onEdit} context="home" />)}
        </Grid>
      </div>
    </section>
  );
}

/* ---- Icone opzioni lampada (inline, solo per la scheda dettaglio) ---- */
/* Stile identico a IcoBulb: strokeWidth 2, round caps, fill none, viewBox 0 0 24 24, 17px */
const IcoCable  = () => (
  /* 3 archi quadratici consecutivi = filo arricciato, stesso arco della dome IcoBulb */
  <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 17 Q5.5 7 9 17 Q12.5 7 16 17 Q19.5 7 23 17"/>
  </svg>
);
const IcoBulb   = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14a5 5 0 1 0-6 0"/><path d="M9 18h6M10 21h4"/>
  </svg>
);
const IcoHolder = () => (
  /* Cupola bezier (come dome lampadina) + corpo rettangolare = portalampada E27 */
  <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 17 Q12 5 18 17 V21 H6 Z"/>
  </svg>
);

/* ---- Hook drag-to-close (touch) per tutti gli sheet ---- */
// dir: "down" per sheet dal basso (Carrello, Dettaglio, Ordine)
//      "up"   per sheet dall'alto (Notifiche)
function useDragToClose(doClose, dir = "down") {
  const wrapRef  = useRef(null);
  const sheetRef = useRef(null); // ref all'elemento scrollabile interno
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;

    let startY = 0, dy = 0, active = false, startT = 0;

    // Controlla se lo scroll interno ha raggiunto il bordo corretto per avviare il drag.
    const atBoundary = () => {
      const s = sheetRef.current;
      if (!s) return true;
      if (dir === "down") return s.scrollTop <= 2;
      // "up": alla fine dello scroll
      return s.scrollTop + s.clientHeight >= s.scrollHeight - 8;
    };

    // Non parte da elementi interattivi (bottoni, input, ecc.).
    const isInteractive = (t) =>
      !!t.closest("button,input,select,textarea,[role=button],[role=radio],[role=option]");

    const onStart = (e) => {
      if (!atBoundary() || isInteractive(e.target)) return;
      startY = e.touches[0].clientY;
      dy = 0; active = true; startT = Date.now();
    };

    const onMove = (e) => {
      if (!active) return;
      const raw = e.touches[0].clientY - startY;
      // Cancella il drag se l'utente si muove nella direzione opposta
      if (dir === "down" && raw <= 0) { active = false; return; }
      if (dir === "up"   && raw >= 0) { active = false; return; }
      dy = Math.abs(raw);
      if (dy > 4) {
        // Blocca lo scroll nativo del browser durante il drag
        // (richiede passive:false sull'addEventListener)
        e.preventDefault();
        const tx = dir === "down" ? dy : -dy;
        wrap.style.transform  = `translateY(${tx}px)`;
        wrap.style.transition = "none";
      }
    };

    const onEnd = () => {
      if (!active) return;
      active = false;
      const vel = dy / Math.max(1, Date.now() - startT);
      if (dy > 90 || vel > 0.45) {
        // Sopra soglia: anima via e chiudi
        const tx = dir === "down" ? "100vh" : "-100vh";
        wrap.style.transform  = `translateY(${tx})`;
        wrap.style.transition = "transform .26s ease";
        doClose();
      } else {
        // Sotto soglia: rimbalzo morbido a zero
        wrap.style.transform  = "translateY(0)";
        wrap.style.transition = "transform .3s cubic-bezier(.2,.8,.2,1)";
        setTimeout(() => { if (wrap) { wrap.style.transform = ""; wrap.style.transition = ""; } }, 320);
      }
    };

    wrap.addEventListener("touchstart",  onStart, { passive: true });
    wrap.addEventListener("touchmove",   onMove,  { passive: false }); // non-passive: serve preventDefault
    wrap.addEventListener("touchend",    onEnd);
    wrap.addEventListener("touchcancel", onEnd);
    return () => {
      wrap.removeEventListener("touchstart",  onStart);
      wrap.removeEventListener("touchmove",   onMove);
      wrap.removeEventListener("touchend",    onEnd);
      wrap.removeEventListener("touchcancel", onEnd);
    };
  }, [doClose, dir]);
  return { wrapRef, sheetRef };
}

/* ---- DETTAGLIO ---- */
function Detail({ p, prints, onClose, onOpen, onAdd, isAdmin, onSaveAddons, onEdit, onColorPhoto }) {
  const [ci, setCi] = useState(0);
  const [qty, setQty] = useState(1);
  const [cable, setCable] = useState("Normale");
  const photoInput = useRef(null);
  const galleryRef = useRef(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  useEffect(() => { const onKey = (e) => { if (e.key === "Escape") doClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  const [bulb, setBulb] = useState(0);
  const [holder, setHolder] = useState(0);
  const [editP, setEditP] = useState(false);
  const [ad, setAd] = useState(p.addons);

  const c = p.cols[ci] || p.cols[0];
  const photoList = (c.imgs && c.imgs.length ? c.imgs : [colImg(c)]);

  useEffect(() => {
    setPhotoIndex(0);
    const node = galleryRef.current;
    if (node) node.scrollTo({ left: 0, behavior: "auto" });
  }, [ci, p.id]);

  const onGalleryScroll = (e) => {
    const el = e.currentTarget;
    const next = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    const clamped = Math.max(0, Math.min(photoList.length - 1, next));
    if (clamped !== photoIndex) setPhotoIndex(clamped);
  };

  const goPhoto = (idx) => {
    setPhotoIndex(idx);
    const node = galleryRef.current;
    if (node) node.scrollTo({ left: idx * node.clientWidth, behavior: "smooth" });
  };

  const adds = [];
  if (p.isElectrical) {
    if (cable === "Intrecciato") adds.push({ label: "Cavo in tessuto", amt: Number(ad.braided) || 0 });
    if (bulb) adds.push({ label: "Lampadina", amt: Number(ad.bulb) || 0 });
    if (holder) adds.push({ label: "Portalampada premium", amt: Number(ad.holder) || 0 });
  }
  const unit = p.price + adds.reduce((s, x) => s + x.amt, 0);
  const cableText = cable === "Intrecciato" ? "in tessuto" : "standard";
  const optLabel = p.isElectrical
    ? "Cavo " + cableText + " · " + (bulb ? "Con lampadina" : "Senza lampadina") + " · " + (holder ? "Portalampada premium" : "Portalampada standard")
    : "";

  const doAdd = (e) => {
    if (e && e.currentTarget) confetti(e.currentTarget);
    onAdd({
      key: p.id + "|" + (c.id || c.name || "unico") + (optLabel ? "|" + optLabel : ""),
      pid: p.id, t: p.title, col: c.name || "", opt: optLabel, base: p.price, adds, price: unit,
      qty, img: c.img || "",
    });
  };
  const saveAddons = () => { onSaveAddons({ addon_braided: Number(ad.braided) || 0, addon_bulb: Number(ad.bulb) || 0, addon_holder: Number(ad.holder) || 0 }); setEditP(false); };

  return (
    <section className="screen on appview productview productview--clean" aria-label={"Scheda prodotto: " + p.title}>
      <div className="detailview-card detailsheet">
        {isAdmin && onEdit && <button className="dedit detailedit" onClick={() => onEdit(p)} aria-label="Modifica prodotto"><Pencil /></button>}
        <div className="dgrid">
          <div className="dphoto">
            <div className="dgallery" ref={galleryRef} onScroll={onGalleryScroll}>
              {photoList.map((src, gi) => (
                <img key={gi} className="dimg" src={src || colImg(c)} alt={p.title} />
              ))}
            </div>
            {photoList.length > 1 && (
              <div className="gdots" aria-label="Selettore foto">
                {photoList.map((_, gi) => (
                  <button
                    key={gi}
                    type="button"
                    className={"gdot" + (gi === photoIndex ? " gdot--on" : "")}
                    onClick={() => goPhoto(gi)}
                    aria-label={"Mostra foto " + (gi + 1)}
                    aria-current={gi === photoIndex ? "true" : undefined}
                  />
                ))}
              </div>
            )}
            {isAdmin && onColorPhoto && (
              <>
                <button className="dphotobtn" onClick={() => photoInput.current && photoInput.current.click()} aria-label="Aggiungi foto colore"><Camera /></button>
                <input ref={photoInput} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { onColorPhoto(p.id, c.id, e.target.files[0]); e.target.value = ""; }} />
              </>
            )}
          </div>
          <div className="dopts">
            {p.categoryName && <div className="dkick">{p.categoryName}</div>}
            <div className="dttl">{p.title}</div>
            <div className="dpricerow">
              <span className="dprice">{eur(p.price)}</span>
              {p.material && <span className="dmat">{p.material}</span>}
            </div>
            {p.desc && <p className="ddesc">{p.desc}</p>}

            {/* Colore */}
            <div className="dlabel dcolor">Colore</div>
            <div className="dswatches readonly" role="list">
              {p.cols.map((cc, k) => (
                <div key={k} className="dswbox ro" role="listitem" aria-label={cc.name}>
                  <span className="dsw" style={{ background: "linear-gradient(135deg," + cc.a + " 0%," + cc.a + " 50%," + cc.b + " 50%," + cc.b + " 100%)" }} />
                  <span className="dswn">{cc.name}</span>
                </div>
              ))}
            </div>

            {/* Configurazione luce (solo prodotti elettrici) */}
            {p.isElectrical && (
              <div className="eleccard">
                <div className="eleccard-head">
                  <span className="eleccard-title">Configurazione luce</span>
                  <span className="eleccard-sub">Scegli i dettagli.</span>
                </div>

                <div className="elecrow">
                  <span className="eleclbl"><IcoCable /> Cavo</span>
                  <div className="seg" role="group" aria-label="Tipo cavo">
                    <button
                      className={cable === "Normale" ? "on" : ""}
                      onClick={() => setCable("Normale")}
                      aria-pressed={cable === "Normale"}
                      aria-label="Cavo standard incluso"
                    ><span className="segopt">Standard</span><i>incluso</i></button>
                    {p.allowBraided && (
                      <button
                        className={cable === "Intrecciato" ? "on" : ""}
                        onClick={() => setCable("Intrecciato")}
                        aria-pressed={cable === "Intrecciato"}
                        aria-label={"Cavo in tessuto, più " + eur(ad.braided)}
                      ><span className="segopt">In tessuto</span><i>+{eur(ad.braided)}</i></button>
                    )}
                  </div>
                </div>

                <div className="elecrow">
                  <span className="eleclbl"><IcoHolder /> Portalampada</span>
                  <div className="seg" role="group" aria-label="Portalampada">
                    <button className={!holder ? "on" : ""} onClick={() => setHolder(0)} aria-pressed={!holder} aria-label="Portalampada standard incluso"><span className="segopt">Standard</span><i>incluso</i></button>
                    <button className={holder ? "on" : ""} onClick={() => setHolder(1)} aria-pressed={!!holder} aria-label={"Portalampada premium, più " + eur(ad.holder)}><span className="segopt">Premium</span><i>+{eur(ad.holder)}</i></button>
                  </div>
                </div>

                <div className="elecrow">
                  <span className="eleclbl"><IcoBulb /> Lampadina</span>
                  <div className="seg" role="group" aria-label="Lampadina">
                    <button className={!bulb ? "on" : ""} onClick={() => setBulb(0)} aria-pressed={!bulb} aria-label="Senza lampadina"><span className="segopt">Senza</span></button>
                    <button className={bulb ? "on" : ""} onClick={() => setBulb(1)} aria-pressed={!!bulb} aria-label={"Con lampadina, più " + eur(ad.bulb)}><span className="segopt">Con lampadina</span><i>+{eur(ad.bulb)}</i></button>
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <button className="elecedit" onClick={() => setEditP(!editP)}>✎ Prezzi aggiunte</button>
                    {editP && (
                      <div className="elecprices">
                        <div className="epp"><span>Cavo in tessuto</span><span className="eur"><input type="number" min="0" step="0.5" value={ad.braided} onChange={(e) => setAd({ ...ad, braided: e.target.value })} /> €</span></div>
                        <div className="epp"><span>Lampadina</span><span className="eur"><input type="number" min="0" step="0.5" value={ad.bulb} onChange={(e) => setAd({ ...ad, bulb: e.target.value })} /> €</span></div>
                        <div className="epp"><span>Portalampada premium</span><span className="eur"><input type="number" min="0" step="0.5" value={ad.holder} onChange={(e) => setAd({ ...ad, holder: e.target.value })} /> €</span></div>
                        <button className="saveaddons" onClick={saveAddons}>Salva prezzi</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quantità e CTA */}
          <div className="dbuy">
            <div className="dlabel dctr">Quantità</div>
            <div className="qstep dqty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuisci quantità">−</button>
              <span aria-live="polite" aria-label={"Quantità: " + qty}>{qty}</span>
              <button onClick={() => setQty(Math.min(99, qty + 1))} aria-label="Aumenta quantità">+</button>
            </div>
            <button
              className="dadd2"
              onClick={doAdd}
              aria-label={"Aggiungi al carrello, totale " + eur(unit * qty).replace(",", " virgola").replace("€", "euro")}
            >
              <CartIcon /> Aggiungi — {eur(unit * qty)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- CARRELLO ---- */

function CartView({ cart, total, onStep, onConfirm, onGoExplore }) {
  const cartOptionKind = (label) => {
    const l = String(label || "").toLowerCase();
    if (l.includes("cavo")) return "cable";
    if (l.includes("lampadina")) return "bulb";
    if (l.includes("portalampada")) return "holder";
    return "addon";
  };
  const cartOptionLabel = (label) => {
    const raw = String(label || "").trim();
    const l = raw.toLowerCase();
    if (!raw) return "";
    if (l.includes("cavo in tessuto") || l.includes("cavo intrecciato")) return "Cavo in tessuto - incluso";
    if (l.includes("cavo normale") || l.includes("cavo standard")) return "Cavo standard - incluso";
    if (l.includes("portalampada premium") || l.includes("con portalampada") || l === "portalampada") return "Portalampada premium - incluso";
    if (l.includes("portalampada standard") || l.includes("senza portalampada")) return "Portalampada standard - incluso";
    if (l.includes("con lampadina") || l === "lampadina") return "Con lampadina";
    if (l.includes("senza lampadina")) return "Senza lampadina";
    if (l.startsWith("cavo ")) return "Cavo " + raw.slice(5) + " - incluso";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };
  const cartOptionIcon = (kind) => {
    if (kind === "cable") return <IcoCable />;
    if (kind === "bulb") return <IcoBulb />;
    if (kind === "holder") return <IcoHolder />;
    return <span className="cartOptionDot" aria-hidden="true" />;
  };
  const cartOptionRows = (c) => {
    const fromOpt = String(c.opt || "")
      .split("·")
      .map((x) => x.trim())
      .filter(Boolean);
    if (fromOpt.length) return fromOpt.map((label) => ({ label: cartOptionLabel(label), kind: cartOptionKind(label) })).filter((x) => x.label);
    return (c.adds || []).map((a) => ({ label: cartOptionLabel(a.label), kind: cartOptionKind(a.label) })).filter((x) => x.label);
  };
  if (cart.length === 0) {
    return (
      <section className="screen on appview cartview cartemptypage" aria-label="Carrello vuoto">
        <h2 className="title px cartPageTitle"><span className="ticon"><CartIcon /></span>Carrello</h2>
        <div className="cartEmptyFull">
          <div className="cartEmptyFullContent">
            <h3>Il carrello è vuoto.</h3>
            <p>Quando sceglierai un oggetto, lo ritroverai qui.</p>
            <div className="cartEmptyFullArt" aria-hidden="true">
              <img className="cartEmptyFullArtImg cartEmptyFullArtLight" src={CART_EMPTY_ART_LIGHT} alt="" decoding="async" draggable="false" />
              <img className="cartEmptyFullArtImg cartEmptyFullArtDark" src={CART_EMPTY_ART_DARK} alt="" decoding="async" draggable="false" />
            </div>
            <button className="cartempty-action cartEmptyFullCta" onClick={onGoExplore}>Esplora</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen on appview cartview" aria-label="Carrello">
      <h2 className="title px cartPageTitle"><span className="ticon"><CartIcon /></span>Carrello</h2>
      <p className="cartPageSub px">Controlla i dettagli della tua scelta.</p>
      <div className="cartview-card">
        <div className="cartitems">
          {cart.length === 0 && (
            <>
              <div className="cempty">Gli oggetti scelti appariranno qui.</div>
              <button className="cartempty-action" onClick={onGoExplore}>Esplora gli oggetti</button>
            </>
          )}
          {cart.map((c, i) => {
            const opts = cartOptionRows(c);
            return (
              <div className="crow cartrow" key={c.key}>
                <img className="cartThumb" src={c.img || gimg(c.a || "#cfc4b4", c.b || "#9a8d79")} alt="" />
                <div className="cartMain">
                  <div className="cartTopLine">
                    <div className="cartTextBlock">
                      <div className="cn cartName">{c.t}</div>
                      {c.col && <div className="cartColor">Colore: <span>{c.col}</span></div>}
                    </div>
                  </div>
                  {opts.length > 0 && (
                    <div className="cartOptions" aria-label="Aggiunte e configurazione">
                      {opts.map((opt, k) => (
                        <div className="cartOptionRow" key={k}>
                          <span className="cartOptionIcon">{cartOptionIcon(opt.kind)}</span>
                          <span>{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="cartBottomLine">
                    <div className="qstep csmall cartQty"><button onClick={() => onStep(i, -1)} aria-label="Diminuisci">−</button><span>{c.qty}</span><button onClick={() => onStep(i, 1)} aria-label="Aumenta">+</button></div>
                    <div className="cartItemPrice">{eur(c.price * c.qty)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cttot"><span>Totale</span><span>{eur(total)}</span></div>
        {cart.length > 0 && <>
          <p className="cartnote">Prepareremo il tuo oggetto con cura.</p>
          <button className="qsend" onClick={onConfirm}><Check /> Invia richiesta</button>
        </>}
      </div>
    </section>
  );
}

function CartSheet({ cart, total, onClose, onStep, onConfirm }) {
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  useEffect(() => { const onKey = (e) => { if (e.key === "Escape") doClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  const { wrapRef, sheetRef } = useDragToClose(doClose);
  return (
    <div className={"ipick on" + (closing ? " closing" : "")} role="dialog" aria-modal="true" aria-label="Carrello" onClick={(e) => { if (e.target.classList.contains("ipick") || e.target.classList.contains("sheetwrap")) doClose(); }}>
      <div className="sheetwrap" ref={wrapRef}>
        <button className="sheetclose" onClick={doClose} aria-label="Chiudi carrello"><ChevronDown /></button>
        <div className="sheet" ref={sheetRef}>
          <h4><CartIcon /> Carrello</h4>
          <div className="cartitems">
            {cart.length === 0 && <div className="cempty">Il carrello è vuoto.</div>}
            {cart.map((c, i) => (
              <div className="crow" key={c.key}>
                <img src={c.img || gimg(c.a || "#cfc4b4", c.b || "#9a8d79")} alt="" />
                <div className="cinfo">
                  <div className="cn">{c.t}</div>
                  <div className="cp">{c.col}{c.opt ? " · " + c.opt : ""}</div>
                  <div className="cprice">{eur(c.price)} · tot {eur(c.price * c.qty)}</div>
                </div>
                <div className="qstep csmall"><button onClick={() => onStep(i, -1)} aria-label="Diminuisci">−</button><span>{c.qty}</span><button onClick={() => onStep(i, 1)} aria-label="Aumenta">+</button></div>
              </div>
            ))}
          </div>
          <div className="cttot"><span>Totale</span><span>{eur(total)}</span></div>
          {cart.length > 0 && <button className="qsend" onClick={onConfirm}><Check /> Conferma ordine</button>}
        </div>
      </div>
    </div>
  );
}

/* ---- ORDINI ---- */
function OrdersScreen({ orders, isAdmin, onOpen, onConfirm, onReject }) {
  const pend = orders.filter((o) => o.status === "pending");
  const done = orders.filter((o) => o.status === "confirmed");
  const oTitle = (o) => o.items.length > 1 ? o.items.length + " articoli" : (o.items[0] ? o.items[0].t : "Ordine");
  return (
    <section className="screen on">
      <h2 className="title px"><span className="ticon"><OrdersI /></span>Ordini</h2>
      {pend.length > 0 && <h3 className="osec">In attesa</h3>}
      {pend.map((o) => (
        <div className="banner glass" key={o.id}>
          {isAdmin && <img className="bnav" src={o.avatar || avatarURI(o.who)} alt="" />}
          <div className="txt" onClick={() => onOpen(o.id)} style={{ cursor: "pointer" }}>
            <b>{isAdmin ? "Nuova richiesta" : "La tua richiesta"}</b> · {oTitle(o)} · {eur(o.total)}{isAdmin ? " da " + o.who : ""}<br />
            <span style={{ color: "var(--soft)", fontSize: "12.5px" }}>Tocca per il dettaglio{isAdmin ? " · conferma per avvisare il cliente" : ""}</span>
          </div>
          <span className="badge bp">Inviato</span>
          {isAdmin && <button className="btnY" onClick={() => onConfirm(o.id)}>Conferma</button>}
          {isAdmin && <button className="btnN" onClick={() => onReject(o.id)}>Rifiuta</button>}
        </div>
      ))}
      <h3 className="osec">Effettuati</h3>
      {done.length === 0 && <p className="empty">Nessun ordine effettuato.</p>}
      {done.map((o) => (
        <div className="ord glass" key={o.id} onClick={() => onOpen(o.id)}>
          <img src={o.items[0] ? (o.items[0].img || gimg("#cfc4b4", "#9a8d79")) : gimg("#cfc4b4", "#9a8d79")} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{oTitle(o)}</div>
            <div className="s">{isAdmin ? o.who + " · " : ""}{eur(o.total)}{o.date ? " · " + fmtDate(o.date) : ""}</div>
          </div>
          <span className="badge bc">Confermato</span>
        </div>
      ))}
    </section>
  );
}

/* ---- RIEPILOGO ORDINE ---- */
function OrderDoneModal({ onDone }) {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setClosing(true), 3600);
    const t2 = setTimeout(onDone, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className={"odone" + (closing ? " out" : "")} role="dialog" aria-modal="true" aria-label="Ordine inviato" onClick={() => { setClosing(true); setTimeout(onDone, 380); }}>
      <div className="odcard">
        <div className="odicon"><Check /></div>
        <div className="odt">Ordine inviato</div>
        <div className="ods">Il tuo acquisto è in attesa di conferma. Ti avviseremo appena verrà accettato.</div>
      </div>
    </div>
  );
}

function AuthGate({ reason, onGoogle, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="odone" role="dialog" aria-modal="true" aria-label="Accedi per continuare" onClick={(e) => { if (e.target.classList.contains("odone")) onClose(); }}>
      <div className="odcard authcard">
        <div className="odicon"><User /></div>
        <div className="odt">Accedi per continuare</div>
        <div className="ods">Ti serve un account {reason}. Bastano pochi secondi.</div>
        <button className="gbtn authgbtn" onClick={onGoogle}><GoogleIcon /> Continua con Google</button>
        <button className="authlater" onClick={onClose}>Più tardi</button>
      </div>
    </div>
  );
}

function OrderDetailView({ o, isAdmin, onDelete }) {
  const STATUS_META = {
    confirmed: { label: "Confermato", cls: "ostat--confirmed", note: "Ordine confermato." },
    pending:   { label: "Inviato", cls: "ostat--pending", note: "in attesa di conferma." },
    completed: { label: "Completato", cls: "ostat--completed", note: "Il tuo ordine è pronto!" },
    rejected:  { label: "Non accettato", cls: "ostat--rejected", note: "Questa richiesta non può essere confermata in questo momento." },
  };
  const st = STATUS_META[o.status] || STATUS_META.pending;
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const customerName = o.who || "Cliente";
  const dateLine = o.date ? fmtDate(o.date).replace(/ /g, "/") : "Dettaglio della richiesta";
  const optionKind = (label) => {
    const l = String(label || "").toLowerCase();
    if (l.includes("cavo")) return "cable";
    if (l.includes("lampadina")) return "bulb";
    if (l.includes("portalampada")) return "holder";
    return "addon";
  };
  const optionLabel = (label) => {
    const raw = String(label || "").trim();
    const l = raw.toLowerCase();
    if (!raw) return "";
    if (l.includes("senza lampadina")) return "Senza lampadina";
    if (l.includes("con lampadina") || l === "lampadina") return "Con lampadina";
    if (l.includes("senza portalampada")) return "Portalampada standard - incluso";
    if (l.includes("con portalampada")) return "Portalampada premium - incluso";
    if (l.includes("portalampada premium") || l === "portalampada") return "Portalampada premium - incluso";
    if (l.includes("portalampada standard")) return "Portalampada standard - incluso";
    if (l.includes("cavo normale") || l.includes("cavo standard")) return "Cavo standard - incluso";
    if (l.includes("cavo in tessuto") || l.includes("cavo intrecciato")) return "Cavo in tessuto - incluso";
    if (l.startsWith("cavo ")) return "Cavo " + raw.slice(5) + " - incluso";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };
  const optionIcon = (kind) => {
    if (kind === "cable") return <IcoCable />;
    if (kind === "bulb") return <IcoBulb />;
    if (kind === "holder") return <IcoHolder />;
    return <span className="orderOptionDot" aria-hidden="true" />;
  };
  const optionRows = (it) => {
    const fromOpt = String(it.opt || "")
      .split("·")
      .map((x) => x.trim())
      .filter(Boolean);
    if (fromOpt.length) return fromOpt.map((label) => ({ label: optionLabel(label), kind: optionKind(label) }));
    return (it.adds || []).map((a) => ({ label: optionLabel(a.label), kind: optionKind(a.label) })).filter((x) => x.label);
  };
  return (
    <section className="screen on orderDetailPage">
      <div className="orderDetailHero px">
        <h2 className="orderDetailTitle">Dettaglio ordine</h2>
      </div>
      <div className="orderDetailCard glass inv">
        <div className="orderDetailHead">
          <div className="orderDetailIdentity">
            {isAdmin && <img className="invav" src={o.avatar || avatarURI(customerName)} alt="" />}
            <div className="orderDetailIdentityText">
              <div className="orderDetailName">{customerName}</div>
              <div className="orderDetailDate">{dateLine}</div>
            </div>
          </div>
          <div className="orderDetailStatus"><span className={"ostat " + st.cls}>{st.label}</span></div>
        </div>
        <div className="invitems">
          {o.items.map((it, i) => {
            const material = it.material || "";
            const color = it.col || "";
            const opts = optionRows(it);
            return (
              <div className="orderDetailItem" key={i}>
                <div className="orderDetailItemTop">
                  <img className="orderDetailThumb" src={it.img || gimg("#cfc4b4", "#9a8d79")} alt="" />
                  <div className="orderDetailProduct">
                    <div className="orderDetailProductLine">
                      <b className="orderDetailProductName">{it.t}</b>
                      <span className="orderDetailQty">×{it.qty}</span>
                    </div>
                    {(material || color) && (
                      <div className="orderDetailProductMeta">
                        {material && <span>{material}</span>}
                        {color && <span>Colore: <strong>{color}</strong></span>}
                      </div>
                    )}
                    {opts.length > 0 && (
                      <div className="orderDetailOptions" aria-label="Aggiunte e configurazione">
                        {opts.map((opt, k) => (
                          <div className="orderOptionRow" key={k}>
                            <span className="orderOptionIcon">{optionIcon(opt.kind)}</span>
                            <span>{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="orderDetailItemPrice">{eur(it.price * it.qty)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cttot invtotrow"><span>Totale</span><span className="invtot">{eur(o.total)}</span></div>
      </div>
      {isAdmin && onDelete && (
        <div className={"orderDanger" + (deleteConfirm ? " confirming" : "")}>
          {!deleteConfirm ? (
            <button type="button" className="orderDangerBtn" onClick={() => setDeleteConfirm(true)}>Elimina ordine</button>
          ) : (
            <div className="orderDangerConfirm">
              <div>
                <b>Eliminare definitivamente?</b>
                <span>Questa azione non può essere annullata.</span>
              </div>
              <div className="orderDangerActions">
                <button type="button" className="orderDangerCancel" onClick={() => setDeleteConfirm(false)}>Annulla</button>
                <button type="button" className="orderDangerDelete" onClick={() => onDelete(o.id)}>Elimina</button>
              </div>
            </div>
          )}
        </div>
      )}
      {!isAdmin && <p className="orderDetailNote">{st.note}</p>}
    </section>
  );
}

/* ---- PIACIUTI ---- */
function LikedEmpty() {
  return (
    <div className="liked-empty">
      <div className="liked-empty-mark" aria-hidden="true">
        <HeartI />
      </div>
      <h3 className="liked-empty-title">Ciò che merita di restare.</h3>
      <p className="liked-empty-sub">Gli oggetti che salvi appariranno qui.</p>
    </div>
  );
}
function Liked({ likedPrints, onOpen, onLike, onEdit }) {
  return (
    <section className="screen on liked-screen">
      <h2 className="title px"><span className="ticon"><HeartI /></span>Piaciuti</h2>
      {likedPrints.length > 0 && (
        <p className="liked-page-sub px">Ciò che merita di restare.</p>
      )}
      {likedPrints.length === 0 && <LikedEmpty />}
      {likedPrints.length > 0 && (
        <div className="liked-grid-wrap">
          <Grid>{likedPrints.map((p, i) => (
            <Card
              key={p.id}
              p={p}
              liked
              onLike={onLike}
              onOpen={() => onOpen(p.id)}
              onEdit={onEdit}
              context="liked"
            />
          ))}</Grid>
        </div>
      )}
      <div className="liked-bottom-spacer" />
    </section>
  );
}

/* ---- PROFILO ---- */
function OrdersTab({ orders, isAdmin, onOpenOrder, onConfirm, onReject, onComplete, onDelete, orderFocus, clearFocus, onGoExplore }) {
  const orderRefs = useRef({});
  useEffect(() => {
    if (orderFocus && orderRefs.current[orderFocus]) {
      orderRefs.current[orderFocus].scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => clearFocus && clearFocus(), 2600);
      return () => clearTimeout(t);
    }
  }, [orderFocus]);

  const oTitle = (o) => o.items.length > 1 ? o.items.length + " articoli" : (o.items[0] ? o.items[0].t : "Ordine");
  const setRef = (id) => (el) => { orderRefs.current[id] = el; };
  const [filter, setFilter] = useState("all");

  const pend = orders.filter((o) => o.status === "pending");
  const conf = orders.filter((o) => o.status === "confirmed");
  const comp = orders.filter((o) => o.status === "completed");
  const rej  = orders.filter((o) => o.status === "rejected");

  const filters = isAdmin
    ? [
        ["all", "Tutti", orders.length],
        ["pending", "Da accettare", pend.length],
        ["confirmed", "Accettati", conf.length],
        ["completed", "Completati", comp.length],
        ["rejected", "Rifiutati", rej.length],
      ]
    : [
        ["all", "Tutti", orders.length],
        ["pending", "Inviati", pend.length],
        ["confirmed", "Accettati", conf.length],
        ["completed", "Completati", comp.length],
      ];

  useEffect(() => {
    if (!filters.some(([id]) => id === filter)) setFilter("all");
  }, [isAdmin, orders.length]);

  const STATUS_META = {
    confirmed: { label: "Confermato",  cls: "ostat--confirmed", note: "Ordine confermato." },
    pending:   { label: "Inviato",    cls: "ostat--pending",   note: "in attesa di conferma." },
    completed: { label: "Completato", cls: "ostat--completed", note: "Il tuo ordine è pronto!" },
    rejected:  { label: "Non accettato", cls: "ostat--rejected", note: "Questa richiesta non può essere confermata in questo momento." },
  };

  const orderMetaText = (o) => (
    <>
      {o.date && <span>{fmtDate(o.date)}</span>}
      <span>{eur(o.total)}</span>
    </>
  );

  const OrderCard = ({ o, idx }) => {
    const st = STATUS_META[o.status] || STATUS_META.pending;
    const thumb = o.items[0] ? (o.items[0].img || gimg("#cfc4b4", "#9a8d79")) : gimg("#cfc4b4", "#9a8d79");
    return (
      <article
        className={"orderCard glass ord in" + (orderFocus === o.id ? " ofocus" : "")}
        ref={setRef(o.id)}
        style={{ animationDelay: idx * 55 + "ms" }}
        onClick={() => onOpenOrder(o.id)}
        role="button"
        tabIndex={0}
        aria-label={"Ordine: " + oTitle(o) + ", stato: " + st.label}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenOrder(o.id); } }}
      >
        <img className="orderThumb" src={thumb} alt={oTitle(o)} />
        <div className="orderBody">
          <div className="orderTitle">{oTitle(o)}</div>
          <div className="orderMeta">{orderMetaText(o)}</div>
          {!isAdmin && <p className="orderNote">{st.note}</p>}
        </div>
        <div className="orderSide">
          <span className={"ostat " + st.cls}>{st.label}</span>
          {isAdmin && o.status === "confirmed" && onComplete && (
            <button className="orderCompleteBtn" onClick={(e) => { e.stopPropagation(); onComplete(o.id); }}>Completa</button>
          )}

        </div>
      </article>
    );
  };

  // Banner pendenti (admin: con azioni; cliente: card unificata)
  const PendCard = ({ o, idx }) => {
    const thumb = o.items[0] ? (o.items[0].img || gimg("#cfc4b4", "#9a8d79")) : gimg("#cfc4b4", "#9a8d79");
    return (
      <article
        className={"orderCard glass orderCard--pend ord in" + (orderFocus === o.id ? " ofocus" : "")}
        ref={setRef(o.id)}
        style={{ animationDelay: idx * 55 + "ms" }}
        onClick={() => onOpenOrder(o.id)}
        role="button" tabIndex={0}
        aria-label={"Richiesta in attesa: " + oTitle(o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenOrder(o.id); } }}
      >
        {isAdmin && <img className="orderAvatar" src={o.avatar || avatarURI(o.who)} alt={o.who} />}
        {!isAdmin && <img className="orderThumb" src={thumb} alt={oTitle(o)} />}
        <div className="orderBody">
          <div className="orderTitle">{isAdmin ? o.who : oTitle(o)}</div>
          <div className="orderMeta">{orderMetaText(o)}</div>
          <p className="orderNote">{isAdmin ? "Apri il dettaglio per controllare la richiesta." : STATUS_META.pending.note}</p>
        </div>
        <div className="orderSide">
          <span className="ostat ostat--pending">Inviato</span>
          {isAdmin && (
            <div className="orderAdminActions" onClick={(e) => e.stopPropagation()}>
              <button className="btnY" onClick={() => onConfirm(o.id)}>Conferma</button>
              <button className="btnN" onClick={() => onReject(o.id)}>Rifiuta</button>
            </div>
          )}
        </div>
      </article>
    );
  };

  const ordered = [...pend, ...conf, ...comp, ...rej];
  const visibleOrders = filter === "all" ? ordered : ordered.filter((o) => o.status === filter);
  const emptyFilterText = isAdmin
    ? { pending: "Nessuna richiesta da accettare.", confirmed: "Nessun ordine accettato.", completed: "Nessun ordine completato.", rejected: "Nessun ordine rifiutato." }
    : { pending: "Nessun ordine inviato.", confirmed: "Nessun ordine accettato.", completed: "Nessun ordine completato." };

  return (
    <section className="screen on ordersPage">
      <div className="ordersHero">
        <h2 className="title px" style={{ marginBottom: 4 }}><span className="ticon"><OrdersI /></span>Ordini</h2>
        <p className="ordersSubtitle px">Tocca per scoprire i dettagli.</p>
      </div>

      {orders.length === 0 && (
        <div className="ordersEmpty">
          <div className="ordersEmptyIcon" aria-hidden="true"><OrdersI /></div>
          <p className="ordersEmptyText">Quando sceglierai un oggetto, lo ritroverai qui.</p>
          {onGoExplore && (
            <button type="button" className="ordersExploreCta" onClick={onGoExplore}>Esplora</button>
          )}
        </div>
      )}

      {orders.length > 0 && (
        <>
          <div className="orderFilters" role="tablist" aria-label="Filtra ordini">
            {filters.map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                className={"orderFilter" + (filter === id ? " on" : "")}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
              >
                <span>{label}</span>
                <em>{count}</em>
              </button>
            ))}
          </div>
          {visibleOrders.length === 0 ? (
            <p className="ordersFilterEmpty">{emptyFilterText[filter] || "Nessun ordine in questa sezione."}</p>
          ) : (
            <div className="ordersList">
              {visibleOrders.map((o, i) => o.status === "pending"
                ? <PendCard key={o.id} o={o} idx={i} />
                : <OrderCard key={o.id} o={o} idx={i} />
              )}
            </div>
          )}
        </>
      )}

      <div className="ordersBottomSpacer" />
    </section>
  );
}

function Profile({ user, theme, onTheme, onLogout, isAdmin, onNewProduct, likedPrints, onOpenProduct, onLike, onEditProduct, pwaInstalled, onPWAInstall, pushSupported, pushPermission, pushSubscribed, pushBusy, onTogglePush }) {
  const denied  = pushPermission === "denied";
  const iosLock = pushPermission !== "granted" && typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !pwaInstalled;

  const pushSubtitle = pushBusy
    ? "Aggiornamento notifiche…"
    : denied
      ? "Le notifiche sono bloccate nelle impostazioni del browser."
      : iosLock
        ? "Su iPhone le notifiche sono disponibili aprendo Strato dalla schermata Home."
        : pushSubscribed
          ? (isAdmin ? "Ti avviseremo quando arriva una richiesta da confermare." : "Ti avviseremo quando una richiesta viene aggiornata.")
          : "Ricevi aggiornamenti discreti sulle richieste Strato.";

  const canToggle = pushSupported && !denied && !pushBusy;

  const handleToggleKey = (e) => {
    if (canToggle && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onTogglePush(); }
  };

  const chevron = <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;

  const onPwaKey = (e) => {
    if (!pwaInstalled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPWAInstall(); }
  };

  return (
    <section className="screen on profilePage">
      <h2 className="title px"><span className="ticon"><User /></span>Profilo</h2>

      {/* Card identità */}
      <div className="profileHero">
        <img className="profileAvatar" src={user.avatar || avatarURI(user.name)} alt={"Avatar di " + user.name} />
        <div className="profileIdentity">
          <div className="profileName">{user.name}</div>
          <span className="profileRolePill">{isAdmin ? "Amministratore" : "Cliente"}</span>
          <p className="profileMicrocopy">{isAdmin ? "Gestisci l'esperienza Strato con cura e coerenza." : "Il tuo spazio personale Strato."}</p>
        </div>
      </div>

      {/* Amministrazione */}
      {isAdmin && (
        <section className="profileSection">
          <h3 className="profileSectionTitle">Amministrazione</h3>
          <div className="profileAdminCard">
            <div className="profileAdminActions">
              <button type="button" className="profileSubtleButton" onClick={onNewProduct}>
                <span className="profileSubtleIcon"><Plus /></span>
                <span className="profileSubtleText">
                  <span className="profileSubtleT">Nuovo prodotto</span>
                  <span className="profileSubtleS">Aggiungi un oggetto alla collezione.</span>
                </span>
                <span className="profileSubtleArr">{chevron}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Aspetto */}
      <section className="profileSection">
        <h3 className="profileSectionTitle">Aspetto</h3>
        <div className="themeseg compact">
          {[["light", "Luce", <Sun key="s" />], ["dark", "Buio", <Moon key="m" />], ["auto", "Automatico", <AutoI key="a" />]].map(([t, label, icon]) => (
            <button key={t} type="button" className={"segbtn" + (theme === t ? " on" : "")} onClick={() => onTheme(t)} aria-pressed={theme === t} aria-label={label}>
              <span className="segico">{icon}</span><span className="seglbl">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* App */}
      <section className="profileSection">
        <h3 className="profileSectionTitle">App</h3>
        <div
          className={"pwa-prow" + (pwaInstalled ? " installed" : "")}
          onClick={!pwaInstalled ? onPWAInstall : undefined}
          onKeyDown={!pwaInstalled ? onPwaKey : undefined}
          role={pwaInstalled ? undefined : "button"}
          tabIndex={pwaInstalled ? undefined : 0}
        >
          <div className="pwa-prowl">
            <img src="/icon-192.png" alt="Strato" className="pwa-prow-ico" />
            <div>
              <div className="pwa-prowt">{pwaInstalled ? "Esperienza app attiva" : "Installa Strato"}</div>
              <div className="pwa-prows">{pwaInstalled ? "Strato è aperta in modalità app." : "Accesso rapido, fluido e senza distrazioni."}</div>
            </div>
          </div>
          {pwaInstalled
            ? <span className="pwa-prow-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
            : <span className="pwa-prow-arr">{chevron}</span>
          }
        </div>

        {/* Notifiche ordini — toggle persistente */}
        {pushSupported && (
          <div className={"push-row" + (denied ? " push-row--denied" : "") + (pushBusy ? " push-row--busy" : "")}>
            <span className="push-row-ico"><Bell /></span>
            <div className="push-row-body">
              <span className="push-row-title">Notifiche ordini</span>
              <span className="push-row-sub">{pushSubtitle}</span>
            </div>
            {!denied && (
              <button
                type="button"
                role="switch"
                aria-checked={pushSubscribed}
                aria-label={pushSubscribed ? "Disattiva notifiche ordini" : "Attiva notifiche ordini"}
                disabled={pushBusy || !canToggle}
                className={"push-toggle" + (pushSubscribed ? " push-toggle--on" : "") + (pushBusy ? " push-toggle--busy" : "")}
                onClick={canToggle ? onTogglePush : undefined}
                onKeyDown={handleToggleKey}
              >
                <span className="push-toggle-knob" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Logout */}
      <div className="profileLogoutWrap">
        <button type="button" className="profileLogout" onClick={onLogout} aria-label="Esci"><LogOut /><span>Esci</span></button>
      </div>
    </section>
  );
}
/* ---- LOGIN (solo Google) ---- */
function Login({ onGoogle }) {
  return (
    <div className="loginwrap">
      <div className="loginbox glass">
        <div className="brand2 big"><span className="mk"><Box /></span>Strato</div>
        <p className="lsub">Oggetti di design per la casa</p>
        <button className="gbtn" onClick={onGoogle}><GoogleIcon /> Continua con Google</button>
      </div>
    </div>
  );
}
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.6 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.1-3.8 6.5-9.4 6.5-17z" /><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z" /><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.3-4.6 2.1-8.2 2.1-6.4 0-11.7-3.8-13.6-9.3l-7.8 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
);

/* ---- ADMIN: editor prodotto (con colori) ---- */
function AdminProduct({ editing, cats, onClose, onSaved, onDelete, user, toast }) {
  const [f, setF] = useState(editing ? {
    title: editing.title, price: editing.price, material: editing.material, desc: editing.desc,
    category_id: editing.category_id || "", is_electrical: editing.isElectrical,
    addon_braided: editing.addons.braided, addon_bulb: editing.addons.bulb, addon_holder: editing.addons.holder,
    allow_braided: editing.allowBraided !== false, featured: !!editing.featured,
  } : { title: "", price: "", material: "", desc: "", category_id: "", is_electrical: false, addon_braided: 6, addon_bulb: 5, addon_holder: 8, allow_braided: true, featured: false });
  const [colors, setColors] = useState(editing ? editing.cols.map((c) => ({ name: c.name, color_a: c.a, color_b: c.b, imgs: (c.imgs || []).map((u) => ({ url: u, file: null, preview: u })) })) : [{ name: "Naturale", color_a: "#cfc4b4", color_b: "#9a8d79", imgs: [] }]);
  const [busy, setBusy] = useState(false);

  const upd = (k, v) => setF({ ...f, [k]: v });
  const updCol = (i, k, v) => setColors(colors.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const addCol = () => setColors([...colors, { name: "", color_a: "#cccccc", color_b: "#999999", imgs: [] }]);
  const delCol = (i) => setColors(colors.filter((_, j) => j !== i));
  const addColImage = async (i, file) => {
    if (!file) return;
    const blob = await compressImage(file);
    setColors((cs) => cs.map((c, j) => j === i ? { ...c, imgs: [...(c.imgs || []), { url: "", file: blob, preview: URL.createObjectURL(blob) }].slice(0, 5) } : c));
  };
  const delColImage = (i, j) => setColors((cs) => cs.map((c, k) => k === i ? { ...c, imgs: (c.imgs || []).filter((_, m) => m !== j) } : c));

  const uploadOne = async (blob) => {
    const path = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".jpg";
    const { error } = await supabase.storage.from("prints").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return supabase.storage.from("prints").getPublicUrl(path).data.publicUrl;
  };

  const save = async () => {
    if (!f.title || !f.price) { toast("Titolo e prezzo obbligatori"); return; }
    setBusy(true);
    try {
      const payload = {
        title: f.title, price: Number(f.price) || 0, material: f.material, description: f.desc,
        category_id: f.category_id || null, is_electrical: !!f.is_electrical, allow_braided: !!f.allow_braided, featured: !!f.featured,
        addon_braided: Number(f.addon_braided) || 0, addon_bulb: Number(f.addon_bulb) || 0, addon_holder: Number(f.addon_holder) || 0,
      };
      let printId = editing ? editing.id : null;
      if (editing) {
        await supabase.from("prints").update(payload).eq("id", editing.id);
      } else {
        const { data, error } = await supabase.from("prints").insert({ ...payload, created_by: user.id, images: [] }).select().single();
        if (error) throw error;
        printId = data.id;
      }
      // colori: rimpiazza in blocco
      await supabase.from("print_colors").delete().eq("print_id", printId);
      let pos = 0;
      for (const c of colors) {
        const urls = [];
        for (const im of (c.imgs || []).slice(0, 5)) {
          if (im.url) urls.push(im.url);
          else if (im.file) urls.push(await uploadOne(im.file));
        }
        await supabase.from("print_colors").insert({
          print_id: printId, name: c.name || "Colore", color_a: c.color_a, color_b: c.color_b,
          images: urls, image_url: urls[0] || null, position: pos++,
        });
      }
      await onSaved();
    } catch (e) {
      toast("Errore salvataggio prodotto");
      setBusy(false);
    }
  };

  return (
    <section className="screen on appview productview productview--clean adminProductView" aria-label={editing ? "Modifica prodotto" : "Nuovo prodotto"}>
      <div className="detailview-card adminProductCard">
        <div className="adminProductHead">
          <div className="dkick">{editing ? "Modifica articolo" : "Nuovo articolo"}</div>
          <h2 className="adminProductTitle"><Pencil /> {editing ? "Modifica prodotto" : "Nuovo prodotto"}</h2>
        </div>
        <div className="afield"><label>Titolo</label><input value={f.title} onChange={(e) => upd("title", e.target.value)} /></div>
        <div className="afrow">
          <div className="afield"><label>Prezzo (€)</label><input type="number" step="0.5" value={f.price} onChange={(e) => upd("price", e.target.value)} /></div>
          <div className="afield"><label>Materiale</label><input value={f.material} onChange={(e) => upd("material", e.target.value)} /></div>
        </div>
        <div className="afield"><label>Categoria</label>
          <select value={f.category_id} onChange={(e) => upd("category_id", e.target.value)}>
            <option value="">— nessuna —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="afield"><label>Descrizione</label><textarea rows="2" value={f.desc} onChange={(e) => upd("desc", e.target.value)} /></div>
        <label className="achk"><input type="checkbox" checked={f.featured} onChange={(e) => upd("featured", e.target.checked)} /> Mostra nel carosello in evidenza</label>
        <label className="achk"><input type="checkbox" checked={f.is_electrical} onChange={(e) => upd("is_electrical", e.target.checked)} /> Articolo a corrente (aggiunte elettriche)</label>
        {f.is_electrical && (
          <>
            <label className="achk"><input type="checkbox" checked={f.allow_braided} onChange={(e) => upd("allow_braided", e.target.checked)} /> Permetti cavo in tessuto (altrimenti solo Normale)</label>
            <div className="afrow3">
              {f.allow_braided && <div className="afield"><label>Cavo in tessuto +€</label><input type="number" step="0.5" value={f.addon_braided} onChange={(e) => upd("addon_braided", e.target.value)} /></div>}
              <div className="afield"><label>Lampadina +€</label><input type="number" step="0.5" value={f.addon_bulb} onChange={(e) => upd("addon_bulb", e.target.value)} /></div>
              <div className="afield"><label>Portalampada premium +€</label><input type="number" step="0.5" value={f.addon_holder} onChange={(e) => upd("addon_holder", e.target.value)} /></div>
            </div>
          </>
        )}
        <div className="psec">Colori / foto (max 5 per colore)</div>
        {colors.map((c, i) => (
          <div className="colrow2" key={i}>
            <div className="colhead">
              <input className="colname" placeholder="Nome colore" value={c.name} onChange={(e) => updCol(i, "name", e.target.value)} />
              <input type="color" value={c.color_a} onChange={(e) => updCol(i, "color_a", e.target.value)} aria-label="Colore 1" />
              <input type="color" value={c.color_b} onChange={(e) => updCol(i, "color_b", e.target.value)} aria-label="Colore 2" />
              {colors.length > 1 && <button className="coldel" onClick={() => delCol(i)} aria-label="Rimuovi colore"><Trash2 /></button>}
            </div>
            <div className="colphotos">
              {(c.imgs || []).map((im, j) => (
                <div className="colph" key={j}>
                  <img src={im.preview || im.url || gimg(c.color_a, c.color_b)} alt="" />
                  <button className="colphdel" onClick={() => delColImage(i, j)} aria-label="Rimuovi foto">×</button>
                  {j === 0 && <span className="colphmain">Principale</span>}
                </div>
              ))}
              {(c.imgs || []).length < 5 && (
                <label className="coladd"><Plus /><input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { addColImage(i, e.target.files[0]); e.target.value = ""; }} /></label>
              )}
            </div>
            <div className="colhint">{(c.imgs || []).length}/5 foto · la prima è la principale</div>
          </div>
        ))}
        <button className="addcolor" onClick={addCol}><Plus /> Aggiungi colore</button>
        <button className="qsend" disabled={busy} onClick={save}>{busy ? "Salvataggio…" : "Salva prodotto"}</button>
        {editing && onDelete && (
          <button className="delbtn" onClick={() => { if (window.confirm("Eliminare definitivamente questo prodotto? L'azione è irreversibile.")) onDelete(editing.id); }}><Trash2 /> Elimina prodotto</button>
        )}
      </div>
    </section>
  );
}


function UpdatesView({ notifs, onItemClick, onClear, isAdmin }) {
  return (
    <section className="screen on appview updatesview" aria-label="Aggiornamenti">
      <div className="viewhead">
        <div>
          <div className="vieweyebrow">{isAdmin ? "Richieste" : "Aggiornamenti"}</div>
          <h2 className="viewtitle">{isAdmin ? "Richieste da confermare" : "Aggiornamenti"}</h2>
          <p className="viewsub">{isAdmin ? "Controlla i dettagli quando vuoi." : "Le tue richieste, aggiornate con discrezione."}</p>
        </div>
        {notifs.length > 0 && <button className="notifclear" onClick={onClear}><Trash /> Elimina tutte</button>}
      </div>
      <div className="updatesview-card">
        <div className="cartitems">
          {notifs.length === 0 && <div className="cempty">Nessun aggiornamento al momento.<br />Ti avviseremo quando una richiesta cambia stato.</div>}
          {notifs.map((n) => (
            <button className="notifrow" key={n.id + n.status} onClick={() => onItemClick(n.id)}>
              <span className={"notifdot s-" + n.status} />
              <span className="notiftxt"><b>{n.title}</b><span className="notifb">{n.body}</span></span>
              <span className="notifarrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function NotifSheet({ notifs, onClose, onItemClick, onClear }) {
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  const { wrapRef, sheetRef } = useDragToClose(doClose, "up");
  return (
    <div className={"ipick top on" + (closing ? " closing" : "")} role="dialog" aria-modal="true" aria-label="Notifiche" onClick={(e) => { if (e.target.classList.contains("ipick") || e.target.classList.contains("sheetwrap")) doClose(); }}>
      <div className="sheetwrap" ref={wrapRef}>
        <div className="sheet" ref={sheetRef}>
          <div className="notifhead">
            <h4><Bell /> Notifiche</h4>
            {notifs.length > 0 && <button className="notifclear" onClick={onClear}><Trash /> Elimina tutte</button>}
          </div>
          <div className="cartitems">
            {notifs.length === 0 && <div className="cempty">Nessuna notifica per ora.</div>}
            {notifs.map((n) => (
              <button className="notifrow" key={n.id + n.status} onClick={() => onItemClick(n.id)}>
                <span className={"notifdot s-" + n.status} />
                <span className="notiftxt"><b>{n.title}</b><span className="notifb">{n.body}</span></span>
                <span className="notifarrow">›</span>
              </button>
            ))}
          </div>
        </div>
        <button className="sheetclose" onClick={doClose} aria-label="Chiudi notifiche"><ChevronUp /></button>
      </div>
    </div>
  );
}

function CategoryEditor({ cat, onClose, onSave, onDelete }) {
  const [name, setName] = useState(cat ? cat.name : "");
  const [icon, setIcon] = useState(cat ? cat.icon : "vaso");
  const [busy, setBusy] = useState(false);
  return (
    <div className="ipick on">
      <div className="sheet admin">
        <button className="sheetclose" onClick={onClose}><ChevronDown /></button>
        <h4><span className="ticon"><CatsI /></span> {cat ? "Modifica categoria" : "Nuova categoria"}</h4>
        <div className="afield"><label>Nome</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Lampade" /></div>
        <div className="psec">Icona categoria</div>
        {ICON_GROUPS.map((g) => (
          <div key={g.t}>
            <div className="iggroup">{g.t}</div>
            <div className="ig">
              {g.keys.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={"ib" + (icon === k ? " on" : "")}
                  onClick={() => setIcon(k)}
                  aria-label={k.replace(/_/g," ")}
                  aria-pressed={icon === k}
                ><Raw html={glassIcon(k, 30)} /></button>
              ))}
            </div>
          </div>
        ))}
        <button className="qsend" disabled={busy || !name.trim()} onClick={async () => { setBusy(true); await onSave({ name: name.trim(), icon }); }}>{cat ? "Salva" : "Crea categoria"}</button>
        {cat && <button className="delbtn" onClick={() => { if (window.confirm("Eliminare la categoria? Gli articoli resteranno senza categoria.")) onDelete(cat.id); }}><Trash2 /> Elimina categoria</button>}
      </div>
    </div>
  );
}

const Sun = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>);
const Moon = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.2A8 8 0 0 1 9.8 4 7.2 7.2 0 1 0 20 14.2z" /></svg>);
const AutoI = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.4" /><path d="M12 3.6a8.4 8.4 0 0 0 0 16.8z" fill="currentColor" stroke="none" /></svg>);
const Bell = () => (<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.6 7.6-2.6 7.6h17.2S18 14.5 18 8.5" /><path d="M13.6 21a2 2 0 0 1-3.2 0" /></svg>);
const Trash = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>);

/* Icone minimali inline: nessuna dipendenza esterna per il set nav/azioni. */
const ChevronLeft = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>);
const ChevronDown = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>);
const ChevronUp = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>);
const Check = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>);
const User = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
const LogOut = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>);
const Plus = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>);
const Pencil = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
const Trash2 = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>);
const Upload = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>);
const Camera = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
