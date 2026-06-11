-- =====================================================================
-- STRATO · migrazione v3
-- Aggiunge il flag "permetti cavo intrecciato" per ogni prodotto.
-- Additiva e idempotente: eseguila nel SQL Editor di Supabase.
-- =====================================================================
alter table public.prints
  add column if not exists allow_braided boolean not null default true;
