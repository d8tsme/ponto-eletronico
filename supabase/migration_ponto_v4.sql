-- Endereço, placa, CPF no registro + política admin (rodar após migration_ponto_v2.sql)

alter table public.ponto_logs add column if not exists endereco_registro text;
alter table public.ponto_logs add column if not exists endereco_saida text;
alter table public.ponto_logs add column if not exists placa_veiculo text;
alter table public.ponto_logs add column if not exists cpf_funcionario text;

-- profiles.cpf unique (pode já existir na v2)
alter table public.profiles add column if not exists cpf text;
drop index if exists profiles_cpf_unique;
create unique index profiles_cpf_unique
  on public.profiles (cpf)
  where cpf is not null and length(trim(cpf)) > 0;

-- Admin: leitura total dos logs (complementa políticas existentes)
drop policy if exists "Admin total access logs" on public.ponto_logs;
create policy "Admin total access logs"
  on public.ponto_logs for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

notify pgrst, 'reload schema';
