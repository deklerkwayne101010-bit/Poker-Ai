export type Position = 'UTG' | 'UTG1' | 'MP' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type OpponentType = 'Nit' | 'Tight' | 'TAG' | 'LAG' | 'Maniac' | 'Unknown';
export type GameType = 'TOURNAMENT' | 'CASH';

export interface GameState {
  gameType: GameType;
  heroPosition: Position;
  numPlayers: number;
  heroStack: number;
  effStack: number;
  potSize: number;
  amountToCall: number;
  amountFacingAllIn: number;
  blinds: { small: number; big: number };
  ante: number;
  actionHistory: { street: string; action: string; amount?: number }[];
}

export interface OpponentInfo {
  activeCount: number;
  positions: Position[];
  types: OpponentType[];
}

export interface HandInput {
  heroCards: string[];
  boardCards: string[];
}

export interface Recommendation {
  action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'JAM';
  confidence: number;
  ev: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  betSize: string;
  reasoning: string[];
  summary: string;
}
