"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loadMatches } from "@/lib/api-client";
import type { MatchWithParticipants } from "@/lib/types";

export default function PartidosPage() {
  const [matches, setMatches] = useState<MatchWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadMatches()
      .then(setMatches)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partidos</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Historial de partidos registrados
          </p>
        </div>
        <Link href="/partidos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo partido
          </Button>
        </Link>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Cargando...</p>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="mb-4 text-zinc-500">No hay partidos registrados.</p>
          <Link href="/partidos/nuevo">
            <Button>Registrar primer partido</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => {
            const teamA = m.participants.filter((p) => p.team === "A");
            const teamB = m.participants.filter((p) => p.team === "B");
            const result =
              m.team_a_score > m.team_b_score
                ? "Ganó Equipo A"
                : m.team_b_score > m.team_a_score
                  ? "Ganó Equipo B"
                  : "Empate";

            return (
              <div
                key={m.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {m.team_a_score}{" "}
                      <span className="text-zinc-400">-</span> {m.team_b_score}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {format(new Date(m.played_at + "T12:00:00"), "EEEE d MMMM yyyy", {
                        locale: es,
                      })}{" "}
                      · {m.venue}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium dark:bg-zinc-800">
                    {result}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TeamList label="Equipo A" players={teamA} />
                  <TeamList label="Equipo B" players={teamB} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamList({
  label,
  players,
}: {
  label: string;
  players: MatchWithParticipants["participants"];
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <ul className="space-y-0.5">
        {players.map((p) => (
          <li key={p.id} className="text-sm">
            {p.player.nickname ?? p.player.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
