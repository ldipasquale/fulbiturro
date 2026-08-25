"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { loadStats } from "@/lib/api-client";
import type { PlayerStats } from "@/lib/types";

export default function EstadisticasPage() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [selected, setSelected] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadStats()
      .then((data) => {
        setStats(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-500">Cargando estadísticas...</p>;

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        {loadError}
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-zinc-500">No hay estadísticas todavía. Registrá partidos primero.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Ranking y detalle por jugador
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Jugador</th>
              <th className="px-3 py-2 text-right">PJ</th>
              <th className="px-3 py-2 text-right">G</th>
              <th className="px-3 py-2 text-right">E</th>
              <th className="px-3 py-2 text-right">P</th>
              <th className="px-3 py-2 text-right">% Vic</th>
              <th className="px-3 py-2 text-right">GF</th>
              <th className="px-3 py-2 text-right">GC</th>
              <th className="px-3 py-2 text-right">ELO</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr
                key={s.playerId}
                onClick={() => setSelected(s)}
                className={clsx(
                  "cursor-pointer border-b border-zinc-100 last:border-0 dark:border-zinc-800",
                  selected?.playerId === s.playerId
                    ? "bg-emerald-50 dark:bg-emerald-950/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{s.nickname ?? s.name}</td>
                <td className="px-3 py-2 text-right">{s.matchesPlayed}</td>
                <td className="px-3 py-2 text-right text-emerald-600">{s.wins}</td>
                <td className="px-3 py-2 text-right text-zinc-500">{s.draws}</td>
                <td className="px-3 py-2 text-right text-red-500">{s.losses}</td>
                <td className="px-3 py-2 text-right">{s.winRate}%</td>
                <td className="px-3 py-2 text-right">{s.goalsFor}</td>
                <td className="px-3 py-2 text-right">{s.goalsAgainst}</td>
                <td className="px-3 py-2 text-right font-semibold">{s.eloRating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <PlayerDetail stats={selected} />
      )}
    </div>
  );
}

function PlayerDetail({ stats }: { stats: PlayerStats }) {
  const streakLabel =
    stats.currentStreak.count === 0
      ? "—"
      : `${stats.currentStreak.count}${stats.currentStreak.type === "win" ? "V" : stats.currentStreak.type === "loss" ? "D" : "E"}`;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-4">
        {stats.photoUrl ? (
          <img
            src={stats.photoUrl}
            alt={stats.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            {(stats.nickname ?? stats.name).charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{stats.nickname ?? stats.name}</h2>
          <p className="text-zinc-500">ELO {stats.eloRating}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Racha actual" value={streakLabel} />
        <MiniStat
          label="Forma reciente"
          value={
            stats.recentForm.length > 0
              ? stats.recentForm.join(" ")
              : "—"
          }
        />
        <MiniStat label="Dif. goles" value={`${stats.goalDifference > 0 ? "+" : ""}${stats.goalDifference}`} />
        <MiniStat label="% Victorias" value={`${stats.winRate}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">
            Mejores compañeros (min. 2 partidos)
          </h3>
          {stats.bestTeammates.length === 0 ? (
            <p className="text-sm text-zinc-400">Sin datos suficientes</p>
          ) : (
            <ul className="space-y-1">
              {stats.bestTeammates.map((t) => (
                <li key={t.playerId} className="flex justify-between text-sm">
                  <span>{t.name}</span>
                  <span className="text-emerald-600">{t.winRate}% ({t.matches} PJ)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">
            Rivales más difíciles (min. 2 partidos)
          </h3>
          {stats.toughestOpponents.length === 0 ? (
            <p className="text-sm text-zinc-400">Sin datos suficientes</p>
          ) : (
            <ul className="space-y-1">
              {stats.toughestOpponents.map((t) => (
                <li key={t.playerId} className="flex justify-between text-sm">
                  <span>{t.name}</span>
                  <span className="text-red-500">{t.winRate}% ({t.matches} PJ)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
