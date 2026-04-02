-- Migração: CPF em profiles + checklist textual em ponto_logs
-- Execute no SQL Editor do Supabase (projeto já existente).

-- 1) CPF no perfil
alter table public.profiles
  add column if not exists cpf text;

comment on column public.profiles.cpf is 'CPF (recomendado: 11 dígitos, sem formatação)';

drop index if exists profiles_cpf_unique;
create unique index profiles_cpf_unique
  on public.profiles (cpf)
  where cpf is not null and length(trim(cpf)) > 0;

-- 2) Novas colunas em ponto_logs
alter table public.ponto_logs add column if not exists agua_inicial text;
alter table public.ponto_logs add column if not exists oleo_inicial text;
alter table public.ponto_logs add column if not exists pneus_inicial text;
alter table public.ponto_logs add column if not exists observacoes_entrada text;

alter table public.ponto_logs add column if not exists agua_final text;
alter table public.ponto_logs add column if not exists oleo_final text;
alter table public.ponto_logs add column if not exists pneus_final text;
alter table public.ponto_logs add column if not exists observacoes_saida text;

-- 3) Migrar dados legados (checkboxes + observacoes_veiculo), se existirem
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ponto_logs' and column_name = 'check_water'
  ) then
    update public.ponto_logs set
      agua_inicial = coalesce(agua_inicial, case when check_water then 'Ok (legado)' else '—' end),
      oleo_inicial = coalesce(oleo_inicial, case when check_oil then 'Ok (legado)' else '—' end),
      pneus_inicial = coalesce(pneus_inicial, case when check_tires then 'Ok (legado)' else '—' end),
      observacoes_entrada = coalesce(observacoes_entrada, observacoes_veiculo, '');
  else
    update public.ponto_logs set
      agua_inicial = coalesce(agua_inicial, ''),
      oleo_inicial = coalesce(oleo_inicial, ''),
      pneus_inicial = coalesce(pneus_inicial, ''),
      observacoes_entrada = coalesce(observacoes_entrada, '');
  end if;
end $$;

update public.ponto_logs set agua_inicial = '' where agua_inicial is null;
update public.ponto_logs set oleo_inicial = '' where oleo_inicial is null;
update public.ponto_logs set pneus_inicial = '' where pneus_inicial is null;
update public.ponto_logs set observacoes_entrada = '' where observacoes_entrada is null;

alter table public.ponto_logs drop column if exists check_water;
alter table public.ponto_logs drop column if exists check_oil;
alter table public.ponto_logs drop column if exists check_tires;
alter table public.ponto_logs drop column if exists observacoes_veiculo;

alter table public.ponto_logs alter column agua_inicial set default '';
alter table public.ponto_logs alter column oleo_inicial set default '';
alter table public.ponto_logs alter column pneus_inicial set default '';
alter table public.ponto_logs alter column observacoes_entrada set default '';

alter table public.ponto_logs alter column agua_inicial set not null;
alter table public.ponto_logs alter column oleo_inicial set not null;
alter table public.ponto_logs alter column pneus_inicial set not null;
alter table public.ponto_logs alter column observacoes_entrada set not null;

-- 4) Trigger signup: grava CPF do raw_user_meta_data
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
