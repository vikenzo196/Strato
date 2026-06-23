# Strato

Strato è una PWA mobile-first per una boutique digitale premium di oggetti di design stampati in 3D.
L’esperienza è editoriale, calda e materica: non marketplace, non e-commerce aggressivo, non dashboard.

## Stato corrente

- Frontend React + Vite.
- Backend Supabase per auth, profili, catalogo, carrello, ordini e notifiche.
- PWA installabile con manifest e service worker.
- Dock stabile a 5 sezioni: Home, Esplora, Piaciuti, Carrello, Ordini.
- Tema chiaro/scuro automatico con canvas light ufficiale `#F4EEE6`.
- Patch corrente: `v2cy_intro_video_opening`.

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

Nota v2cs: la headline home “Il design che cercavi, / finalmente prende forma.” mantiene font e peso invariati, ma aggiunge un guard CSS mobile per restare su due righe reali anche su smartphone stretti.


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

La patch `v2cr_home_hero_copy_two_lines` modifica solo il copy della headline home sopra la hero: `Il design che cercavi, / finalmente prende forma.`. Font, grandezza, peso, layout, hero, animazioni e griglia restano invariati.

Il sistema icone categorie è stato ricreato in stile **Set B** dentro `src/ui/visuals.jsx`: forme più descrittive, coerenti e calde, con gruppi opzioni riallineati per Luce, Forme, Tempo, Arredo, Contenere, Parete, Scrivania, Tavola, Decoro, Stagionali e Altro.

La patch `v2cf_category_icons_set_b_full_replace` aggiunge anche una migrazione Supabase:

```text
supabase/schema_v5_category_icons_set_b.sql
supabase/schema_v6_category_icons_set_b_full_replace.sql
```

Va eseguita nel SQL Editor di Supabase per aggiornare le categorie già esistenti in `public.categories.icon`. Il codice mantiene anche alias di compatibilità lato app per evitare regressioni se nel database restano temporaneamente valori legacy.

La patch `v2cf_category_icons_set_b_full_replace` rimuove la possibilità che le chiavi legacy renderizzino forme vecchie: anche alias storici come `vaso`, `lampada` o `scatola` puntano ora a disegni Set B effettivi, con layer `sf/sa/ol/thin` e CSS dedicato.


## Card prodotto

La patch `v2cm_product_card_responsive_spacing_fix` aggiorna solo la parte informativa delle tile prodotto:

- miniatura prodotto mantenuta 1:1 con bordi stondati;
- materiale rimosso dalla tile;
- titolo articolo con font serif bold/design;
- light mode tile background `#F7F1EB`;
- riga inferiore con prezzo e CTA `Scopri` affiancati.

Non modifica immagini sorgente, layout globale, scroll, dock, topbar, carrello o `#appbg`.

## Supabase

Prima del deploy, allinea lo schema database eseguendo gli SQL presenti in `supabase/` secondo lo stato effettivo del progetto:

```text
supabase/schema.sql
supabase/schema_v2.sql
supabase/schema_v3.sql
supabase/schema_v4.sql
supabase/schema_v5_category_icons_set_b.sql
supabase/schema_v6_category_icons_set_b_full_replace.sql
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

## Icone categorie

Patch corrente `v2cm_product_card_responsive_spacing_fix`: colore icone categoria impostato a `#B26349`.

## Patch v2ck

`v2cm_product_card_responsive_spacing_fix` corregge la regressione della tile prodotto introdotta da `v2cj`: mantiene miniatura 1:1, materiale rimosso, fondo light `#F7F1EB` e direzione serif/premium, ma compatta titolo/prezzo/CTA e impedisce accavallamenti su mobile.

## v2cm_product_card_responsive_spacing_fix

Correzione proporzioni tile prodotto: prezzo/CTA più piccoli e responsivi, nessun taglio prezzo su smartphone, cuore foto più morbido in stile pre-restyling. Materiale rimosso, miniatura 1:1 e fondo light `#F7F1EB` invariati.

## Patch v2cm — product card responsive spacing fix

La patch `v2cm_product_card_responsive_spacing_fix` corregge le proporzioni della tile prodotto dopo il restyling: le card non vengono più stirate per pareggiare l’altezza della riga grid, lo spazio tra titolo/divisore/prezzo è ridotto e su smartphone prezzo + CTA restano nella stessa riga con dimensioni più contenute. Restano invariati miniatura 1:1, fondo light `#F7F1EB`, materiale rimosso, immagini sorgente, scroll, dock, topbar, carrello e `#appbg`.


## v2cq_card_title_balance_selection_lock

Micro-patch su tile prodotto e interazione globale:

- titolo prodotto centrato verticalmente nello spazio riservato quando occupa una sola riga;
- icona categoria +5% e nome categoria +3%;
- selezione testo/immagini disabilitata nell'app;
- input, textarea e contenteditable restano selezionabili per non rompere ricerca e strumenti admin.


La patch `v2ct_home_hero_ios_two_line_hard_guard` rafforza il guard mobile della headline home: mantiene il testo e il `<br />` già approvati, blocca il wrap interno delle due righe su smartphone e riduce solo la dimensione mobile per evitare la terza riga su iOS.


La patch `v2cu_dock_scale_10_percent` aumenta la dock di circa il 10% in modo proporzionale: contenitore, tab, icone interne e indicatori. Non cambia posizione, safe-area, scroll, topbar, card, hero o carrello.


## v2cv_dock_cart_icon_optical_balance

Micro-correzione ottica della dock: aumenta solo l'SVG dell'icona carrello per allinearne la percezione visiva alle altre icone dopo lo scale del 10%. Non modifica dimensione dock, posizione, tab, badge o altre icone.
