"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loadPlayers } from "@/lib/api-client";
import type { Player, TeamSide } from "@/lib/types";

export default function NuevoPartidoPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split("T")[0]);
  const [venue, setVenue] = useState("");
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [teamA, setTeamA] = useState<Set<string>>(new Set());
  const [teamB, setTeamB] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadPlayers()
      .then(setPlayers)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Error al cargar"));
  }, []);

  const togglePlayer = (id: string, team: TeamSide) => {
    const otherTeam = team === "A" ? teamB : teamA;
    const setTeam = team === "A" ? setTeamA : setTeamB;
    const currentTeam = team === "A" ? teamA : teamB;

    if (otherTeam.has(id)) {
      const newOther = new Set(otherTeam);
      newOther.delete(id);
      if (team === "A") setTeamB(newOther);
      else setTeamA(newOther);
    }

    setTeam((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (teamA.size !== 5 || teamB.size !== 5) {
      setError("Cada equipo debe tener exactamente 5 jugadores");
      return;
    }

    setLoading(true);
    try {
      const participants = [
        ...Array.from(teamA).map((id) => ({ player_id: id, team: "A" as TeamSide })),
        ...Array.from(teamB).map((id) => ({ player_id: id, team: "B" as TeamSide })),
      ];

      const res = await fetch("/api/matches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          played_at: playedAt,
          venue,
          team_a_score: teamAScore,
          team_b_score: teamBScore,
          participants,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al registrar");
      }

      router.push("/partidos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  const assignedIds = new Set([...teamA, ...teamB]);
  const unassigned = players.filter((p) => !assignedIds.has(p.id));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registrar partido</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Asigná 5 jugadores por equipo y cargá el resultado
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {loadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha"
            type="date"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
            required
          />
          <Input
            label="Cancha"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
            placeholder="Complejo Los Amigos"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Goles Equipo A"
            type="number"
            min={0}
            value={teamAScore}
            onChange={(e) => setTeamAScore(Number(e.target.value))}
            required
          />
          <Input
            label="Goles Equipo B"
            type="number"
            min={0}
            value={teamBScore}
            onChange={(e) => setTeamBScore(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PlayerPicker
            label={`Equipo A (${teamA.size}/5)`}
            players={players}
            selected={teamA}
            onToggle={(id) => togglePlayer(id, "A")}
            color="emerald"
          />
          <PlayerPicker
            label={`Equipo B (${teamB.size}/5)`}
            players={players}
            selected={teamB}
            onToggle={(id) => togglePlayer(id, "B")}
            color="blue"
          />
        </div>

        {unassigned.length > 0 && (
          <p className="text-sm text-zinc-500">
            {unassigned.length} jugador{unassigned.length !== 1 && "es"} no participó en este partido
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Guardando..." : "Registrar partido"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PlayerPicker({
  label,
  players,
  selected,
  onToggle,
  color,
}: {
  label: string;
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  color: "emerald" | "blue";
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-3",
        color === "emerald"
          ? "border-emerald-200 dark:border-emerald-900"
          : "border-blue-200 dark:border-blue-900"
      )}
    >
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {players.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className={clsx(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                isSelected
                  ? color === "emerald"
                    ? "bg-emerald-100 dark:bg-emerald-950"
                    : "bg-blue-100 dark:bg-blue-950"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <span className="font-medium">{p.nickname ?? p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
