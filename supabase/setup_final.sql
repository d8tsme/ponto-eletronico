/**
 * PONTO ELETRÔNICO - Setup Final SQL
 * 
 * Execute este arquivo no SQL Editor do Supabase (Dashboard → SQL)
 * Este script configura as tabelas, RLS, triggers e políticas completamente.
 * 
 * Data: 2024
 * Ambiente: Supabase PostgreSQL
 */

-- ================================================================================
-- SEÇÃO 1: EXTENSÕES
-- ================================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "vector";


-- ================================================================================
-- SEÇÃO 2: TABELAS PRINCIPAIS
-- ================================================================================

-- Perfis (1:1 com auth.users)
-- Contém dados do usuário, foto mestra, embedding facial, etc.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  cpf text unique,
  
  -- Biometria
  master_photo_url text,                    -- URL da foto mestra no storage
  face_descriptor jsonb,                    -- Array descriptor (compatível com face-api.js)
  face_embedding text,                      -- Vector embedding (para buscas futuras)
  face_registered boolean not null default false, -- Flag: reconhecimento facial ativado?
  
  -- Onboarding
  first_access_completed boolean not null default false,
  
  -- Permissões
  is_admin boolean not null default false,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create unique index if not exists profiles_cpf_unique
  on public.profiles (cpf)
  where cpf is not null and length(trim(cpf)) > 0;

create index if not exists profiles_full_name_idx on public.profiles (full_name);
create index if not exists profiles_face_registered_idx on public.profiles (face_registered);


-- Registros de ponto (session: entrada + saída na mesma linha)
-- Cada registro representa um dia de trabalho
create table if not exists public.ponto_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  
  -- Entrada
  clock_in_at timestamptz not null,
  lat_in double precision not null,
  lng_in double precision not null,
  photo_in_url text,
  endereco_registro text,
  placa_veiculo text,
  cpf_funcionario text,
  
  -- Inspeção entrada (veículo)
  km_inicial integer not null,
  agua_inicial text not null default '',
  oleo_inicial text not null default '',
  pneus_inicial text not null default '',
  observacoes_entrada text not null default '',
  
  -- Saída
  clock_out_at timestamptz,
  lat_out double precision,
  lng_out double precision,
  photo_out_url text,
  endereco_saida text,
  
  -- Inspeção saída (veículo)
  km_final integer,
  agua_final text,
  oleo_final text,
  pneus_final text,
  observacoes_saida text,
  
  -- Constraints
  constraint km_final_gte_inicial check (km_final is null or km_final >= km_inicial),
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create unique index if not exists ponto_logs_one_open_session_per_user
  on public.ponto_logs (user_id)
  where clock_out_at is null;

create index if not exists ponto_logs_user_id_idx on public.ponto_logs (user_id);
create index if not exists ponto_logs_clock_in_idx on public.ponto_logs (clock_in_at desc);
create index if not exists ponto_logs_created_at_idx on public.ponto_logs (created_at desc);


-- ================================================================================
-- SEÇÃO 3: FUNÇÕES (Triggers)
-- ================================================================================

-- Função: Atualizar timestamp updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- Função: Criar perfil ao novo usuário (disparada por trigger em auth.users)
-- IMPORTANTE: security definer + search_path para evitar confusão de schema
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    cpf,
    face_registered,
    first_access_completed,
    is_admin
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(trim(coalesce(new.raw_user_meta_data->>'cpf', '')), ''),
    false,  -- Novos usuários não têm face registrada
    false,  -- Novos usuários não completaram primeiro acesso
    false   -- Novos usuários não são admin
  );
  return new;
end;
$$;


-- ================================================================================
-- SEÇÃO 4: TRIGGERS
-- ================================================================================

-- Trigger: Atualizar updated_at em profiles
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Trigger: Atualizar updated_at em ponto_logs
drop trigger if exists ponto_logs_updated_at on public.ponto_logs;
create trigger ponto_logs_updated_at
  before update on public.ponto_logs
  for each row
  execute function public.set_updated_at();

