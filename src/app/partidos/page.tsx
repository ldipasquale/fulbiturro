"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/PageContainer";
import { EmptyPitch, PageHeader } from "@/components/ui/PlayerAvatar";
import { useAdmin } from "@/context/AdminContext";
import { loadMatches } from "@/lib/api-client";
import type { MatchWithParticipants } from "@/lib/types";

export default function PartidosPage() {
  const { isUnlocked } = useAdmin();
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
    <PageContainer>
      <PageHeader
        title="Partidos"
        subtitle="Historial de encuentros"
        action={
          isUnlocked ? (
            <Link href="/partidos/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo
              </Button>
            </Link>
          ) : undefined
        }
      />

      {loadError && <div className="alert-error">{loadError}</div>}

      {loading ? (
        <p className="text-muted">Cargando partidos...</p>
      ) : matches.length === 0 ? (
        <EmptyPitch
          message="No hay partidos registrados todavía."
          action={
            isUnlocked ? (
              <Link href="/partidos/nuevo">
                <Button>Cargar primer partido</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m) => {
            const teamA = m.participants.filter((p) => p.team === "A");
            const teamB = m.participants.filter((p) => p.team === "B");
            const result =
              m.team_a_score > m.team_b_score
                ? "Local"
                : m.team_b_score > m.team_a_score
                  ? "Visitante"
                  : "Empate";

            return (
              <div key={m.id} className="card p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="score-display text-white">
                      {m.team_a_score}
                      <span className="mx-2 text-gold">-</span>
                      {m.team_b_score}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {format(new Date(m.played_at + "T12:00:00"), "EEEE d MMMM yyyy", {
                        locale: es,
                      })}{" "}
                      · {m.venue}
                    </p>
                  </div>
                  <span className="badge-pos">
                    {result === "Empate" ? "Empate" : `Ganó ${result}`}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TeamList label="Local" players={teamA} variant="a" />
                  <TeamList label="Visitante" players={teamB} variant="b" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

function TeamList({
  label,
  players,
  variant,
}: {
  label: string;
  players: MatchWithParticipants["participants"];
  variant: "a" | "b";
}) {
  return (
    <div className={variant === "a" ? "team-a-bg rounded-lg p-3" : "team-b-bg rounded-lg p-3"}>
      <p className="mb-2 font-display text-sm tracking-widest text-white/60">{label}</p>
      <ul className="space-y-0.5">
        {players.map((p) => (
          <li key={p.id} className="text-sm text-white">
            {p.player.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
