# IMPLEMENTATION NOTES — Strato v3 React

## Architettura del guscio
`AppShell` contiene, nell'ordine: `BackgroundSystem` → `TopBar` → `PageSurface` (contenuto pagina) → `Dock` → `GlobalLayers`. La **dock vive nel guscio**, mai nelle singole pagine, ed è identica su ogni schermata.

## Dock (definitiva)
Home / Esplora / Piaciuti / Carrello — sempre ancorata, stessa posizione. Profilo, Ordini, Notifiche, Categorie **non** sono nella dock. La dock usata è quella prescelta/precedente (outline `#8B7355`), non la variante degli screen night.

## Dettaglio articolo
Route `/articolo/:id`. **Copre la dock** (`AppShell` la nasconde via `HIDE_DOCK`). Il back in alto a sinistra torna alla schermata precedente con la dock di nuovo visibile.

## Dettaglio ordine (bottom sheet)
`OrderDetailSheet`: overlay caldo, apertura dal basso, handle con **drag-down che segue il dito** (pointer events), **fling verso il basso (>140px) chiude**, X chiude. Sotto, la dock resta coperta dall'overlay.

## TopBar
Logo Strato centrato; back quando serve (Profilo, Ordini, Articolo); campanella accanto al profilo, **più piccola dell'avatar**; badge solo se `unreadNotifications > 0`; avatar guest materico `#A94F38` (mai blu); avatar loggato = placeholder Google.

## Stati vuoti
Cart vuoto V3 usa l'illustrazione (`empty_cart_v3_{theme}.png`). Piaciuti e Ordini usano icona + copy. I toggle `EMPTY` in `FavoritesPage`, `CartPage`, `OrdersPage` permettono di vedere lo stato vuoto.

## Copy — vincoli rispettati
Usati i copy obbligatori (Home, Piaciuti, Carrello, Ordini, Profilo admin "Aggiungi un oggetto."). **Mai** usati: catalogo, shop, acquista/compra ora, offerta, sconto, più venduti, stock, promo, wishlist.

## Bug evitati
- Nessun artefatto `>` sul bordo sinistro (icone come componenti SVG, non entity).
- Nessun avatar guest blu (terracotta).
- Nessun filtro "Prezzo ↑" in Piaciuti.
- Dock unica, nel guscio, mai per-pagina.
- Comandi admin nascosti a guest/cliente.
- Nessun nero puro in night.
- Immagini prodotto non filtrate/ricolorate.

## Prossimi passi verso produzione
1. Sostituire i mock in `data/` con query reali (Supabase): tabelle suggerite `products`, `product_colors`, `product_accessories`, `orders`, `order_lines`, `favorites`, `profiles` (con `role`).
2. Aggiungere Supabase Auth (login Google) e proteggere i controlli admin lato server (RLS).
3. Foto prodotto reali su sfondo neutro al posto delle silhouette.
4. Generare icone/splash PWA e completare `vite-plugin-pwa`.
5. Collegare repo a Vercel: il deploy parte in automatico ad ogni push.
