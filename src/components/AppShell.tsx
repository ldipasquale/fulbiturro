"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminProvider } from "@/context/AdminContext";
import { Nav, SuggestTeamsButton } from "@/components/Nav";
import { SuggestTeamsDialog } from "@/components/SuggestTeamsDialog";
import { loadMatches, loadPlayers } from "@/lib/api-client";
import type { MatchWithParticipants, Player } from "@/lib/types";

function AppContent({ children }: { children: React.ReactNode }) {
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
    <div className="relative z-10 flex min-h-full flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      <SuggestTeamsButton onClick={() => setSuggestOpen(true)} />
      <SuggestTeamsDialog
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        players={players}
        matches={matches}
      />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AppContent>{children}</AppContent>
    </AdminProvider>
  );
}
