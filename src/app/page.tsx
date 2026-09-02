"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Shirt, Trophy, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyPitch, PageHeader } from "@/components/ui/PlayerAvatar";
import { useAdmin } from "@/context/AdminContext";
import { loadMatches, loadStats } from "@/lib/api-client";
import { computeSideWinRates, formatMatchResultDisplay, normalizeMatch } from "@/lib/match-result";
import type { MatchWithParticipants, PlayerStats } from "@/lib/types";
import { TEAM_NAMES } from "@/lib/types";

export default function HomePage() {
  const { isUnlocked } = useAdmin();
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

  const topPlayer = stats[0];
  const sideWinRates = computeSideWinRates(matches);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fulbito 5 vs 5"
        subtitle="Registrá partidos, seguí estadísticas y armá equipos parejos."
      />

      {loadError && <div className="alert-error">{loadError}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Trophy className="h-6 w-6 text-gold" />}
          label="Partidos jugados"
          value={loading ? "—" : String(matches.length)}
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-gold" />}
          label="Jugadores"
          value={loading ? "—" : String(stats.length)}
        />
        <TeamWinRateCard loading={loading} rates={sideWinRates} />
        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-gold" />}
          label="El más turro"
          value={loading ? "—" : topPlayer ? topPlayer.name : "—"}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {isUnlocked && (
          <Link href="/partidos/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cargar resultado
            </Button>
          </Link>
        )}
        <Link href="/jugadores">
          <Button variant="secondary">Ver plantel</Button>
        </Link>
      </div>

      {matches.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl tracking-wide text-gold">Últimos partidos</h2>
          <div className="space-y-2">
            {matches.slice(0, 5).map((m) => {
              const { winner, goalDifference } = normalizeMatch(m);
              const { headline } = formatMatchResultDisplay(winner, goalDifference);

              return (
              <div key={m.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="score-display text-white">{headline}</p>
                  <p className="text-sm text-muted">
                    {format(new Date(m.played_at + "T12:00:00"), "d MMM yyyy", { locale: es })} · {m.venue}
                  </p>
                </div>
                <span className="badge-pos">{m.participants.length} jugadores</span>
              </div>
            );
            })}
          </div>
        </section>
      )}

      {stats.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide text-gold">Los más turros</h2>
            <Link href="/estadisticas" className="text-sm text-gold hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-muted">
                  <th className="px-4 py-2 text-left font-medium">#</th>
                  <th className="px-4 py-2 text-left font-medium">Jugador</th>
                  <th className="px-4 py-2 text-right font-medium">PJ</th>
                  <th className="px-4 py-2 text-right font-medium">% Vic</th>
                  <th className="px-4 py-2 text-right font-medium">Turraje</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice(0, 5).map((s, i) => (
                  <tr key={s.playerId} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2 text-muted">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-2 text-right">{s.matchesPlayed}</td>
                    <td className="px-4 py-2 text-right">{s.winRate}%</td>
                    <td className="px-4 py-2 text-right font-display text-lg text-gold">{s.eloRating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && stats.length === 0 && (
        <EmptyPitch
          message="Todavía no hay jugadores ni partidos."
          action={
            <Link href="/jugadores">
              <Button>Fichar primer jugador</Button>
            </Link>
          }
        />
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
    <div className="card p-4">
      <div className="mb-2">{icon}</div>
      <p className="font-display text-3xl tracking-wide text-white">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function TeamWinRateCard({
  loading,
  rates,
}: {
  loading: boolean;
  rates: ReturnType<typeof computeSideWinRates>;
}) {
  const hasDecided = rates.claraWins + rates.oscuraWins > 0;

  return (
    <div className="card p-4">
      <div className="mb-2">
        <Shirt className="h-6 w-6 text-gold" />
      </div>
      {loading || !hasDecided ? (
        <p className="font-display text-3xl tracking-wide text-white">—</p>
      ) : (
        <div className="flex items-baseline gap-2 font-display text-3xl tracking-wide">
          <span className="text-green-300">{rates.claraWinRate}%</span>
          <span className="text-lg text-white/30">·</span>
          <span className="text-blue-300">{rates.oscuraWinRate}%</span>
        </div>
      )}
      <p className="text-sm text-muted">
        {TEAM_NAMES.A} · {TEAM_NAMES.B}
        {!loading && rates.draws > 0 && ` · ${rates.draws} empate${rates.draws !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}
