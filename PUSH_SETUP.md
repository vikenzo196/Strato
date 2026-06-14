# Notifiche push reali (anche a sito chiuso) — setup

Le push "vere" (consegnate quando il sito è chiuso) richiedono **Web Push**: un Service
Worker + una subscription per dispositivo + un backend che invia. Non si può fare solo
lato frontend. Ecco i passi (15–20 min).

## 1. Genera le chiavi VAPID
```
npx web-push generate-vapid-keys
```
Ottieni `Public Key` e `Private Key`.

## 2. Database
Esegui `db/push_and_admin.sql` nell'editor SQL di Supabase. Crea la tabella
`push_subscriptions` (+ RLS) e le policy DELETE admin per gli ordini.

## 3. Edge Function (il mittente)
```
supabase functions deploy push-notify
supabase secrets set VAPID_PUBLIC_KEY=...  VAPID_PRIVATE_KEY=...  VAPID_SUBJECT=mailto:tua@email.it
```
Chiama `push-notify` con `{ user_id, title, body, url }` quando un ordine cambia stato
(es. da un Database Webhook su `orders`, o dal punto in cui l'admin conferma/rifiuta).

## 4. Service Worker
`public/sw.js` è già incluso: viene servito a `/sw.js` dopo il deploy su Vercel.

## 5. Client (da aggiungere in App, quando avrai la Public Key)
Metti la tua VAPID **public** key in una env `VITE_VAPID_PUBLIC_KEY` e usa questo helper
dopo il login (es. un bottone "Attiva notifiche" nel Profilo):

```js
const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY;
function urlB64ToUint8(b64){const p='='.repeat((4-b64.length%4)%4);const s=(b64+p).replace(/-/g,'+').replace(/_/g,'/');const r=atob(s);return Uint8Array.from([...r].map(c=>c.charCodeAt(0)));}

export async function enablePush(supabase, userId){
  if(!('serviceWorker' in navigator) || !('PushManager' in window)) return alert('Push non supportate su questo browser.');
  const perm = await Notification.requestPermission();
  if(perm !== 'granted') return;
  const reg = await navigator.serviceWorker.register('/sw.js');
  const sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey: urlB64ToUint8(VAPID) });
  await supabase.from('push_subscriptions').upsert({ user_id:userId, subscription: sub.toJSON() }, { onConflict:'user_id,subscription' });
}
```

## Note iOS
Su iPhone le push Web funzionano **solo** se l'utente aggiunge il sito alla schermata
Home (PWA installata), da iOS 16.4+. Su Android/desktop funzionano dal browser.

Quando hai generato le chiavi VAPID, posso wirare io il bottone "Attiva notifiche" nel
Profilo e la chiamata alla function al cambio stato ordine.
