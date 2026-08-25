import { NextResponse } from "next/server";
import { fetchMatches, fetchPlayers } from "@/lib/db";
import { formatError } from "@/lib/errors";
import { suggestTeams } from "@/lib/team-suggester";
import type { SuggestTeamsRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestTeamsRequest;
    const { playerIds, newPlayerMappings = {}, excludeKeys = [] } = body;

    if (!playerIds || playerIds.length !== 10) {
      return NextResponse.json(
        { error: "Debés seleccionar exactamente 10 jugadores" },
        { status: 400 }
      );
    }

    const [allPlayers, matches] = await Promise.all([
      fetchPlayers(),
      fetchMatches(),
    ]);

    const selectedPlayers = playerIds.map((id) => {
      const found = allPlayers.find((p) => p.id === id);
      if (!found) throw new Error(`Jugador no encontrado: ${id}`);
      return found;
    });

    const unknownPlayers = selectedPlayers.filter((p) => {
      const hasHistory = matches.some((m) =>
        m.participants.some((part) => part.player_id === p.id)
      );
      return !hasHistory && !newPlayerMappings[p.id];
    });

    if (unknownPlayers.length > 0) {
      return NextResponse.json(
        {
          error: "Hay jugadores sin historial. Asignalos a un jugador existente.",
          unknownPlayers: unknownPlayers.map((p) => ({
            id: p.id,
            name: p.nickname ?? p.name,
          })),
        },
        { status: 422 }
      );
    }

    const suggestion = suggestTeams(
      selectedPlayers,
      matches,
      newPlayerMappings,
      excludeKeys
    );

    if (!suggestion) {
      return NextResponse.json(
        { error: "No hay más combinaciones disponibles" },
        { status: 404 }
      );
    }

    return NextResponse.json(suggestion);
  } catch (error) {
    return NextResponse.json(
      { error: formatError(error, "Error al sugerir equipos") },
      { status: 500 }
    );
  }
}
