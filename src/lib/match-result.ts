import type { Match, MatchWinner, TeamSide } from "./types";
import { TEAM_NAMES } from "./types";

export function getPlayerResult(
  team: TeamSide,
  winner: MatchWinner
): "win" | "loss" | "draw" {
  if (winner === "draw") return "draw";
  return winner === team ? "win" : "loss";
}

export function getSignedGoalDifference(
  team: TeamSide,
  winner: MatchWinner,
  goalDifference: number
): number {
  const result = getPlayerResult(team, winner);
  if (result === "draw") return 0;
  if (result === "win") return goalDifference;
  return -goalDifference;
}

export function formatMatchResult(winner: MatchWinner, goalDifference: number): string {
  if (winner === "draw") return "Empate";
  return `${TEAM_NAMES[winner]} +${goalDifference}`;
}

export function formatMatchResultShort(winner: MatchWinner, goalDifference: number): string {
  if (winner === "draw") return "0-0";
  return `+${goalDifference}`;
}

export function formatMatchWinnerBadge(winner: MatchWinner): string {
  if (winner === "draw") return "Empate";
  return `Ganó ${TEAM_NAMES[winner]}`;
}

export function formatMatchHeadline(
  winner: MatchWinner,
  goalDifference: number
): string {
  if (winner === "draw") return "EMPATE";
  return `GANÓ ${TEAM_NAMES[winner].toUpperCase()} POR ${goalDifference}`;
}

export function formatMatchResultDisplay(
  winner: MatchWinner,
  goalDifference: number
): {
  headline: string;
  badge: string;
} {
  return {
    headline: formatMatchHeadline(winner, goalDifference),
    badge: formatMatchWinnerBadge(winner),
  };
}

export function matchOutcomeForTeam(
  team: TeamSide,
  winner: MatchWinner
): 1 | 0.5 | 0 {
  const result = getPlayerResult(team, winner);
  if (result === "win") return 1;
  if (result === "draw") return 0.5;
  return 0;
}

/** Compat: partidos viejos con team_a_score / team_b_score en DB */
export function normalizeMatch(match: Match): {
  winner: MatchWinner;
  goalDifference: number;
} {
  if (match.winner != null && match.goal_difference != null) {
    return { winner: match.winner, goalDifference: match.goal_difference };
  }
  const a = match.team_a_score ?? 0;
  const b = match.team_b_score ?? 0;
  const goalDifference = Math.abs(a - b);
  const winner: MatchWinner = a > b ? "A" : b > a ? "B" : "draw";
  return { winner, goalDifference };
}

export function computeSideWinRates(matches: Match[]): {
  claraWins: number;
  oscuraWins: number;
  draws: number;
  claraWinRate: number;
  oscuraWinRate: number;
} {
  let claraWins = 0;
  let oscuraWins = 0;
  let draws = 0;

  for (const match of matches) {
    const { winner } = normalizeMatch(match);
    if (winner === "A") claraWins++;
    else if (winner === "B") oscuraWins++;
    else draws++;
  }

  const total = matches.length;
  return {
    claraWins,
    oscuraWins,
    draws,
    claraWinRate: total > 0 ? Math.round((claraWins / total) * 100) : 0,
    oscuraWinRate: total > 0 ? Math.round((oscuraWins / total) * 100) : 0,
  };
}
