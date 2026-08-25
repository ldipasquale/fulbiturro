import type { MatchWithParticipants, Player, TeamSuggestion } from "./types";
import {
  buildPlayerMatchHistory,
  computeEffectiveRating,
} from "./stats";

const POSITION_WEIGHT: Record<string, number> = {
  arquero: 1.05,
  defensa: 1.0,
  mediocampo: 1.0,
  delantero: 1.02,
  cualquiera: 1.0,
};

function positionBalancePenalty(team: Player[]): number {
  const positions = team.map((p) => p.position);
  const unique = new Set(positions).size;
  if (unique <= 2) return 15;
  if (unique === 3) return 5;
  return 0;
}

function chemistryBonus(
  teamA: Player[],
  teamB: Player[],
  matches: MatchWithParticipants[]
): number {
  let bonus = 0;

  const checkTeam = (team: Player[]) => {
    for (let i = 0; i < team.length; i++) {
      for (let j = i + 1; j < team.length; j++) {
        const h1 = buildPlayerMatchHistory(team[i].id, matches);
        const together = h1.filter((h) => h.teammates.includes(team[j].id));
        if (together.length >= 2) {
          const wr =
            together.filter((h) => h.result === "win").length / together.length;
          if (wr > 0.7) bonus -= 3;
          if (wr < 0.3) bonus += 3;
        }
      }
    }
  };

  checkTeam(teamA);
  checkTeam(teamB);
  return bonus;
}

function getTeamRating(players: Player[]): number {
  return players.reduce(
    (sum, p) => sum + (p as Player & { effectiveRating: number }).effectiveRating * (POSITION_WEIGHT[p.position] ?? 1),
    0
  );
}

function generateCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];

  const [first, ...rest] = arr;
  const withFirst = generateCombinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = generateCombinations(rest, k);

  return [...withFirst, ...withoutFirst];
}

function suggestionKey(teamAIds: string[]): string {
  return [...teamAIds].sort().join("-");
}

export function suggestTeams(
  selectedPlayers: Player[],
  matches: MatchWithParticipants[],
  newPlayerMappings: Record<string, string> = {},
  excludeKeys: string[] = []
): TeamSuggestion | null {
  if (selectedPlayers.length !== 10) {
    throw new Error("Se necesitan exactamente 10 jugadores");
  }

  const playersWithRating = selectedPlayers.map((player) => {
    let effectivePlayer = { ...player };

    if (newPlayerMappings[player.id]) {
      const ref = selectedPlayers.find(
        (p) => p.id === newPlayerMappings[player.id]
      );
      if (ref) {
        effectivePlayer = {
          ...player,
          elo_rating: ref.elo_rating,
        };
      }
    }

    const history = buildPlayerMatchHistory(effectivePlayer.id, matches);
    const effectiveRating = computeEffectiveRating(effectivePlayer, history);

    return { ...effectivePlayer, effectiveRating };
  });

  const ids = playersWithRating.map((p) => p.id);
  const combinations = generateCombinations(ids, 5);

  const seen = new Set<string>();
  const candidates: TeamSuggestion[] = [];

  for (const teamAIds of combinations) {
    const key = suggestionKey(teamAIds);
    const reverseKey = suggestionKey(
      ids.filter((id) => !teamAIds.includes(id))
    );
    if (seen.has(key) || seen.has(reverseKey)) continue;
    seen.add(key);

    if (excludeKeys.includes(key) || excludeKeys.includes(reverseKey)) continue;

    const teamA = playersWithRating.filter((p) => teamAIds.includes(p.id));
    const teamB = playersWithRating.filter((p) => !teamAIds.includes(p.id));

    const ratingA = getTeamRating(teamA);
    const ratingB = getTeamRating(teamB);
    const diff = Math.abs(ratingA - ratingB);
    const posPenalty = positionBalancePenalty(teamA) + positionBalancePenalty(teamB);
    const chem = chemistryBonus(teamA, teamB, matches);

    candidates.push({
      teamA: teamA.map(({ effectiveRating: _, ...p }) => p),
      teamB: teamB.map(({ effectiveRating: _, ...p }) => p),
      teamARating: Math.round(ratingA),
      teamBRating: Math.round(ratingB),
      balanceScore: Math.round(diff + posPenalty + chem),
      suggestionKey: key,
    });
  }

  candidates.sort((a, b) => a.balanceScore - b.balanceScore);
  return candidates[0] ?? null;
}

export function countPossibleSuggestions(): number {
  // C(10,5)/2 = 126
  return 126;
}
