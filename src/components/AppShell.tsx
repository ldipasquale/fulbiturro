"use client";

import { useCallback, useEffect, useState } from "react";
import { Nav, SuggestTeamsButton } from "@/components/Nav";
import { SuggestTeamsDialog } from "@/components/SuggestTeamsDialog";
import { loadMatches, loadPlayers } from "@/lib/api-client";
import type { MatchWithParticipants, Player } from "@/lib/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchWithParticipants[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([loadPlayers(), loadMatches()]);
      setPlayers(p);
      setMatches(m);
    } catch {
      // pages show their own errors
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl flex-1 px-4 py-6">{children}</main>
      <SuggestTeamsButton onClick={() => setSuggestOpen(true)} />
      <SuggestTeamsDialog
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        players={players}
        matches={matches}
      />
    </>
  );
}
