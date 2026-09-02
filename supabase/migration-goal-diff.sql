-- Migración: pasar de goles exactos a ganador + diferencia
-- Ejecutar en SQL Editor si ya tenés la tabla matches creada

alter table matches add column if not exists winner text;
alter table matches add column if not exists goal_difference integer;

update matches
set
  goal_difference = abs(team_a_score - team_b_score),
  winner = case
    when team_a_score > team_b_score then 'A'
    when team_b_score > team_a_score then 'B'
    else 'draw'
  end
where winner is null;

alter table matches
  add constraint matches_winner_check check (winner in ('A', 'B', 'draw'));

alter table matches
  add constraint matches_goal_difference_check check (goal_difference >= 0);

alter table matches alter column winner set not null;
alter table matches alter column goal_difference set not null;

alter table matches drop column if exists team_a_score;
alter table matches drop column if exists team_b_score;
