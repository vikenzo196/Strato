# STRATO — Architecture Lock

## Stato
Strato resta una boutique digitale premium, mobile-first, calda e materica.

## Hard lock
- Dock: non modificare senza richiesta esplicita.
- Topbar: non modificare senza richiesta esplicita.
- Scroll / safe-area / keyboard handling: non modificare senza richiesta esplicita.
- `#appbg`: considerare sempre nei fix di canvas/backplane.
- Carrello vuoto: fullscreen, no-scroll, ordine testo → immagine → CTA.

## Component boundary
- `src/App.jsx`: orchestrazione, stato e flussi principali.
- `src/components/home/Home.jsx`: rendering Home, hero e griglia Home. Nessuna logica globale.
- `src/styles/app.css`: fonte CSS principale; evitare nuovi override globali non scoped.
- `src/ui/visuals.jsx`: icone e primitive visuali.
- `src/utils/*`: utility pure.
- `src/lib/supabase.js`: client Supabase.

## Change discipline
Ogni patch futura deve essere classificata:

- Type A: tweak visuale locale.
- Type B: modifica componente controllata.
- Type C: cambio architetturale, bloccato salvo richiesta esplicita.

## Regole anti-regressione
- Nessun refactor globale non richiesto.
- Nessun replace CSS cieco.
- Nessuna nuova libreria senza motivazione reale.
- Ogni patch deve produrre ZIP completo, file modificati e diff.