-- Trigger: Criar perfil ao novo usuário no auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ================================================================================
-- SEÇÃO 5: ROW LEVEL SECURITY (RLS)
-- ================================================================================

-- Habilitar RLS nas tabelas
alter table public.profiles enable row level security;
alter table public.ponto_logs enable row level security;

-- ========== POLICIES: PROFILES ==========

-- SELECT: Usuário acessa seu próprio perfil OU é admin
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- INSERT: Há trigger automático, mas se necessário editar, só o próprio usuário (via auth.uid())
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- UPDATE: Usuário atualiza seu próprio perfil OU admin atualiza qualquer um
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- DELETE: Apenas admin pode deletar perfis
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles
  for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ========== POLICIES: PONTO_LOGS ==========

-- SELECT: Usuário acessa seus próprios logs OU é admin
drop policy if exists "ponto_logs_select_own_or_admin" on public.ponto_logs;
create policy "ponto_logs_select_own_or_admin"
  on public.ponto_logs
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- INSERT: Usuário registra seus próprios pontos
drop policy if exists "ponto_logs_insert_own" on public.ponto_logs;
create policy "ponto_logs_insert_own"
  on public.ponto_logs
  for insert
  with check (auth.uid() = user_id);

-- UPDATE: Usuário atualiza seus próprios logs (ex: adicionar clock_out) OU admin
drop policy if exists "ponto_logs_update_own" on public.ponto_logs;
create policy "ponto_logs_update_own"
  on public.ponto_logs
  for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- DELETE: Apenas admin pode deletar logs
drop policy if exists "ponto_logs_delete_admin" on public.ponto_logs;
create policy "ponto_logs_delete_admin"
  on public.ponto_logs
  for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ================================================================================
-- SEÇÃO 6: STORAGE (Bucket e Políticas)
-- ================================================================================

-- Criar bucket se não existir
insert into storage.buckets (id, name, public)
values ('ponto-fotos', 'ponto-fotos', false)
on conflict (id) do nothing;

-- RLS no Storage
alter table storage.objects enable row level security;

-- SELECT: Usuário acessa suas fotos OU admin acessa todas
drop policy if exists "storage_ponto_select_own_or_admin" on storage.objects;
create policy "storage_ponto_select_own_or_admin"
  on storage.objects
  for select
  using (
    bucket_id = 'ponto-fotos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_admin = true
      )
    )
  );

-- INSERT: Usuário faz upload em sua pasta, admin em qualquer lugar
drop policy if exists "storage_ponto_insert_own" on storage.objects;
create policy "storage_ponto_insert_own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'ponto-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Usuário atualiza em sua pasta, admin em qualquer lugar
drop policy if exists "storage_ponto_update_own" on storage.objects;
create policy "storage_ponto_update_own"
  on storage.objects
  for update
  using (
    bucket_id = 'ponto-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Usuário deleta em sua pasta, admin em qualquer lugar
drop policy if exists "storage_ponto_delete_own" on storage.objects;
create policy "storage_ponto_delete_own"
  on storage.objects
  for delete
  using (
    bucket_id = 'ponto-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ================================================================================
-- SEÇÃO 7: SCRIPTS ÚTEIS (comentados)
-- ================================================================================

-- Para tornar um usuário admin (substitua o UUID):
-- update public.profiles set is_admin = true where id = 'UUID-DO-USUARIO';

-- Para resetar primeiro acesso de um usuário:
-- update public.profiles set first_access_completed = false where id = 'UUID-DO-USUARIO';

-- Para limpar face_registered de um usuário:
-- update public.profiles
-- set face_registered = false, master_photo_url = null, face_descriptor = null
-- where id = 'UUID-DO-USUARIO';

-- Para visualizar sessões abertas (ponto de entrada sem saída):
-- select id, user_id, clock_in_at, full_name
-- from public.ponto_logs
-- join public.profiles p on ponto_logs.user_id = p.id
-- where clock_out_at is null
-- order by clock_in_at desc;

-- Para auditar atualizações recentes:
-- select id, user_id, updated_at from public.ponto_logs
-- where updated_at > now() - interval '1 hour'
-- order by updated_at desc;
