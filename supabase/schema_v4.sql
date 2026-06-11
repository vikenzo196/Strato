-- =====================================================================
-- STRATO · migrazione v4
-- 1) flag "in evidenza" (carosello home) per ogni prodotto
-- 2) fino a 5 foto per ogni colorazione (array di URL)
-- Additiva e idempotente: eseguila nel SQL Editor di Supabase.
-- =====================================================================
alter table public.prints
  add column if not exists featured boolean not null default false;

alter table public.print_colors
  add column if not exists images text[] not null default '{}';
