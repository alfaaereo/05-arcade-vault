-- SPEC 06: catálogo mínimo de juegos reales y leaderboard público.

create table public.games (
  id text primary key, -- igual al id de lib/games.ts
  title text not null,
  created_at timestamptz not null default now()
);

create table public.leaderboard (
  id bigint generated always as identity primary key,
  game_id text not null references public.games (id),
  player_name text not null
    check (player_name ~ '^[A-Z0-9_ ]{1,10}$' and player_name = btrim(player_name)),
  score integer not null check (score between 0 and 10000000),
  created_at timestamptz not null default now()
);

create index leaderboard_game_score_idx
  on public.leaderboard (game_id, score desc, created_at);

alter table public.games enable row level security;
alter table public.leaderboard enable row level security;

create policy "games: lectura pública"
  on public.games for select
  to anon, authenticated
  using (true);

create policy "leaderboard: lectura pública"
  on public.leaderboard for select
  to anon, authenticated
  using (true);

-- Riesgo aceptado (SPEC 06): inserción anónima limitada a nombre y puntuación válidos.
create policy "leaderboard: inserción pública limitada"
  on public.leaderboard for insert
  to anon, authenticated
  with check (
    player_name ~ '^[A-Z0-9_ ]{1,10}$'
    and player_name = btrim(player_name)
    and score between 0 and 10000000
  );

-- Permisos explícitos: se retiran los privilegios por defecto y se da solo lo necesario.
revoke all on public.games, public.leaderboard from anon, authenticated;
grant select on public.games, public.leaderboard to anon, authenticated;
-- Por columnas: el cliente no puede fijar id ni created_at.
grant insert (game_id, player_name, score) on public.leaderboard to anon, authenticated;

insert into public.games (id, title) values ('asteroids', 'ASTEROIDS');
