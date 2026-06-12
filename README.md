# Strato · Ecommerce React + Vite per design stampato in 3D

Strato è un frontend ecommerce mobile-first per oggetti di design stampati in 3D. L'esperienza è pensata come una piccola app: catalogo pubblico, scheda prodotto in bottom sheet, carrello locale e richiesta ordine con conferma successiva.

## Stato del flusso attuale

- **Catalogo pubblico**: Home, Esplora, schede prodotto e carrello sono navigabili anche senza login.
- **Login Google**: richiesto solo per azioni personali: preferiti, invio richiesta ordine, storico ordini, profilo e funzioni admin.
- **Scheda prodotto**: si apre come popup/bottom sheet con scroll interno, colori selezionabili, descrizione, materiale, categoria, quantità e CTA chiara.
- **Carrello**: salva righe in `localStorage`, mostra colore/opzioni/quantità/subtotale e invia una richiesta ordine.
- **Ordini**: gli ordini vengono salvati in Supabase come `pending`; l'admin può confermare o rifiutare.
- **Admin**: gli amministratori possono creare/modificare prodotti, categorie, colori, immagini e sfondi.

## Stack

- React 18
- Vite 5
- Supabase Auth, Database e Storage
- CSS custom con design system interno Liquid Glass

## Setup locale

```bash
cp .env.example .env
npm install
npm run dev
```

Compila produzione:

```bash
npm run build
```

## Variabili ambiente

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Setup Supabase

Esegui gli script SQL nel SQL Editor di Supabase in questo ordine:

1. `supabase/schema.sql`
2. `supabase/schema_v2.sql`
3. `supabase/schema_v3.sql`
4. `supabase/schema_v4.sql`

Le policy RLS includono lettura pubblica per catalogo/categorie/colori e accesso autenticato per preferiti e ordini personali.

## Login Google

In Supabase abilita il provider Google.

Nel progetto Google Cloud configura il redirect URI indicato da Supabase:

```txt
https://<project-ref>.supabase.co/auth/v1/callback
```

In Supabase, in Authentication → URL Configuration, imposta:

- Site URL locale: `http://localhost:5173`
- Site URL produzione: dominio Vercel/hosting finale

## Rendere un utente amministratore

Dopo il primo accesso Google, esegui:

```sql
update public.profiles
set is_admin = true
where id = (
  select id from auth.users where email = 'tua@email.com'
);
```

## Struttura progetto

```txt
strato/
├─ index.html
├─ package.json
├─ vite.config.js
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  └─ lib/
│     └─ supabase.js
└─ supabase/
   ├─ schema.sql
   ├─ schema_v2.sql
   ├─ schema_v3.sql
   └─ schema_v4.sql
```

## Note UX implementate

- Il login non blocca più la scoperta del catalogo.
- La dock principale è a 4 voci: Home, Esplora, Carrello, Ordini.
- I preferiti sono spostati nel profilo e richiedono login.
- La Home usa i prodotti `featured` invece di un prodotto casuale.
- La richiesta ordine chiarisce che non si paga subito.
- Il viewport consente zoom: non viene più forzato `user-scalable=no`.
- Sono stati rimossi i listener globali che bloccavano zoom e gesture browser.
- Gli sfondi fallback non sono più JPEG base64 enormi nel bundle JS.

## Prossimi refactoring consigliati

- Spezzare `src/App.jsx` in feature/components.
- Spostare il CSS da stringa JS a `src/styles/tokens.css` e `src/styles/global.css`.
- Lazy-load completo dell'admin editor.
- Aggiungere deep link prodotto e SEO.
- Aggiungere dati checkout più completi: telefono, indirizzo/consegna, note e privacy.
