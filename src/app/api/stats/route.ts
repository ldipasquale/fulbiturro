import { NextResponse } from "next/server";
import { fetchMatches, fetchPlayers } from "@/lib/db";
import { formatError } from "@/lib/errors";
import { computePlayerStats } from "@/lib/stats";

export async function GET() {
  try {
    const [players, matches] = await Promise.all([fetchPlayers(), fetchMatches()]);
    const stats = players.map((p) => computePlayerStats(p, matches, players));
    stats.sort((a, b) => b.eloRating - a.eloRating);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: formatError(error, "Error al calcular estadísticas") },
      { status: 500 }
    );
  }
}
