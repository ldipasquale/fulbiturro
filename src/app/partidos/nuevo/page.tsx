"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PlayerAvatar";
import { useAdmin } from "@/context/AdminContext";
import { adminFetch } from "@/lib/admin-client";
import { loadPlayers } from "@/lib/api-client";
import type { Player, TeamSide } from "@/lib/types";

export default function NuevoPartidoPage() {
  const router = useRouter();
  const { isUnlocked, isReady } = useAdmin();
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
    if (isReady && !isUnlocked) {
      router.replace("/partidos");
    }
  }, [isReady, isUnlocked, router]);

  useEffect(() => {
    loadPlayers()
      .then(setPlayers)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Error al cargar"));
  }, []);

  const togglePlayer = (id: string, team: TeamSide) => {
    const otherTeam = team === "A" ? teamB : teamA;
    const setTeam = team === "A" ? setTeamA : setTeamB;

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

      const res = await adminFetch("/api/matches/create", {
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

  if (!isReady || !isUnlocked) {
    return (
      <PageContainer>
        <p className="text-muted">Redirigiendo...</p>
      </PageContainer>
    );
  }

  const assignedIds = new Set([...teamA, ...teamB]);
  const unassigned = players.filter((p) => !assignedIds.has(p.id));

  return (
    <PageContainer>
      <PageHeader
        title="Cargar resultado"
        subtitle="5 jugadores por equipo · marcador final"
      />

      {loadError && <div className="alert-error">{loadError}</div>}

      <form onSubmit={handleSubmit} className="card space-y-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Fecha" type="date" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} required />
          <Input label="Cancha" value={venue} onChange={(e) => setVenue(e.target.value)} required placeholder="Complejo Los Amigos" />
        </div>

        <div className="flex items-center justify-center gap-6 py-2">
          <div className="text-center">
            <label className="mb-1 block font-display text-sm tracking-widest text-white/60">LOCAL</label>
            <input
              type="number"
              min={0}
              value={teamAScore}
              onChange={(e) => setTeamAScore(Number(e.target.value))}
              required
              className="score-display w-20 rounded-lg border border-white/20 bg-pitch-dark/60 text-center text-white outline-none focus:border-gold"
            />
          </div>
          <span className="font-display text-3xl text-gold">VS</span>
          <div className="text-center">
            <label className="mb-1 block font-display text-sm tracking-widest text-white/60">VISITANTE</label>
            <input
              type="number"
              min={0}
              value={teamBScore}
              onChange={(e) => setTeamBScore(Number(e.target.value))}
              required
              className="score-display w-20 rounded-lg border border-white/20 bg-pitch-dark/60 text-center text-white outline-none focus:border-gold"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PlayerPicker
            label={`Local (${teamA.size}/5)`}
            players={players}
            selected={teamA}
            onToggle={(id) => togglePlayer(id, "A")}
            variant="a"
          />
          <PlayerPicker
            label={`Visitante (${teamB.size}/5)`}
            players={players}
            selected={teamB}
            onToggle={(id) => togglePlayer(id, "B")}
            variant="b"
          />
        </div>

        {unassigned.length > 0 && (
          <p className="text-sm text-muted">
            {unassigned.length} jugador{unassigned.length !== 1 && "es"} afuera del partido
          </p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Guardando..." : "Guardar partido"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

function PlayerPicker({
  label,
  players,
  selected,
  onToggle,
  variant,
}: {
  label: string;
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  variant: "a" | "b";
}) {
  return (
    <div className={clsx("rounded-xl p-3", variant === "a" ? "team-a-bg" : "team-b-bg")}>
      <p className="mb-2 font-display text-sm tracking-widest text-white/80">{label}</p>
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
                isSelected ? "bg-gold/25 font-semibold text-white" : "text-white/80 hover:bg-white/10"
              )}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
