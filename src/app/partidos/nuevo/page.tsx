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
import { formatMatchHeadline } from "@/lib/match-result";
import type { MatchWinner, Player, TeamSide } from "@/lib/types";
import { TEAM_NAMES } from "@/lib/types";

const MARGIN_PRESETS = [1, 2, 3, 4, 5] as const;

export default function NuevoPartidoPage() {
  const router = useRouter();
  const { isUnlocked, isReady } = useAdmin();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split("T")[0]);
  const [venue, setVenue] = useState("");
  const [winner, setWinner] = useState<MatchWinner>("A");
  const [goalDifference, setGoalDifference] = useState(1);
  const [customMargin, setCustomMargin] = useState(false);
  const [teamA, setTeamA] = useState<Set<string>>(new Set());
  const [teamB, setTeamB] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  const preview =
    winner === "draw"
      ? "EMPATE"
      : formatMatchHeadline(winner, goalDifference);

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

  const setResult = (nextWinner: MatchWinner) => {
    setWinner(nextWinner);
    setCustomMargin(false);
    if (nextWinner === "draw") {
      setGoalDifference(0);
    } else if (goalDifference < 1) {
      setGoalDifference(1);
    }
  };

  const selectMargin = (n: number) => {
    if (n === 5) {
      setCustomMargin(true);
      setGoalDifference(Math.max(goalDifference, 5));
    } else {
      setCustomMargin(false);
      setGoalDifference(n);
    }
  };

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

    if (winner !== "draw" && goalDifference < 1) {
      setError("Indicá la diferencia de goles");
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
          winner,
          goal_difference: winner === "draw" ? 0 : goalDifference,
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
  const teamsReady = teamA.size === 5 && teamB.size === 5;

  return (
    <PageContainer>
      <PageHeader
        title="Cargar resultado"
        subtitle="Elegí ganador, diferencia y los 10 jugadores"
      />

      {loadError && <div className="alert-error">{loadError}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card grid gap-4 p-5 sm:grid-cols-2">
          <Input label="Fecha" type="date" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} required />
          <Input label="Cancha" value={venue} onChange={(e) => setVenue(e.target.value)} required placeholder="Complejo Los Amigos" />
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-white/10 bg-pitch-dark/50 px-5 py-6 text-center">
            <p className="score-display text-gold">{preview}</p>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted">Resultado</p>
          </div>

          <div className="space-y-6 p-5">
            <div className="grid grid-cols-3 gap-2">
              <WinnerCard
                label={TEAM_NAMES.A}
                selected={winner === "A"}
                onClick={() => setResult("A")}
                variant="a"
              />
              <WinnerCard
                label="Empate"
                selected={winner === "draw"}
                onClick={() => setResult("draw")}
                variant="draw"
              />
              <WinnerCard
                label={TEAM_NAMES.B}
                selected={winner === "B"}
                onClick={() => setResult("B")}
                variant="b"
              />
            </div>

            {winner !== "draw" && (
              <div>
                <p className="mb-3 text-center font-display text-sm tracking-widest text-white/50">
                  POR CUÁNTO
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {MARGIN_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => selectMargin(n)}
                      className={clsx(
                        "font-display h-14 min-w-14 rounded-xl border px-4 text-2xl tracking-wide transition-all",
                        (n === 5 ? customMargin || goalDifference >= 5 : goalDifference === n && !customMargin)
                          ? "scale-105 border-gold bg-gold/20 text-white shadow-[0_0_20px_rgba(245,197,24,0.15)]"
                          : "border-white/15 text-white/75 hover:border-white/35 hover:text-white"
                      )}
                    >
                      {n === 5 ? "5+" : n}
                    </button>
                  ))}
                </div>
                {customMargin && (
                  <div className="mx-auto mt-4 max-w-[8rem]">
                    <Input
                      label="Diferencia"
                      type="number"
                      min={5}
                      value={goalDifference}
                      onChange={(e) =>
                        setGoalDifference(Math.max(5, Number(e.target.value) || 5))
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-sm tracking-widest text-white/70">PLANTEL DEL PARTIDO</p>
            <span
              className={clsx(
                "text-xs font-semibold uppercase tracking-wider",
                teamsReady ? "text-green-400" : "text-muted"
              )}
            >
              {teamA.size + teamB.size}/10
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PlayerPicker
              label={`${TEAM_NAMES.A} (${teamA.size}/5)`}
              players={players}
              selected={teamA}
              onToggle={(id) => togglePlayer(id, "A")}
              variant="a"
              highlightWinner={winner === "A"}
            />
            <PlayerPicker
              label={`${TEAM_NAMES.B} (${teamB.size}/5)`}
              players={players}
              selected={teamB}
              onToggle={(id) => togglePlayer(id, "B")}
              variant="b"
              highlightWinner={winner === "B"}
            />
          </div>

          {unassigned.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              {unassigned.length} jugador{unassigned.length !== 1 && "es"} afuera del partido
            </p>
          )}
        </div>

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

function WinnerCard({
  label,
  selected,
  onClick,
  variant,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant: "a" | "b" | "draw";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-xl border px-2 py-4 transition-all",
        variant === "a" && "team-a-bg",
        variant === "b" && "team-b-bg",
        variant === "draw" && "border-white/10 bg-white/5",
        selected
          ? "border-gold ring-2 ring-gold/40"
          : "opacity-70 hover:opacity-100"
      )}
    >
      <p className="font-display text-lg tracking-widest text-white">{label.toUpperCase()}</p>
      {selected && (
        <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-gold">
          {variant === "draw" ? "Seleccionado" : "Ganador"}
        </p>
      )}
    </button>
  );
}

function PlayerPicker({
  label,
  players,
  selected,
  onToggle,
  variant,
  highlightWinner,
}: {
  label: string;
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  variant: "a" | "b";
  highlightWinner?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl p-3",
        variant === "a" ? "team-a-bg" : "team-b-bg",
        highlightWinner && "ring-1 ring-gold/30"
      )}
    >
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
