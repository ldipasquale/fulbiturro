-- Ejecutar en el SQL Editor de Supabase

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  position text check (position in ('arquero', 'defensa', 'mediocampo', 'delantero', 'cualquiera')),
  elo_rating numeric not null default 1000,
  reference_player_id uuid references players(id) on delete set null,
  created_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  played_at date not null,
  venue text not null,
  winner text not null check (winner in ('A', 'B', 'draw')),
  goal_difference integer not null check (goal_difference >= 0),
  created_at timestamptz not null default now(),
  constraint matches_draw_zero_diff check (
    (winner = 'draw' and goal_difference = 0) or (winner != 'draw' and goal_difference >= 1)
  )
);

create table match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  team text not null check (team in ('A', 'B')),
  unique (match_id, player_id)
);

create index idx_match_participants_player on match_participants(player_id);
create index idx_match_participants_match on match_participants(match_id);
create index idx_matches_played_at on matches(played_at desc);

-- App personal sin login: acceso abierto (solo vos tenés la URL)
alter table players enable row level security;
alter table matches enable row level security;
alter table match_participants enable row level security;

create policy "Acceso público players" on players for all using (true) with check (true);
create policy "Acceso público matches" on matches for all using (true) with check (true);
create policy "Acceso público match_participants" on match_participants for all using (true) with check (true);
