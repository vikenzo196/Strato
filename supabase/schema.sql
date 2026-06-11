-- =====================================================================
-- STRATO · schema Supabase  (versione WhatsApp + like + commenti)
-- Esegui tutto questo nel SQL Editor di Supabase (una sola volta).
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROFILI
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- STAMPE (catalogo) — con contatore like
-- ---------------------------------------------------------------------
create table if not exists public.prints (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  price       numeric(10,2) not null default 0,
  material    text default '',
  dimensions  text default '',
  print_time  text default '',
  images      text[] not null default '{}',
  like_count  integer not null default 0,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
alter table public.prints enable row level security;

create policy "prints_select_all" on public.prints
  for select using (true);
create policy "prints_admin_insert" on public.prints
  for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
create policy "prints_admin_update" on public.prints
  for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
create policy "prints_admin_delete" on public.prints
  for delete using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ---------------------------------------------------------------------
-- LIKE (cuoricino) — una riga per utente/stampa; il conteggio pubblico
-- vive in prints.like_count (aggiornato dai trigger qui sotto)
-- ---------------------------------------------------------------------
create table if not exists public.likes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  print_id   uuid not null references public.prints(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, print_id)
);
alter table public.likes enable row level security;
create policy "likes_own" on public.likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.on_like_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.prints set like_count = like_count + 1 where id = new.print_id;
  elsif (tg_op = 'DELETE') then
    update public.prints set like_count = greatest(like_count - 1, 0) where id = old.print_id;
  end if;
  return null;
end; $$;

drop trigger if exists trg_like_ins on public.likes;
drop trigger if exists trg_like_del on public.likes;
create trigger trg_like_ins after insert on public.likes for each row execute function public.on_like_change();
create trigger trg_like_del after delete on public.likes for each row execute function public.on_like_change();

-- ---------------------------------------------------------------------
-- COMMENTI
-- ---------------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  print_id   uuid not null references public.prints(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  user_name  text,
  body       text not null,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;

-- lettura pubblica dei commenti
create policy "comments_select_all" on public.comments
  for select using (true);
-- ognuno scrive a proprio nome
create policy "comments_insert_own" on public.comments
  for insert with check (auth.uid() = user_id);
-- cancella i propri commenti, oppure l'admin cancella qualsiasi commento
create policy "comments_delete_own_or_admin" on public.comments
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------------------------------------------------------------------
-- STORAGE: bucket pubblico per le foto delle stampe
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('prints', 'prints', true)
on conflict (id) do nothing;

create policy "prints_storage_read" on storage.objects
  for select using (bucket_id = 'prints');
create policy "prints_storage_admin_write" on storage.objects
  for insert with check (bucket_id = 'prints' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
create policy "prints_storage_admin_delete" on storage.objects
  for delete using (bucket_id = 'prints' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- =====================================================================
-- DOPO il primo accesso, rendi TE amministratore (sostituisci l'email):
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'tua@email.com');
-- =====================================================================
