# Strato

Strato è una PWA mobile-first per una boutique digitale premium di oggetti di design stampati in 3D.
L’esperienza è editoriale, calda e materica: non marketplace, non e-commerce aggressivo, non dashboard.

## Stato corrente

- Frontend React + Vite.
- Backend Supabase per auth, profili, catalogo, carrello, ordini e notifiche.
- PWA installabile con manifest e service worker.
- Dock stabile a 5 sezioni: Home, Esplora, Piaciuti, Carrello, Ordini.
- Tema chiaro/scuro automatico con canvas light ufficiale `#F4EEE6`.
- Patch corrente: `v2bt_shell_canvas_alignment`.

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

Nota: il bundle può risultare molto grande perché diversi asset sono inline/base64 dentro `src/App.jsx`.

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

## Regole di manutenzione

- Modificare solo ciò che è richiesto.
- Patch minime e chirurgiche.
- Nessun refactor globale senza richiesta.
- Non cambiare layout, immagini, dock, topbar, scroll o safe-area senza richiesta esplicita.
- Non modificare le immagini del carrello vuoto.
- Quando una patch cambia funzioni, comportamento, setup o stato progetto, aggiornare questo README e rimuovere istruzioni obsolete.

## Note rimosse rispetto a versioni precedenti

La documentazione precedente citava WhatsApp, Apple login, `.env.example` e PWA come prossimo passo. Quei riferimenti non descrivono correttamente lo stato corrente di questa versione e sono stati rimossi.
