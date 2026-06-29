# Strato v3 — React Handoff 01

Prototipo statico fedele ai render approvati. Boutique digitale premium di oggetti di design 3D: caldo, materico, editoriale, mobile-first.

Stack: **Vite + React + TypeScript**, **vanilla CSS con variabili globali + CSS Modules-ready**. Nessun Tailwind, nessun CSS-in-JS, nessun backend, nessun Supabase, nessuna auth reale.

## Installazione

```bash
npm install
npm run dev      # avvia in locale (http://localhost:5173)
npm run build    # build di produzione in /dist
npm run preview  # anteprima della build
```

Il registry è bloccato su npm pubblico tramite `.npmrc`. Non sono inclusi `node_modules` né `package-lock.json`.

## Struttura

```
src/
  app/            App.tsx (router) · routes.ts (path + dock items)
  shell/          AppShell · ThemeProvider · BackgroundSystem · PageSurface · GlobalLayers
  layout/         TopBar · Dock
  pages/          Home · Explore · Favorites · Cart · Profile · Orders
  product/        ProductDetail + Hero/Info/Color/Accessories/QuantityCTA
  orders/         OrderCard · OrderStatusTabs · OrderDetailSheet
  cart/           CartEmptyV3 · CartFilled · CartItem · CartSummary
  components/     ProductCard · CardRow · SearchInput · EmptyState · CTA · QuantityStepper · icons
  data/           mockProducts · mockOrders · mockUser · mockCategories
  styles/         tokens.css · base.css · shell.css · components.css · pages.css
  assets/         backgrounds/ empty-states/ products/ icons/ profile/  (dal freeze-01)
```

## Tema light / night

`ThemeProvider` imposta `data-theme="light|night"` sul guscio `.app-shell`; tutti i colori sono variabili CSS in `tokens.css`. Un pulsante **☾ Night / ☀ Light** in basso a destra alterna i temi (helper di prototipo).

- Light: canvas `#EDE4D8`.
- Night: espresso/cacao caldo `#2E1C0E` — niente nero puro, blu tech, grigio freddo, neon, bianco clinico.

## Sfondi (blob)

`BackgroundSystem` mappa la route → asset sfondo dedicato (`assets/backgrounds/{theme}/bg_{page}_{theme}.png`). Gli sfondi **non** vengono rigenerati a runtime né derivati dalla Home: sono gli asset pre-renderizzati del freeze.

## Ruoli e admin

`data/mockUser.ts` espone `role: 'guest' | 'cliente' | 'admin'` (default `admin` per la demo). I controlli admin (camera prodotto, matita prodotto, "Aggiungi un oggetto", Conferma/Rifiuta ordini) compaiono solo se `isAdmin`. Cambia `role` per verificare guest/cliente.

## Funzioni MOCK (presenti ma finte)
- SearchBar (Home + Esplora): input statico, nessuna logica.
- Dati prodotti/ordini/utente: mock in `data/`.
- Quantità, selettore colore, configuratore accessori: stato locale, nessuna persistenza.
- Avatar loggato: placeholder Google.

## Funzioni SOSPESE (non implementate — da brief)
- Search overlay predittivo
- Notifiche complete
- Nuovo prodotto / flusso admin di modifica
- Installazione app (PWA install flow)
- Conferma dopo "Invia richiesta"
- Supabase / auth reale / backend

## Note immagini prodotto
Le immagini prodotto sono **silhouette segnaposto** (non foto reali), ereditate dal freeze. Sostituire con foto reali su sfondo neutro prima della produzione. `products/orologio/` non ha asset (MISSING nel freeze).
