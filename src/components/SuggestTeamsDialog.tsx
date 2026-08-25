"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Select } from "./ui/Input";
import type { MatchWithParticipants, Player, TeamSide, TeamSuggestion } from "@/lib/types";
import { POSITIONS } from "@/lib/types";

interface SuggestTeamsDialogProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  matches: MatchWithParticipants[];
}

function PlayerAvatar({ player, size = "md" }: { player: Player; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  if (player.photo_url) {
    return (
      <img
        src={player.photo_url}
        alt={player.name}
        className={clsx(dim, "rounded-full object-cover")}
      />
    );
  }
  return (
    <div
      className={clsx(
        dim,
        "flex items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
      )}
    >
      {(player.nickname ?? player.name).charAt(0).toUpperCase()}
    </div>
  );
}

function TeamColumn({
  title,
  players,
  rating,
  color,
}: {
  title: string;
  players: Player[];
  rating: number;
  color: "emerald" | "blue";
}) {
  return (
    <div
      className={clsx(
        "flex-1 rounded-xl p-4",
        color === "emerald"
          ? "bg-emerald-50 dark:bg-emerald-950/50"
          : "bg-blue-50 dark:bg-blue-950/50"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          className={clsx(
            "font-semibold",
            color === "emerald" ? "text-emerald-700 dark:text-emerald-400" : "text-blue-700 dark:text-blue-400"
          )}
        >
          {title}
        </h3>
        <span className="text-xs text-zinc-500">Rating: {rating}</span>
      </div>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <PlayerAvatar player={p} size="sm" />
            <div>
              <p className="text-sm font-medium">{p.nickname ?? p.name}</p>
              <p className="text-xs text-zinc-500">
                {POSITIONS.find((pos) => pos.value === p.position)?.label} · ELO {Math.round(p.elo_rating)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SuggestTeamsDialog({
  open,
  onClose,
  players,
  matches,
}: SuggestTeamsDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newMappings, setNewMappings] = useState<Record<string, string>>({});
  const [excludeKeys, setExcludeKeys] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<TeamSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"select" | "mapping" | "result">("select");

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setNewMappings({});
      setExcludeKeys([]);
      setSuggestion(null);
      setError("");
      setStep("select");
    }
  }, [open]);

  const togglePlayer = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 10) next.add(id);
      return next;
    });
  };

  const getUnknownPlayers = (): Player[] => {
    return players.filter((p) => {
      if (!selected.has(p.id)) return false;
      const hasHistory = matches.some((m) =>
        m.participants.some((part) => part.player_id === p.id)
      );
      return !hasHistory;
    });
  };

  const handleContinue = () => {
    if (selected.size !== 10) {
      setError("Seleccioná exactamente 10 jugadores");
      return;
    }
    const unknown = getUnknownPlayers();
    if (unknown.length > 0) {
      setStep("mapping");
    } else {
      fetchSuggestion([]);
    }
  };

  const fetchSuggestion = async (exclude: string[]) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/suggest-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerIds: Array.from(selected),
          newPlayerMappings: newMappings,
          excludeKeys: exclude,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al sugerir equipos");

      setSuggestion(data);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnother = () => {
    if (suggestion) {
      const newExclude = [...excludeKeys, suggestion.suggestionKey];
      setExcludeKeys(newExclude);
      fetchSuggestion(newExclude);
    }
  };

  const unknownPlayers = getUnknownPlayers();

  return (
    <Dialog open={open} onClose={onClose} title="Sugerir equipos" wide>
      {step === "select" && (
        <div>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Seleccioná los 10 jugadores de hoy ({selected.size}/10)
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {players.map((p) => {
              const isSelected = selected.has(p.id);
              const hasHistory = matches.some((m) =>
                m.participants.some((part) => part.player_id === p.id)
              );
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlayer(p.id)}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg border p-2 text-left transition-colors",
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
                  )}
                >
                  <PlayerAvatar player={p} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.nickname ?? p.name}</p>
                    {!hasHistory && (
                      <p className="text-xs text-amber-600">Sin partidos</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <Button onClick={handleContinue} className="w-full" disabled={selected.size !== 10}>
            Continuar
          </Button>
        </div>
      )}

      {step === "mapping" && (
        <div>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Estos jugadores no tienen partidos registrados. Emparejalos con alguien de nivel similar:
          </p>
          <div className="mb-4 space-y-3">
            {unknownPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <PlayerAvatar player={p} size="sm" />
                <span className="flex-1 text-sm font-medium">{p.nickname ?? p.name}</span>
                <Select
                  value={newMappings[p.id] ?? ""}
                  onChange={(e) =>
                    setNewMappings((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  options={[
                    { value: "", label: "Elegir..." },
                    ...players
                      .filter((pl) => pl.id !== p.id && selected.has(pl.id))
                      .map((pl) => ({ value: pl.id, label: pl.nickname ?? pl.name })),
                  ]}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("select")} className="flex-1">
              Volver
            </Button>
            <Button
              onClick={() => {
                const missing = unknownPlayers.filter((p) => !newMappings[p.id]);
                if (missing.length > 0) {
                  setError("Asigná un jugador de referencia a todos los nuevos");
                  return;
                }
                fetchSuggestion([]);
              }}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Calculando..." : "Sugerir equipos"}
            </Button>
          </div>
        </div>
      )}

      {step === "result" && suggestion && (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <TeamColumn
              title="Equipo A"
              players={suggestion.teamA}
              rating={suggestion.teamARating}
              color="emerald"
            />
            <div className="flex items-center justify-center px-2">
              <span className="text-2xl font-bold text-zinc-400">VS</span>
            </div>
            <TeamColumn
              title="Equipo B"
              players={suggestion.teamB}
              rating={suggestion.teamBRating}
              color="blue"
            />
          </div>
          <p className="mb-4 text-center text-sm text-zinc-500">
            Diferencia de balance: {suggestion.balanceScore} pts
            {suggestion.balanceScore < 20 && " — ¡Muy parejo!"}
          </p>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("select")} className="flex-1">
              Cambiar jugadores
            </Button>
            <Button onClick={handleAnother} disabled={loading} className="flex-1">
              {loading ? "Calculando..." : "Otra combinación"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
