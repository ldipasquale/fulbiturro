import type { MatchWithParticipants, Player, PlayerStats } from "./types";

async function parseResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data === "object" && data !== null && "error" in data
        ? String(data.error)
        : fallbackError
    );
  }
  return data as T;
}

export async function loadPlayers(): Promise<Player[]> {
  const res = await fetch("/api/players");
  const data = await parseResponse<Player[] | unknown>(res, "Error al cargar jugadores");
  return Array.isArray(data) ? data : [];
}

export async function loadMatches(): Promise<MatchWithParticipants[]> {
  const res = await fetch("/api/matches");
  const data = await parseResponse<MatchWithParticipants[] | unknown>(
    res,
    "Error al cargar partidos"
  );
  return Array.isArray(data) ? data : [];
}

export async function loadStats(): Promise<PlayerStats[]> {
  const res = await fetch("/api/stats");
  const data = await parseResponse<PlayerStats[] | unknown>(
    res,
    "Error al calcular estadísticas"
  );
  return Array.isArray(data) ? data : [];
}
