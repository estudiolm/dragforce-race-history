-- =========================================================
-- DRAGFORCE RACE HISTORY · SCHEMA SUPABASE
-- Cole este arquivo inteiro no SQL Editor do Supabase e rode uma vez.
-- Idempotente: pode rodar de novo sem quebrar nada (usa IF NOT EXISTS / OR REPLACE).
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- CARROS ----------
create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pilot text,
  category text,
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- ---------- EVENTOS ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  name text not null,
  location text,
  date date not null,
  created_at timestamptz not null default now()
);

-- ---------- PASSADAS ----------
-- time = tempo total (reação + 201m), é o valor usado para ranquear/gráfico.
create table if not exists public.passes (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  date date not null,
  lane text check (lane in ('E', 'D')),
  status text not null default 'valido' check (status in ('valido', 'queimou')),
  reaction_time numeric(5,3),
  t_60 numeric(6,3),
  t_100 numeric(6,3),
  t_201 numeric(6,3),
  trap_speed numeric(6,1),
  time numeric(6,3),
  notes text,
  created_at timestamptz not null default now()
);
-- migração incremental (para quem já tinha a tabela antes destes campos existirem)
alter table public.passes add column if not exists lane text check (lane in ('E', 'D'));
alter table public.passes add column if not exists status text not null default 'valido' check (status in ('valido', 'queimou'));
alter table public.passes add column if not exists t_60 numeric(6,3);
alter table public.passes add column if not exists t_100 numeric(6,3);
alter table public.passes add column if not exists t_201 numeric(6,3);

-- ---------- INSPEÇÕES ----------
create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  date date not null,
  type text not null,
  status text not null default 'ok' check (status in ('ok', 'attention', 'critical')),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- MANUTENÇÕES ----------
create table if not exists public.maintenances (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  date date not null,
  type text not null,
  km numeric(10,1),
  cost numeric(10,2),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- ÍNDICES ----------
create index if not exists idx_events_car_id on public.events(car_id);
create index if not exists idx_passes_car_id on public.passes(car_id);
create index if not exists idx_passes_event_id on public.passes(event_id);
create index if not exists idx_inspections_car_id on public.inspections(car_id);
create index if not exists idx_maintenances_car_id on public.maintenances(car_id);

-- ---------- ROW LEVEL SECURITY ----------
-- Regra simples para equipe pequena e privada: qualquer usuário autenticado
-- (login feito pela tela de login da aplicação) pode ler e escrever em tudo.
-- Ninguém sem login (anon) consegue ler ou escrever nada.

alter table public.cars enable row level security;
alter table public.events enable row level security;
alter table public.passes enable row level security;
alter table public.inspections enable row level security;
alter table public.maintenances enable row level security;

drop policy if exists "team full access" on public.cars;
create policy "team full access" on public.cars
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "team full access" on public.events;
create policy "team full access" on public.events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "team full access" on public.passes;
create policy "team full access" on public.passes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "team full access" on public.inspections;
create policy "team full access" on public.inspections
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "team full access" on public.maintenances;
create policy "team full access" on public.maintenances
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- STORAGE (fotos dos carros) ----------
-- Bucket público de LEITURA (para as fotos carregarem direto em <img>),
-- mas só usuários autenticados podem enviar/substituir/apagar arquivos.

insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', true)
on conflict (id) do nothing;

drop policy if exists "car photos public read" on storage.objects;
create policy "car photos public read" on storage.objects
  for select using (bucket_id = 'car-photos');

drop policy if exists "car photos team write" on storage.objects;
create policy "car photos team write" on storage.objects
  for insert with check (bucket_id = 'car-photos' and auth.role() = 'authenticated');

drop policy if exists "car photos team update" on storage.objects;
create policy "car photos team update" on storage.objects
  for update using (bucket_id = 'car-photos' and auth.role() = 'authenticated');

drop policy if exists "car photos team delete" on storage.objects;
create policy "car photos team delete" on storage.objects
  for delete using (bucket_id = 'car-photos' and auth.role() = 'authenticated');

-- =========================================================
-- Pronto. Depois de rodar este script:
-- 1. Crie os usuários da equipe em Authentication → Users → Add user
--    (recomendado: desativar "Enable email signups" em Authentication → Providers
--    para que só a equipe, cadastrada manualmente por vocês, consiga entrar).
-- 2. Pegue a Project URL e a anon public key em Project Settings → API
--    e cole em js/config.js na aplicação.
-- =========================================================
