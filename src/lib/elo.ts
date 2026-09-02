import type { MatchWinner } from "./types";

const K_FACTOR = 32;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function matchOutcomeFromWinner(
  team: "A" | "B",
  winner: MatchWinner
): 1 | 0.5 | 0 {
  if (winner === "draw") return 0.5;
  return winner === team ? 1 : 0;
}

export function calculateEloDelta(
  teamRating: number,
  opponentRating: number,
  outcome: 1 | 0.5 | 0
): number {
  const expected = expectedScore(teamRating, opponentRating);
  return K_FACTOR * (outcome - expected);
}

export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 1000;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}
