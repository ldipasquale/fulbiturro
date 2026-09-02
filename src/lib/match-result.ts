import type { Match, TeamSide } from "./types";

export type MatchWinner = "A" | "B" | "draw";

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
  const margin = goalDifference === 1 ? "1 gol" : `${goalDifference} goles`;
  return winner === "A" ? `Local +${goalDifference}` : `Visitante +${goalDifference}`;
}

export function formatMatchResultShort(winner: MatchWinner, goalDifference: number): string {
  if (winner === "draw") return "0-0";
  if (winner === "A") return `+${goalDifference}`;
  return `+${goalDifference}`;
}

export function formatMatchWinnerBadge(winner: MatchWinner): string {
  if (winner === "draw") return "Empate";
  return winner === "A" ? "Ganó Local" : "Ganó Visitante";
}

export function formatMatchHeadline(
  winner: MatchWinner,
  goalDifference: number
): string {
  if (winner === "draw") return "EMPATE";
  const side = winner === "A" ? "LOCAL" : "VISITANTE";
  return `GANÓ ${side} POR ${goalDifference}`;
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
