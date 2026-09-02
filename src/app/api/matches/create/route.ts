import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, verifyAdminRequest } from "@/lib/admin-server";
import { formatError } from "@/lib/errors";
import { createSupabaseClient } from "@/lib/supabase";
import { averageRating, calculateEloDelta, matchOutcomeFromWinner } from "@/lib/elo";
import type { MatchWinner, TeamSide } from "@/lib/types";

interface ParticipantInput {
  player_id: string;
  team: TeamSide;
}

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return adminUnauthorizedResponse();

  try {
    const body = await request.json();
    const { played_at, venue, winner, goal_difference, participants } = body as {
      played_at: string;
      venue: string;
      winner: MatchWinner;
      goal_difference: number;
      participants: ParticipantInput[];
    };

    if (!played_at || !venue?.trim()) {
      return NextResponse.json(
        { error: "Fecha y cancha son obligatorias" },
        { status: 400 }
      );
    }

    if (!["A", "B", "draw"].includes(winner)) {
      return NextResponse.json(
        { error: "Resultado inválido" },
        { status: 400 }
      );
    }

    const diff = Number(goal_difference);
    if (winner === "draw") {
      if (diff !== 0) {
        return NextResponse.json(
          { error: "En un empate la diferencia debe ser 0" },
          { status: 400 }
        );
      }
    } else if (!Number.isInteger(diff) || diff < 1) {
      return NextResponse.json(
        { error: "Indicá la diferencia de goles (mínimo 1)" },
        { status: 400 }
      );
    }

    const teamA = participants.filter((p) => p.team === "A");
    const teamB = participants.filter((p) => p.team === "B");

    if (teamA.length !== 5 || teamB.length !== 5) {
      return NextResponse.json(
        { error: "Cada equipo debe tener exactamente 5 jugadores" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const allIds = participants.map((p) => p.player_id);

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, elo_rating")
      .in("id", allIds);

    if (playersError) throw playersError;

    const ratingMap = new Map(players?.map((p) => [p.id, p.elo_rating]) ?? []);
    const teamARatings = teamA.map((p) => ratingMap.get(p.player_id) ?? 1000);
    const teamBRatings = teamB.map((p) => ratingMap.get(p.player_id) ?? 1000);

    const avgA = averageRating(teamARatings);
    const avgB = averageRating(teamBRatings);

    const outcomeA = matchOutcomeFromWinner("A", winner);
    const outcomeB = matchOutcomeFromWinner("B", winner);

    const deltaA = calculateEloDelta(avgA, avgB, outcomeA);
    const deltaB = calculateEloDelta(avgB, avgA, outcomeB);

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        played_at,
        venue: venue.trim(),
        winner,
        goal_difference: winner === "draw" ? 0 : diff,
      })
      .select()
      .single();

    if (matchError) throw matchError;

    const participantRows = participants.map((p) => ({
      match_id: match.id,
      player_id: p.player_id,
      team: p.team,
    }));

    const { error: partError } = await supabase
      .from("match_participants")
      .insert(participantRows);

    if (partError) throw partError;

    for (const p of teamA) {
      const current = ratingMap.get(p.player_id) ?? 1000;
      await supabase
        .from("players")
        .update({ elo_rating: Math.round(current + deltaA) })
        .eq("id", p.player_id);
    }

    for (const p of teamB) {
      const current = ratingMap.get(p.player_id) ?? 1000;
      await supabase
        .from("players")
        .update({ elo_rating: Math.round(current + deltaB) })
        .eq("id", p.player_id);
    }

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: formatError(error, "Error al registrar partido") },
      { status: 500 }
    );
  }
}
