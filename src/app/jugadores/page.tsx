"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PlayerForm } from "@/components/PlayerForm";
import { loadPlayers } from "@/lib/api-client";
import { POSITIONS, type Player } from "@/lib/types";

export default function JugadoresPage() {
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

  const openCreate = () => {
    setEditPlayer(null);
    setFormOpen(true);
  };

  const openEdit = (player: Player) => {
    setEditPlayer(player);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jugadores</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {players.length} jugador{players.length !== 1 && "es"} registrado{players.length !== 1 && "s"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Cargando...</p>
      ) : players.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="mb-4 text-zinc-500">No hay jugadores todavía.</p>
          <Button onClick={openCreate}>Agregar jugador</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {p.photo_url ? (
                <img
                  src={p.photo_url}
                  alt={p.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {(p.nickname ?? p.name).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.nickname ?? p.name}</p>
                {p.nickname && (
                  <p className="text-sm text-zinc-500">{p.name}</p>
                )}
                <p className="text-xs text-zinc-400">
                  {POSITIONS.find((pos) => pos.value === p.position)?.label} · ELO {Math.round(p.elo_rating)}
                </p>
              </div>
              <button
                onClick={() => openEdit(p)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <Pencil className="h-4 w-4" />
              </button>
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
    </div>
  );
}
