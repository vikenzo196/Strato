-- =====================================================================
-- STRATO · migrazione v2  (porting "Liquid Glass")
-- Aggiunge: categorie, palette colori per prodotto + foto per colore,
-- aggiunte elettriche con prezzi impostabili dall'admin, ordini con
-- righe + opzioni + stato + data, foto profilo Google e preferenze
-- tema/sfondo per utente. Rimuove la dipendenza da WhatsApp lato dati.
--
-- È ADDITIVA e IDEMPOTENTE: puoi eseguirla nel SQL Editor di Supabase
-- anche se hai già lo schema base. Non cancella nulla di esistente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROFILI: foto Google + preferenze tema/sfondo
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists pref_theme text default 'auto';
alter table public.profiles add column if not exists pref_bg    text default '';

-- l'utente può aggiornare le proprie preferenze (policy update_own già esiste)

-- aggiorna il trigger di creazione profilo per salvare anche la foto Google
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do update
    set avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end; $$;

-- ---------------------------------------------------------------------
-- CATEGORIE (nome + icona "glass" del prototipo, es. 'v_classico')
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  icon       text not null default 'v_classico',
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories
  for select using (true);
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ---------------------------------------------------------------------
-- PRINTS (prodotti): categoria + flag elettrico + prezzi aggiunte
-- ---------------------------------------------------------------------
alter table public.prints add column if not exists category_id   uuid references public.categories(id) on delete set null;
alter table public.prints add column if not exists is_electrical boolean not null default false;
alter table public.prints add column if not exists addon_braided numeric(10,2) not null default 0; -- cavo intrecciato
alter table public.prints add column if not exists addon_bulb    numeric(10,2) not null default 0; -- lampadina
alter table public.prints add column if not exists addon_holder  numeric(10,2) not null default 0; -- portalampada

-- ---------------------------------------------------------------------
-- PALETTE COLORI per prodotto, con foto opzionale per ogni colore
-- (il "selettore colore" del prototipo = selettore foto)
-- ---------------------------------------------------------------------
create table if not exists public.print_colors (
  id        uuid primary key default gen_random_uuid(),
  print_id  uuid not null references public.prints(id) on delete cascade,
  name      text not null,
  color_a   text not null default '#cccccc',
  color_b   text not null default '#999999',
  image_url text,
  position  int  not null default 0
);
alter table public.print_colors enable row level security;

drop policy if exists "print_colors_select_all" on public.print_colors;
create policy "print_colors_select_all" on public.print_colors
  for select using (true);
drop policy if exists "print_colors_admin_write" on public.print_colors;
create policy "print_colors_admin_write" on public.print_colors
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ---------------------------------------------------------------------
-- ORDINI (sostituiscono il flusso WhatsApp) + RIGHE con scomposizione
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  customer_name   text,
  customer_avatar text,
  status          text not null default 'pending',  -- pending | confirmed | rejected
  total           numeric(10,2) not null default 0,
  created_at      timestamptz not null default now()
);
alter table public.orders enable row level security;

-- il cliente vede i propri ordini, l'admin li vede tutti
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
-- il cliente crea i propri ordini
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);
-- solo l'admin conferma/rifiuta (update)
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  print_id   uuid references public.prints(id) on delete set null,
  title      text not null,
  color_name text,
  base_price numeric(10,2) not null default 0,
  adds       jsonb not null default '[]',   -- [{ "label": "Lampadina", "amt": 5 }, ...]
  opt        text,                          -- riassunto testuale delle aggiunte
  unit_price numeric(10,2) not null default 0,
  qty        int  not null default 1,
  image_url  text
);
alter table public.order_items enable row level security;

-- si vedono le righe degli ordini visibili (propri o, se admin, tutti)
drop policy if exists "order_items_select_visible" on public.order_items;
create policy "order_items_select_visible" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
    )
  );
-- si inseriscono righe solo per un proprio ordine
drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- INDICI utili
-- ---------------------------------------------------------------------
create index if not exists idx_print_colors_print on public.print_colors(print_id);
create index if not exists idx_order_items_order  on public.order_items(order_id);
create index if not exists idx_orders_status      on public.orders(status);

-- =====================================================================
-- NOTE
-- • Le foto dei prodotti (catalogo e per-colore) restano nel bucket
--   pubblico 'prints' già creato nello schema base.
-- • WhatsApp non serve più lato dati: l'ordine ora vive in 'orders'.
-- • Ricordati di esserti reso admin (vedi fondo dello schema base).
-- =====================================================================
