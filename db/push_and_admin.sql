-- =====================================================================
-- STRATO · notifiche Web Push + policy admin delete ordini
-- Esegui questo file nel SQL Editor di Supabase.
-- Additivo e rieseguibile: non cancella dati esistenti.
-- =====================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  endpoint text generated always as (subscription->>'endpoint') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create unique index if not exists push_subscriptions_user_endpoint_key
  on public.push_subscriptions(user_id, endpoint);

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions(user_id);

-- L'utente gestisce solo le proprie subscription dispositivo.
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- L'Edge Function usa la service role per leggere/inviare e pulire subscription scadute.
-- Queste policy servono al client per upsertare la propria subscription.

-- Policy DELETE admin per consentire l'eliminazione degli ordini rifiutati dall'app.
drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "order_items_admin_delete" on public.order_items;
create policy "order_items_admin_delete" on public.order_items
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
