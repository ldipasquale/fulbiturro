"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trophy, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loadMatches, loadStats } from "@/lib/api-client";
import type { MatchWithParticipants, PlayerStats } from "@/lib/types";

export default function HomePage() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [matches, setMatches] = useState<MatchWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.all([loadStats(), loadMatches()])
      .then(([s, m]) => {
        setStats(s);
        setMatches(m);
      })
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Error al cargar datos")
      )
      .finally(() => setLoading(false));
  }, []);

  const totalMatches = matches.length;
  const topPlayer = stats[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Fulbito 5 vs 5</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Registrá partidos, seguí estadísticas y armá equipos parejos.
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Trophy className="h-5 w-5 text-emerald-600" />}
          label="Partidos jugados"
          value={loading ? "..." : String(totalMatches)}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          label="Jugadores"
          value={loading ? "..." : String(stats.length)}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          label="Líder ELO"
          value={loading ? "..." : topPlayer ? (topPlayer.nickname ?? topPlayer.name) : "—"}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/partidos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Registrar partido
          </Button>
        </Link>
        <Link href="/jugadores">
          <Button variant="secondary">Ver jugadores</Button>
        </Link>
      </div>

      {matches.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Últimos partidos</h2>
          <div className="space-y-2">
            {matches.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium">
                    {m.team_a_score} - {m.team_b_score}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {format(new Date(m.played_at + "T12:00:00"), "d MMM yyyy", { locale: es })} · {m.venue}
                  </p>
                </div>
                <span className="text-xs text-zinc-400">
                  {m.participants.length} jugadores
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ranking ELO</h2>
            <Link href="/estadisticas" className="text-sm text-emerald-600 hover:underline">
              Ver todas las stats
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <th className="px-4 py-2 text-left font-medium">#</th>
                  <th className="px-4 py-2 text-left font-medium">Jugador</th>
                  <th className="px-4 py-2 text-right font-medium">PJ</th>
                  <th className="px-4 py-2 text-right font-medium">% Victorias</th>
                  <th className="px-4 py-2 text-right font-medium">ELO</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice(0, 5).map((s, i) => (
                  <tr key={s.playerId} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="px-4 py-2 text-zinc-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">{s.nickname ?? s.name}</td>
                    <td className="px-4 py-2 text-right">{s.matchesPlayed}</td>
                    <td className="px-4 py-2 text-right">{s.winRate}%</td>
                    <td className="px-4 py-2 text-right font-semibold text-emerald-600">{s.eloRating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && stats.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="mb-4 text-zinc-500">Todavía no hay jugadores ni partidos.</p>
          <Link href="/jugadores">
            <Button>Agregar primer jugador</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}
