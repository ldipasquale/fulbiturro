"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Select } from "./ui/Input";
import { PlayerAvatar, PositionBadge } from "./ui/PlayerAvatar";
import type { MatchWithParticipants, Player, TeamSuggestion } from "@/lib/types";
import { TEAM_NAMES } from "@/lib/types";

interface SuggestTeamsDialogProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  matches: MatchWithParticipants[];
}

function TeamColumn({
  title,
  players,
  rating,
  variant,
}: {
  title: string;
  players: Player[];
  rating: number;
  variant: "a" | "b";
}) {
  return (
    <div className={clsx("flex-1 rounded-xl p-4", variant === "a" ? "team-a-bg" : "team-b-bg")}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-xl tracking-widest text-white">{title}</h3>
        <span className="badge-pos">Turraje {rating}</span>
      </div>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <PlayerAvatar player={p} size="sm" />
            <div>
              <p className="text-sm font-medium text-white">{p.name}</p>
              <div className="mt-0.5 flex items-center gap-1">
                <PositionBadge position={p.position} />
                <span className="text-xs text-muted">· {Math.round(p.elo_rating)}</span>
              </div>
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

  const getUnknownPlayers = (): Player[] =>
    players.filter((p) => {
      if (!selected.has(p.id)) return false;
      return !matches.some((m) => m.participants.some((part) => part.player_id === p.id));
    });

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

  const handleContinue = () => {
    if (selected.size !== 10) {
      setError("Seleccioná exactamente 10 jugadores");
      return;
    }
    if (getUnknownPlayers().length > 0) setStep("mapping");
    else fetchSuggestion([]);
  };

  const unknownPlayers = getUnknownPlayers();

  return (
    <Dialog open={open} onClose={onClose} title="Armar equipos" wide>
      {step === "select" && (
        <div>
          <p className="mb-4 text-sm text-muted">
            Elegí los 10 jugadores de hoy ({selected.size}/10)
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
                      ? "border-gold/50 bg-gold/15"
                      : "border-white/10 hover:border-white/25"
                  )}
                >
                  <PlayerAvatar player={p} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{p.name}</p>
                    {!hasHistory && <p className="text-xs text-gold">Sin partidos</p>}
                  </div>
                </button>
              );
            })}
          </div>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <Button onClick={handleContinue} className="w-full" disabled={selected.size !== 10}>
            Continuar
          </Button>
        </div>
      )}

      {step === "mapping" && (
        <div>
          <p className="mb-4 text-sm text-muted">
            Jugadores nuevos — emparejalos con alguien de nivel similar:
          </p>
          <div className="mb-4 space-y-3">
            {unknownPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <PlayerAvatar player={p} size="sm" />
                <span className="flex-1 text-sm font-medium text-white">{p.name}</span>
                <Select
                  value={newMappings[p.id] ?? ""}
                  onChange={(e) =>
                    setNewMappings((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  options={[
                    { value: "", label: "Elegir..." },
                    ...players
                      .filter((pl) => pl.id !== p.id && selected.has(pl.id))
                      .map((pl) => ({ value: pl.id, label: pl.name })),
                  ]}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("select")} className="flex-1">
              Volver
            </Button>
            <Button
              onClick={() => {
                if (unknownPlayers.some((p) => !newMappings[p.id])) {
                  setError("Asigná referencia a todos los jugadores nuevos");
                  return;
                }
                fetchSuggestion([]);
              }}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Calculando..." : "Armar equipos"}
            </Button>
          </div>
        </div>
      )}

      {step === "result" && suggestion && (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <TeamColumn title={TEAM_NAMES.A.toUpperCase()} players={suggestion.teamA} rating={suggestion.teamARating} variant="a" />
            <div className="flex items-center justify-center px-2">
              <span className="font-display text-4xl text-gold">VS</span>
            </div>
            <TeamColumn title={TEAM_NAMES.B.toUpperCase()} players={suggestion.teamB} rating={suggestion.teamBRating} variant="b" />
          </div>
          <p className="mb-4 text-center text-sm text-muted">
            Balance: {suggestion.balanceScore} pts
            {suggestion.balanceScore < 20 && " — ¡Muy parejo!"}
          </p>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("select")} className="flex-1">
              Cambiar jugadores
            </Button>
            <Button onClick={() => {
              const newExclude = [...excludeKeys, suggestion.suggestionKey];
              setExcludeKeys(newExclude);
              fetchSuggestion(newExclude);
            }} disabled={loading} className="flex-1">
              {loading ? "Calculando..." : "Otra combinación"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
