-- Quizwerk · Supabase-Schema
-- Im Supabase-Dashboard unter „SQL Editor“ einfügen und ausführen.

create extension if not exists "pgcrypto";

-- Quizze ---------------------------------------------------------------
create table if not exists public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  description text,
  questions   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Spielräume -----------------------------------------------------------
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  code        text not null check (code ~ '^[0-9]{6}$'),
  quiz_id     uuid not null references public.quizzes(id) on delete cascade,
  status      text not null default 'lobby' check (status in ('lobby', 'running', 'finished')),
  created_at  timestamptz not null default now(),
  started_at  timestamptz,
  finished_at timestamptz
);

-- Ein Code darf nur einmal gleichzeitig aktiv sein; beendete Spiele geben ihn frei.
create unique index if not exists games_active_code_idx
  on public.games (code) where status <> 'finished';
create index if not exists games_code_idx on public.games (code, created_at desc);

-- Spieler & Endergebnisse ---------------------------------------------
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games(id) on delete cascade,
  player_key  text not null,
  name        text not null,
  score       integer not null default 0,
  rank        integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists players_game_idx on public.players (game_id, rank);

-- Row Level Security ---------------------------------------------------
-- Empfohlen: SUPABASE_SERVICE_ROLE_KEY in .env.local setzen. Dann greift nur der
-- Next.js-Server auf die Tabellen zu und RLS kann geschlossen bleiben.
alter table public.quizzes enable row level security;
alter table public.games   enable row level security;
alter table public.players enable row level security;

-- Nur für Demos ohne Service-Role-Key: offene Policies für den anon-Key.
-- Für produktive Nutzung mit Authentifizierung ersetzen!
-- create policy "demo all quizzes" on public.quizzes for all to anon using (true) with check (true);
-- create policy "demo all games"   on public.games   for all to anon using (true) with check (true);
-- create policy "demo all players" on public.players for all to anon using (true) with check (true);

-- Hinweis: Für das Live-Spiel nutzt Quizwerk Supabase Realtime „Broadcast“ und „Presence“.
-- Dafür sind keine Tabellen nötig – Realtime ist in jedem Supabase-Projekt standardmäßig aktiv.
