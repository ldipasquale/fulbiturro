"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyPitch, PageHeader, PlayerAvatar, PositionBadge } from "@/components/ui/PlayerAvatar";
import { PageContainer } from "@/components/PageContainer";
import { PlayerForm } from "@/components/PlayerForm";
import { useAdmin } from "@/context/AdminContext";
import { loadPlayers } from "@/lib/api-client";
import type { Player } from "@/lib/types";

export default function JugadoresPage() {
  const { isUnlocked } = useAdmin();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);

  const reloadPlayers = useCallback(async () => {
    try {
      setPlayers(await loadPlayers());
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadPlayers();
  }, [reloadPlayers]);

  return (
    <PageContainer>
      <PageHeader
        title="Plantel"
        subtitle={`${players.length} jugador${players.length !== 1 ? "es" : ""} en el equipo`}
        action={
          isUnlocked ? (
            <Button onClick={() => { setEditPlayer(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Fichar
            </Button>
          ) : undefined
        }
      />

      {loadError && <div className="alert-error">{loadError}</div>}

      {loading ? (
        <p className="text-muted">Cargando plantel...</p>
      ) : players.length === 0 ? (
        <EmptyPitch
          message="Todavía no hay jugadores en el plantel."
          action={
            isUnlocked ? (
              <Button onClick={() => { setEditPlayer(null); setFormOpen(true); }}>
                Fichar primer jugador
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="card card-hover flex items-center gap-3 p-4 transition-colors"
            >
              <PlayerAvatar player={p} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{p.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <PositionBadge position={p.position} />
                  <span className="text-xs text-muted">Turraje {Math.round(p.elo_rating)}</span>
                </div>
              </div>
              {isUnlocked && (
                <button
                  onClick={() => { setEditPlayer(p); setFormOpen(true); }}
                  className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-gold"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <PlayerForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reloadPlayers}
        players={players}
        editPlayer={editPlayer}
      />
    </PageContainer>
  );
}
