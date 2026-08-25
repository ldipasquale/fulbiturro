import type {
  MatchWithParticipants,
  Player,
  PlayerMatchResult,
  PlayerStats,
  TeamSide,
} from "./types";

function getPlayerResult(
  team: TeamSide,
  teamAScore: number,
  teamBScore: number
): "win" | "loss" | "draw" {
  const myScore = team === "A" ? teamAScore : teamBScore;
  const theirScore = team === "A" ? teamBScore : teamAScore;
  if (myScore > theirScore) return "win";
  if (myScore < theirScore) return "loss";
  return "draw";
}

export function buildPlayerMatchHistory(
  playerId: string,
  matches: MatchWithParticipants[]
): PlayerMatchResult[] {
  return matches
    .filter((m) => m.participants.some((p) => p.player_id === playerId))
    .map((m) => {
      const participant = m.participants.find((p) => p.player_id === playerId)!;
      const teammates = m.participants
        .filter((p) => p.team === participant.team && p.player_id !== playerId)
        .map((p) => p.player_id);
      const opponents = m.participants
        .filter((p) => p.team !== participant.team)
        .map((p) => p.player_id);

      const teamScore =
        participant.team === "A" ? m.team_a_score : m.team_b_score;
      const opponentScore =
        participant.team === "A" ? m.team_b_score : m.team_a_score;

      return {
        matchId: m.id,
        playedAt: m.played_at,
        team: participant.team,
        teamScore,
        opponentScore,
        result: getPlayerResult(participant.team, m.team_a_score, m.team_b_score),
        teammates,
        opponents,
      };
    })
    .sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
}

function computeStreak(history: PlayerMatchResult[]): {
  type: "win" | "loss" | "draw";
  count: number;
} {
  if (history.length === 0) return { type: "win", count: 0 };

  const first = history[0].result;
  let count = 0;
  for (const h of history) {
    if (h.result !== first) break;
    count++;
  }
  return { type: first, count };
}

function computePairStats(
  history: PlayerMatchResult[],
  playerMap: Map<string, Player>,
  type: "teammate" | "opponent"
): Array<{ playerId: string; name: string; winRate: number; matches: number }> {
  const stats = new Map<string, { wins: number; total: number }>();

  for (const h of history) {
    const ids = type === "teammate" ? h.teammates : h.opponents;
    for (const id of ids) {
      const current = stats.get(id) ?? { wins: 0, total: 0 };
      current.total++;
      if (h.result === "win") current.wins++;
      stats.set(id, current);
    }
  }

  return Array.from(stats.entries())
    .filter(([, s]) => s.total >= 2)
    .map(([playerId, s]) => ({
      playerId,
      name: playerMap.get(playerId)?.nickname ?? playerMap.get(playerId)?.name ?? "?",
      winRate: Math.round((s.wins / s.total) * 100),
      matches: s.total,
    }))
    .sort((a, b) => {
      if (type === "teammate") return b.winRate - a.winRate;
      return a.winRate - b.winRate;
    })
    .slice(0, 3);
}

export function computePlayerStats(
  player: Player,
  matches: MatchWithParticipants[],
  allPlayers: Player[]
): PlayerStats {
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));
  const history = buildPlayerMatchHistory(player.id, matches);

  const wins = history.filter((h) => h.result === "win").length;
  const losses = history.filter((h) => h.result === "loss").length;
  const draws = history.filter((h) => h.result === "draw").length;
  const played = history.length;

  const goalsFor = history.reduce((sum, h) => sum + h.teamScore, 0);
  const goalsAgainst = history.reduce((sum, h) => sum + h.opponentScore, 0);

  const recentForm = history.slice(0, 5).map((h) => {
    if (h.result === "win") return "W" as const;
    if (h.result === "loss") return "L" as const;
    return "D" as const;
  });

  return {
    playerId: player.id,
    name: player.name,
    nickname: player.nickname,
    photoUrl: player.photo_url,
    position: player.position,
    eloRating: Math.round(player.elo_rating),
    matchesPlayed: played,
    wins,
    losses,
    draws,
    winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    currentStreak: computeStreak(history),
    recentForm,
    bestTeammates: computePairStats(history, playerMap, "teammate"),
    toughestOpponents: computePairStats(history, playerMap, "opponent"),
  };
}

export function computeRecentFormScore(history: PlayerMatchResult[]): number {
  const recent = history.slice(0, 5);
  if (recent.length === 0) return 0.5;

  const points = recent.reduce((sum, h) => {
    if (h.result === "win") return sum + 1;
    if (h.result === "draw") return sum + 0.5;
    return sum;
  }, 0);

  return points / recent.length;
}

export function computeEffectiveRating(
  player: Player,
  history: PlayerMatchResult[]
): number {
  const elo = player.elo_rating;
  const recentForm = computeRecentFormScore(history);
  const played = history.length;

  const overallWinRate =
    played > 0
      ? history.filter((h) => h.result === "win").length / played
      : 0.5;

  // Convert win rates (0-1) to ELO-like scale around 1000
  const formRating = 800 + recentForm * 400;
  const winRateRating = 800 + overallWinRate * 400;

  if (played === 0) {
    return player.elo_rating;
  }

  if (played < 3) {
    return elo * 0.5 + formRating * 0.3 + winRateRating * 0.2;
  }

  return elo * 0.55 + formRating * 0.3 + winRateRating * 0.15;
}
