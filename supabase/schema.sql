-- Ponto Eletrônico — Supabase schema, RLS e Storage
-- Execute no SQL Editor do Supabase (Dashboard → SQL)

-- Extensões
create extension if not exists "uuid-ossp";

-- Perfis (1:1 com auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  cpf text,
  master_photo_url text,
  face_descriptor jsonb,
  first_access_completed boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_cpf_unique
  on public.profiles (cpf)
  where cpf is not null and length(trim(cpf)) > 0;

-- Registros de ponto (sessão: entrada + saída na mesma linha)
create table if not exists public.ponto_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  lat_in double precision not null,
  lng_in double precision not null,
  lat_out double precision,
  lng_out double precision,
  photo_in_url text,
  photo_out_url text,
  km_inicial integer not null,
  km_final integer,
  agua_inicial text not null default '',
  oleo_inicial text not null default '',
  pneus_inicial text not null default '',
  observacoes_entrada text not null default '',
  agua_final text,
  oleo_final text,
  pneus_final text,
  observacoes_saida text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint km_final_gte_inicial check (km_final is null or km_final >= km_inicial)
);

create unique index if not exists ponto_logs_one_open_session_per_user
  on public.ponto_logs (user_id)
  where clock_out_at is null;

create index if not exists ponto_logs_user_id_idx on public.ponto_logs (user_id);
create index if not exists ponto_logs_clock_in_idx on public.ponto_logs (clock_in_at desc);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists ponto_logs_updated_at on public.ponto_logs;
create trigger ponto_logs_updated_at
  before update on public.ponto_logs
  for each row execute function public.set_updated_at();

-- Novo usuário → linha em profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, cpf)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(trim(coalesce(new.raw_user_meta_data->>'cpf', '')), '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.ponto_logs enable row level security;

-- Profiles: usuário vê/edita o próprio; admin vê todos
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Ponto logs: próprio usuário CRUD; admin SELECT
drop policy if exists "ponto_select_own_or_admin" on public.ponto_logs;
create policy "ponto_select_own_or_admin"
  on public.ponto_logs for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "ponto_insert_own" on public.ponto_logs;
create policy "ponto_insert_own"
  on public.ponto_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "ponto_update_own" on public.ponto_logs;
create policy "ponto_update_own"
  on public.ponto_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage: bucket para fotos
insert into storage.buckets (id, name, public)
values ('ponto-fotos', 'ponto-fotos', false)
on conflict (id) do nothing;

-- Políticas Storage: pasta userId/...
drop policy if exists "storage_ponto_select_own_or_admin" on storage.objects;
create policy "storage_ponto_select_own_or_admin"
  on storage.objects for select
  using (
    bucket_id = 'ponto-fotos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    )
  );

drop policy if exists "storage_ponto_insert_own" on storage.objects;
create policy "storage_ponto_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'ponto-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_ponto_update_own" on storage.objects;
create policy "storage_ponto_update_own"
  on storage.objects for update
  using (
    bucket_id = 'ponto-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_ponto_delete_own" on storage.objects;
create policy "storage_ponto_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'ponto-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Opcional: tornar um usuário admin (substitua o UUID)
-- update public.profiles set is_admin = true where id = 'UUID-DO-USUARIO';
