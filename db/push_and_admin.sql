-- =====================================================================
-- Strato · push_subscriptions  (notifiche push Web)
-- =====================================================================
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, subscription)
);

alter table public.push_subscriptions enable row level security;

-- ogni utente gestisce solo le proprie subscription
-- Drop preventivo: consente di rieseguire questo file senza errori se le policy esistono già.
drop policy if exists "own subs select" on public.push_subscriptions;
drop policy if exists "own subs insert" on public.push_subscriptions;
drop policy if exists "own subs delete" on public.push_subscriptions;

create policy "own subs select" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "own subs insert" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "own subs delete" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
-- la Edge Function usa la service_role e bypassa la RLS in lettura.


-- =====================================================================
-- FIX: l'admin deve poter ELIMINARE gli ordini rifiutati
-- (l'errore "manca una policy DELETE per gli admin (RLS)" si risolve qui)
-- Nel tuo schema l'admin e' profiles.is_admin = true.
-- =====================================================================

drop policy if exists "admin delete orders" on public.orders;
create policy "admin delete orders" on public.orders
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "admin delete order_items" on public.order_items;
create policy "admin delete order_items" on public.order_items
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
