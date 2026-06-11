# Strato · v2 (Liquid Glass)

> Aggiornamento: nuovo design "Liquid Glass", login solo Google, carrello e ordini su Supabase (niente piu' WhatsApp), prodotti con palette colori + foto per colore, aggiunte elettriche con prezzi admin, categorie, riepilogo ordine scomposto, preferenze tema/sfondo per utente.
>
> **Prima del deploy esegui** `supabase/schema_v2.sql` e poi `supabase/schema_v3.sql` nel SQL Editor di Supabase.

---

# Strato · sito per le tue stampe 3D

App reale con: catalogo a carosello, login **Apple/Google**, **like col cuoricino** (con
contatore pubblico), **commenti** per ogni stampa, **ordine su WhatsApp** con messaggio
già pronto, **tema chiaro/scuro automatico** (segue il telefono) e pannello **admin** per
caricare e **modificare** stampe (foto, descrizione, prezzo).

> Nome e logo sono "Strato" provvisori: si cambiano in `src/App.jsx` (cerca "Strato") e
> nel logo dell'header quando vorrai.

Stack: **React + Vite** (frontend) · **Supabase** (login, database, storage).

---

## 0. Cosa ti serve
- Account **Supabase** (gratis) → https://supabase.com
- Account **Google Cloud** (gratis) per il login Google
- *(facoltativo)* Account **Apple Developer** (99 €/anno) per "Accedi con Apple"
- **Node.js 18+** sul computer
- Il tuo **numero WhatsApp** (già impostato: `393248143316`, modificabile)

---

## 1. Progetto Supabase
1. Crea un nuovo progetto su Supabase.
2. **SQL Editor** → incolla tutto `supabase/schema.sql` ed esegui (tabelle, sicurezza,
   trigger dei like, bucket foto).
3. **Project Settings → API**: copia **Project URL** e **anon public key**.

## 2. Login (Authentication → Providers)
- **Google**: in Google Cloud crea credenziali OAuth (Web), come *redirect URI* usa quello
  mostrato da Supabase (`https://<progetto>.supabase.co/auth/v1/callback`), poi incolla
  Client ID/Secret in Supabase e abilita Google.
- **Apple** *(facoltativo)*: segui la card Apple in Supabase. Se non ti serve subito,
  lascialo spento: con Google funziona tutto.
- **Authentication → URL Configuration**: *Site URL* = indirizzo del sito
  (`http://localhost:5173` in locale; il dominio Vercel in produzione).

## 3. Avvio in locale
```bash
cp .env.example .env     # incolla URL e anon key; il numero WhatsApp è già impostato
npm install
npm run dev              # http://localhost:5173
```

## 4. Diventa amministratore
1. Fai login una prima volta dall'app.
2. **SQL Editor**:
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'tua@email.com');
   ```
3. Ricarica: ora vedi "Carica nuova stampa", il tasto "Modifica" su ogni pezzo e la
   gestione dal profilo.

## 5. Online (Vercel)
1. Carica su GitHub → importa su https://vercel.com (framework **Vite**).
2. Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_WHATSAPP_NUMBER`.
3. Deploy, poi aggiorna *Site URL* e i redirect dei provider col dominio Vercel.

---

## Come funzionano le cose
- **Ordine**: ogni stampa ha il tasto verde WhatsApp; apre la chat col tuo numero e un
  messaggio precompilato (es. *"Ciao! Vorrei ordinare: Vaso Onda — 24,00 €"*). Nessun
  carrello, nessun backend di pagamento: l'ordine ti arriva direttamente in chat.
- **Like (cuoricino)**: una riga in `likes` per utente/stampa; il **conteggio pubblico**
  è in `prints.like_count`, aggiornato da trigger. La lista personale è in **"I miei like"**
  nel menu (e nel profilo).
- **Commenti**: tabella `comments`, visibili a tutti; ognuno scrive a proprio nome e può
  cancellare i propri; tu admin puoi cancellare qualsiasi commento.
- **Tema chiaro/scuro**: automatico via `prefers-color-scheme`, nessun interruttore.
- **Admin**: carica e modifica stampe (foto, descrizione, prezzo) dal profilo o dal tasto
  "Modifica" sulla scheda. Le foto vanno nello Storage pubblico, scrivibile solo da te.

## Cambiare numero WhatsApp
È in `.env` come `VITE_WHATSAPP_NUMBER` (formato internazionale senza "+" né spazi).

## Struttura
```
strato/
├─ index.html
├─ package.json · vite.config.js · .env.example
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx            # interfaccia + logica (design, animazioni, tema)
│  └─ lib/supabase.js    # client Supabase
└─ supabase/
   └─ schema.sql         # database + sicurezza + trigger + storage
```

## Prossimi passi (facoltativi)
- **Pagamenti** con Stripe (se un giorno vorrai vendere online davvero).
- **Stato ordine** o galleria "fatte da voi" con foto dei clienti.
- **PWA**: installazione su home screen.
- Sostituzione di **nome e logo** definitivi.
