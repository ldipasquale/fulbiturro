"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { PageContainer } from "@/components/PageContainer";
import { EmptyPitch, PageHeader, PlayerAvatar, PositionBadge } from "@/components/ui/PlayerAvatar";
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

  if (loading) {
    return (
      <PageContainer>
        <p className="text-muted">Cargando estadísticas...</p>
      </PageContainer>
    );
  }

  if (loadError) {
    return (
      <PageContainer>
        <div className="alert-error">{loadError}</div>
      </PageContainer>
    );
  }

  if (stats.length === 0) {
    return (
      <PageContainer>
        <EmptyPitch message="No hay estadísticas todavía. Registrá partidos primero." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Estadísticas" subtitle="Ranking y ficha por jugador" />

      <div className="card w-full overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-muted">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Jugador</th>
              <th className="px-3 py-2 text-right">PJ</th>
              <th className="px-3 py-2 text-right">G</th>
              <th className="px-3 py-2 text-right">E</th>
              <th className="px-3 py-2 text-right">P</th>
              <th className="px-3 py-2 text-right">% Vic</th>
              <th className="px-3 py-2 text-right">Dif.</th>
              <th className="px-3 py-2 text-right">Turraje</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr
                key={s.playerId}
                onClick={() => setSelected(s)}
                className={clsx(
                  "cursor-pointer border-b border-white/5 last:border-0",
                  selected?.playerId === s.playerId
                    ? "bg-gold/10"
                    : "hover:bg-white/5"
                )}
              >
                <td className="px-3 py-2 text-muted">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-white">{s.name}</td>
                <td className="px-3 py-2 text-right">{s.matchesPlayed}</td>
                <td className="px-3 py-2 text-right text-green-400">{s.wins}</td>
                <td className="px-3 py-2 text-right text-muted">{s.draws}</td>
                <td className="px-3 py-2 text-right text-red-400">{s.losses}</td>
                <td className="px-3 py-2 text-right">{s.winRate}%</td>
                <td className="px-3 py-2 text-right">
                  {s.goalDifference > 0 ? "+" : ""}
                  {s.goalDifference}
                </td>
                <td className="px-3 py-2 text-right font-display text-lg text-gold">{s.eloRating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <PlayerDetail stats={selected} />}
    </PageContainer>
  );
}

function PlayerDetail({ stats }: { stats: PlayerStats }) {
  const streakLabel =
    stats.currentStreak.count === 0
      ? "—"
      : `${stats.currentStreak.count}${stats.currentStreak.type === "win" ? "V" : stats.currentStreak.type === "loss" ? "D" : "E"}`;

  return (
    <div className="card w-full p-6">
      <div className="mb-4 flex items-center gap-4">
        <PlayerAvatar player={{ name: stats.name, photo_url: stats.photoUrl }} size="lg" />
        <div>
          <h2 className="font-display text-3xl tracking-wide text-white">{stats.name}</h2>
          <p className="text-gold">Turraje {stats.eloRating}</p>
          <div className="mt-1">
            <PositionBadge position={stats.position} />
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Racha" value={streakLabel} />
        <MiniStat
          label="Forma (últ. 5)"
          value={stats.recentForm.length > 0 ? stats.recentForm.join(" ") : "—"}
        />
        <MiniStat
          label="Dif. goles"
          value={`${stats.goalDifference > 0 ? "+" : ""}${stats.goalDifference}`}
        />
        <MiniStat label="% Victorias" value={`${stats.winRate}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 font-display text-sm tracking-widest text-gold">
            Mejores compañeros
          </h3>
          {stats.bestTeammates.length === 0 ? (
            <p className="text-sm text-muted">Sin datos suficientes</p>
          ) : (
            <ul className="space-y-1">
              {stats.bestTeammates.map((t) => (
                <li key={t.playerId} className="flex justify-between text-sm text-white">
                  <span>{t.name}</span>
                  <span className="text-green-400">{t.winRate}% ({t.matches} PJ)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-2 font-display text-sm tracking-widest text-gold">
            Rivales difíciles
          </h3>
          {stats.toughestOpponents.length === 0 ? (
            <p className="text-sm text-muted">Sin datos suficientes</p>
          ) : (
            <ul className="space-y-1">
              {stats.toughestOpponents.map((t) => (
                <li key={t.playerId} className="flex justify-between text-sm text-white">
                  <span>{t.name}</span>
                  <span className="text-red-400">{t.winRate}% ({t.matches} PJ)</span>
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
    <div className="rounded-lg border border-white/10 bg-pitch-dark p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-xl text-white">{value}</p>
    </div>
  );
}
