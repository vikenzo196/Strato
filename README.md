# Strato

Strato è una PWA mobile-first per una boutique digitale premium di oggetti di design stampati in 3D.
L’esperienza è editoriale, calda e materica: non marketplace, non e-commerce aggressivo, non dashboard.

## Stato corrente

- Frontend React + Vite.
- Backend Supabase per auth, profili, catalogo, carrello, ordini e notifiche.
- PWA installabile con manifest e service worker.
- Dock stabile a 5 sezioni: Home, Esplora, Piaciuti, Carrello, Ordini.
- Tema chiaro/scuro automatico con canvas light ufficiale `#F4EEE6`.
- Patch corrente: `v2cc_code_modules_extract`.

## File di ingresso effettivo

La build Vite usa `src/App.jsx` tramite `src/main.jsx`:

```js
import App from "./App.jsx";
```

Nel repository è presente anche un `App.jsx` in root. Non è l’ingresso della build Vite corrente e va trattato come file legacy/duplicato finché non viene deciso diversamente.

## Setup locale

Richiede Node.js 18+.

```bash
npm install
npm run dev
```

Per collegare Supabase crea un file `.env` locale con:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Per notifiche push reali serve anche:

```bash
VITE_VAPID_PUBLIC_KEY=...
```

## Build

```bash
npm run build
```

La build produce la cartella `dist/`.

Nota: gli asset immagine pesanti sono stati estratti dai JSX in `public/assets/inline/`, il CSS globale effettivo vive in `src/styles/app.css` e la patch `v2cc_code_modules_extract` sposta utility, hook PWA e visual/icon helpers in moduli dedicati senza cambiare UI o comportamento.

## Asset immagini

Gli asset immagine che prima erano `data:image` inline dentro i JSX sono stati estratti in:

```text
public/assets/inline/
```

Regole:

- non modificare, ricomprimere, ricolorare o sostituire questi file senza richiesta esplicita;
- le immagini del carrello vuoto devono restare full fidelity, opacity `1`, senza filtri o rielaborazioni;
- i riferimenti dal CSS embedded usano path assoluti `/assets/inline/...`, compatibili con Vite perché i file sono sotto `public/`;
- `src/App.jsx` è il file effettivo della build; il duplicato legacy `App.jsx` in root è stato alleggerito allo stesso modo per non mantenere asset base64 obsoleti nello ZIP;
- i fallback grafici legacy del carrello vuoto sono stati rimossi solo dove erano sovrascritti dalle regole finali light/dark già presenti.

## CSS

Il CSS globale effettivo vive in:

```text
src/styles/app.css
```

`src/App.jsx` lo importa con:

```js
import "./styles/app.css";
```

Non reintrodurre blocchi `<style>{CSS}</style>` o CSS embedded dentro `App.jsx` senza una ragione tecnica esplicita.

## Moduli codice

La logica non-UI più isolata è separata da `src/App.jsx`:

```text
src/utils/push.js
src/utils/product.js
src/hooks/usePWAInstall.js
src/ui/visuals.jsx
```

`src/App.jsx` resta il coordinatore principale dell'app, ma non deve tornare a incorporare asset base64 pesanti, CSS globale o utility isolate senza necessità esplicita.

## Supabase

Prima del deploy, allinea lo schema database eseguendo gli SQL presenti in `supabase/` secondo lo stato effettivo del progetto:

```text
supabase/schema.sql
supabase/schema_v2.sql
supabase/schema_v3.sql
supabase/schema_v4.sql
```

Per push e policy admin aggiuntive, vedi anche:

```text
db/push_and_admin.sql
PUSH_SETUP.md
```

## Deploy

Il progetto è una normale app Vite.

Variabili ambiente richieste in produzione:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Variabile opzionale per notifiche push:

```text
VITE_VAPID_PUBLIC_KEY
```

Dopo il deploy aggiorna in Supabase:

- Site URL
- redirect URL dei provider auth attivi

## PWA

File coinvolti:

```text
index.html
public/manifest.json
public/sw.js
```

Il canvas light ufficiale della shell/PWA è `#F4EEE6`.
La dark mode mantiene il canvas espresso/cacao caldo già definito nel codice.

## Scroll

- Lo scroll deve restare nativo sulle pagine con contenuto eccedente il viewport.
- Le pagine corte o vuote vengono bloccate dinamicamente: se la vista attiva rientra nel viewport, non deve esserci scroll verticale fittizio.
- Il carrello vuoto mantiene il proprio lock dedicato fullscreen/no-scroll.
- La molla artificiale su input `wheel` desktop è stata rimossa.

## Regole di manutenzione

- Modificare solo ciò che è richiesto.
- Patch minime e chirurgiche.
- Nessun refactor globale senza richiesta.
- Non cambiare layout, immagini, dock, topbar, scroll o safe-area senza richiesta esplicita.
- Non modificare le immagini del carrello vuoto.
- Quando una patch cambia funzioni, comportamento, setup o stato progetto, aggiornare questo README e rimuovere istruzioni obsolete.

## Note rimosse rispetto a versioni precedenti

La documentazione precedente citava WhatsApp, Apple login, `.env.example` e PWA come prossimo passo. Quei riferimenti non descrivono correttamente lo stato corrente di questa versione e sono stati rimossi.
