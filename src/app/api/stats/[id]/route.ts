import { NextResponse } from "next/server";
import { fetchMatches, fetchPlayers } from "@/lib/db";
import { formatError } from "@/lib/errors";
import { computePlayerStats } from "@/lib/stats";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [players, matches] = await Promise.all([fetchPlayers(), fetchMatches()]);
    const player = players.find((p) => p.id === id);

    if (!player) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    return NextResponse.json(computePlayerStats(player, matches, players));
  } catch (error) {
    return NextResponse.json(
      { error: formatError(error, "Error al calcular estadísticas") },
      { status: 500 }
    );
  }
}
