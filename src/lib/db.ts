import { createSupabaseClient } from "./supabase";
import type { MatchWithParticipants, Player } from "./types";

export async function fetchPlayers(): Promise<Player[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function fetchMatches(): Promise<MatchWithParticipants[]> {
  const supabase = createSupabaseClient();

  const { data: matches, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .order("played_at", { ascending: false });

  if (matchError) throw matchError;
  if (!matches?.length) return [];

  const { data: participants, error: partError } = await supabase
    .from("match_participants")
    .select("*, player:players(*)")
    .in(
      "match_id",
      matches.map((m) => m.id)
    );

  if (partError) throw partError;

  return matches.map((match) => ({
    ...match,
    participants: (participants ?? [])
      .filter((p) => p.match_id === match.id)
      .map((p) => ({
        id: p.id,
        match_id: p.match_id,
        player_id: p.player_id,
        team: p.team,
        player: p.player as Player,
      })),
  }));
}
