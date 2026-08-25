export type Position = "arquero" | "defensa" | "mediocampo" | "delantero" | "cualquiera";
export type TeamSide = "A" | "B";

export interface Player {
  id: string;
  name: string;
  photo_url: string | null;
  position: Position;
  elo_rating: number;
  reference_player_id: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  played_at: string;
  venue: string;
  team_a_score: number;
  team_b_score: number;
  created_at: string;
}

export interface MatchParticipant {
  id: string;
  match_id: string;
  player_id: string;
  team: TeamSide;
}

export interface MatchWithParticipants extends Match {
  participants: (MatchParticipant & { player: Player })[];
}

export interface PlayerMatchResult {
  matchId: string;
  playedAt: string;
  team: TeamSide;
  teamScore: number;
  opponentScore: number;
  result: "win" | "loss" | "draw";
  teammates: string[];
  opponents: string[];
}

export interface PlayerStats {
  playerId: string;
  name: string;
  photoUrl: string | null;
  position: Position;
  eloRating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  currentStreak: { type: "win" | "loss" | "draw"; count: number };
  recentForm: Array<"W" | "L" | "D">;
  bestTeammates: Array<{ playerId: string; name: string; winRate: number; matches: number }>;
  toughestOpponents: Array<{ playerId: string; name: string; winRate: number; matches: number }>;
}

export interface SuggestTeamsRequest {
  playerIds: string[];
  newPlayerMappings?: Record<string, string>;
  excludeKeys?: string[];
}

export interface TeamSuggestion {
  teamA: Player[];
  teamB: Player[];
  teamARating: number;
  teamBRating: number;
  balanceScore: number;
  suggestionKey: string;
}

export const POSITIONS: { value: Position; label: string }[] = [
  { value: "arquero", label: "Arquero" },
  { value: "defensa", label: "Defensa" },
  { value: "mediocampo", label: "Mediocampo" },
  { value: "delantero", label: "Delantero" },
  { value: "cualquiera", label: "Cualquiera" },
];
