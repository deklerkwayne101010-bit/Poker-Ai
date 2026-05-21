export const SUITS = ['s', 'h', 'd', 'c'] as const;
export const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'] as const;
export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];
export interface Card { rank: Rank; suit: Suit }

export function parseCard(input: string): Card {
  return { rank: input[0] as Rank, suit: input[1] as Suit };
}

export function parseCards(...inputs: string[]): Card[] {
  return inputs.map(parseCard);
}

export type HandRank =
  | 'HIGH_CARD' | 'ONE_PAIR' | 'TWO_PAIR' | 'THREE_OF_A_KIND'
  | 'STRAIGHT' | 'FLUSH' | 'FULL_HOUSE' | 'FOUR_OF_A_KIND' | 'STRAIGHT_FLUSH';

export const HAND_RANK_ORDER: HandRank[] = [
  'HIGH_CARD','ONE_PAIR','TWO_PAIR','THREE_OF_A_KIND',
  'STRAIGHT','FLUSH','FULL_HOUSE','FOUR_OF_A_KIND','STRAIGHT_FLUSH'
];

export interface HandEval {
  rank: HandRank;
  rankValue: number;
  kickers: number[];
  description: string;
}

export const HAND_RANK_SCORES: Record<HandRank, number> = {
  HIGH_CARD: 1, ONE_PAIR: 2, TWO_PAIR: 3, THREE_OF_A_KIND: 4,
  STRAIGHT: 5, FLUSH: 6, FULL_HOUSE: 7, FOUR_OF_A_KIND: 8, STRAIGHT_FLUSH: 9
};

export function rankValue(rank: Rank): number {
  if (rank === 'T') return 10;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  if (rank === 'A') return 14;
  return parseInt(rank, 10);
}

export function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  const n = arr.length;
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    if (Array.from({ length: n }, (_, i) => (mask >> i) & 1).filter(Boolean).length === k) {
      const combo: T[] = [];
      for (let i = 0; i < n; i++) {
        if ((mask >> i) & 1) combo.push(arr[i]);
      }
      yield combo;
    }
  }
}

export function countMultiplicities(cards: Card[]): Map<Rank, number> {
  const map = new Map<Rank, number>();
  for (const card of cards) {
    map.set(card.rank, (map.get(card.rank) || 0) + 1);
  }
  return map;
}

export function countSuitMultiplicities(cards: Card[]): Map<Suit, { count: number; ranks: number[] }> {
  const map = new Map<Suit, { count: number; ranks: number[] }>();
  for (const card of cards) {
    const existing = map.get(card.suit);
    const val = rankValue(card.rank);
    if (existing) {
      existing.count++;
      existing.ranks.push(val);
    } else {
      map.set(card.suit, { count: 1, ranks: [val] });
    }
  }
  Array.from(map.values()).forEach(v => v.ranks.sort((a, b) => a - b));
  return map;
}

export function hasStraight(rankValues: number[]): boolean {
  for (let i = 0; i <= rankValues.length - 5; i++) {
    const slice = rankValues.slice(i, i + 5);
    let consecutive = true;
    for (let j = 1; j < 5; j++) {
      if (slice[j] !== slice[j - 1] + 1) { consecutive = false; break; }
    }
    if (consecutive) return true;
  }
  return false;
}

export function getStraightTop(rankValues: number[]): number | null {
  for (let i = 0; i <= rankValues.length - 5; i++) {
    const slice = rankValues.slice(i, i + 5);
    let consecutive = true;
    for (let j = 1; j < 5; j++) {
      if (slice[j] !== slice[j - 1] + 1) { consecutive = false; break; }
    }
    if (consecutive) return slice[4];
  }
  return null;
}

export function checkStraightFlush(cards: Card[]): { isSF: boolean; top: number | null } {
  const suitMap = countSuitMultiplicities(cards);
  let bestTop: number | null = null;
  Array.from(suitMap.values()).forEach(({ count, ranks }) => {
    if (count >= 5) {
      const top = getStraightTop(ranks);
      if (top) {
        if (!bestTop || top > bestTop) bestTop = top;
      }
    }
  });
  return { isSF: bestTop !== null, top: bestTop };
}

export function rankName(value: number): string {
  if (value >= 2 && value <= 10) return String(value);
  if (value === 11) return 'J';
  if (value === 12) return 'Q';
  if (value === 13) return 'K';
  if (value === 14) return 'A';
  return '';
}

export function evaluateHand(cards: Card[]): HandEval {
  const mult = countMultiplicities(cards);
  const ranks = cards.map(c => rankValue(c.rank)).sort((a, b) => a - b);
  const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b);

  const sfCheck = checkStraightFlush(cards);
  if (sfCheck.isSF) {
    const desc = sfCheck.top === 14 ? 'Royal Flush' : `${rankName(sfCheck.top!)}-high Straight Flush`;
    return { rank: 'STRAIGHT_FLUSH', rankValue: HAND_RANK_SCORES.STRAIGHT_FLUSH, kickers: [], description: desc };
  }

  const multEntries = Array.from(mult.entries());
  for (const [rank, count] of multEntries) {
    if (count === 4) {
      const kicker = uniqueRanks.filter(r => r !== rankValue(rank as Rank)).sort((a, b) => b - a)[0];
      return { rank: 'FOUR_OF_A_KIND', rankValue: HAND_RANK_SCORES.FOUR_OF_A_KIND, kickers: [kicker], description: `Quad ${rankName(rankValue(rank as Rank))}` };
    }
  }

  let trips: Rank | null = null;
  let pair: Rank | null = null;
  for (const [rank, count] of multEntries) {
    if (count === 3) trips = rank;
    if (count >= 2 && count !== 3) pair = rank;
  }
  if (trips && pair) {
    return { rank: 'FULL_HOUSE', rankValue: HAND_RANK_SCORES.FULL_HOUSE, kickers: [], description: `${rankName(rankValue(trips))} full of ${rankName(rankValue(pair))}` };
  }

  const suitMap = countSuitMultiplicities(cards);
  for (const { count, ranks: suitRanks } of Array.from(suitMap.values())) {
    if (count >= 5) {
      const top5 = suitRanks.sort((a, b) => b - a).slice(0, 5);
      return { rank: 'FLUSH', rankValue: HAND_RANK_SCORES.FLUSH, kickers: top5, description: `${rankName(top5[0])}-high flush` };
    }
  }

  const wheelRanks = [...uniqueRanks];
  if (wheelRanks.includes(14)) wheelRanks.push(1); // Add 1 for wheel check
  const wheelTop = getStraightTop(wheelRanks);
  const normalTop = getStraightTop(uniqueRanks);
  if (normalTop !== null || wheelTop !== null) {
    const top = normalTop ?? wheelTop!;
    const straightKickers = uniqueRanks.filter(r => r > top || r < top - 4 || (r === 14 && top === 5));
    return { rank: 'STRAIGHT', rankValue: HAND_RANK_SCORES.STRAIGHT, kickers: straightKickers, description: `${rankName(top)}-high straight` };
  }

  if (trips) {
    const kickers = uniqueRanks.filter(r => r !== rankValue(trips!)).sort((a, b) => b - a).slice(0, 2);
    return { rank: 'THREE_OF_A_KIND', rankValue: HAND_RANK_SCORES.THREE_OF_A_KIND, kickers, description: `Trip ${rankName(rankValue(trips))}` };
  }

  const pairs = multEntries.filter(([, c]) => c === 2).map(([r]) => rankValue(r as Rank)).sort((a, b) => b - a);
  if (pairs.length >= 2) {
    const kickers = uniqueRanks.filter(r => r !== pairs[0] && r !== pairs[1]).sort((a, b) => b - a).slice(0, 1);
    return { rank: 'TWO_PAIR', rankValue: HAND_RANK_SCORES.TWO_PAIR, kickers: [...kickers], description: `${rankName(pairs[0])} pair & ${rankName(pairs[1])} pair` };
  }

  if (pairs.length === 1) {
    const kickers = uniqueRanks.filter(r => r !== pairs[0]).sort((a, b) => b - a).slice(0, 3);
    return { rank: 'ONE_PAIR', rankValue: HAND_RANK_SCORES.ONE_PAIR, kickers, description: `${rankName(pairs[0])} pair` };
  }

  const top5 = uniqueRanks.slice(-5).reverse();
  return { rank: 'HIGH_CARD', rankValue: HAND_RANK_SCORES.HIGH_CARD, kickers: top5, description: `${rankName(top5[0])}-high` };
}

export interface handComparison {
  winner: 'hero' | 'opponent' | 'tie';
  heroEval: HandEval;
  opponentEval: HandEval;
}

export function compareHands(heroCards: Card[], opponentCards: Card[]): handComparison {
  const heroEval = evaluateHand(heroCards);
  const oppEval = evaluateHand(opponentCards);
  if (heroEval.rankValue > oppEval.rankValue) return { winner: 'hero', heroEval, opponentEval: oppEval };
  if (oppEval.rankValue > heroEval.rankValue) return { winner: 'opponent', heroEval, opponentEval: oppEval };
  for (let i = 0; i < Math.max(heroEval.kickers.length, oppEval.kickers.length); i++) {
    const h = heroEval.kickers[i] || 0;
    const o = oppEval.kickers[i] || 0;
    if (h !== o) return h > o ? { winner: 'hero', heroEval, opponentEval: oppEval } : { winner: 'opponent', heroEval, opponentEval: oppEval };
  }
  return { winner: 'tie', heroEval, opponentEval: oppEval };
}

export type OpponentType = 'Nit' | 'Tight' | 'TAG' | 'LAG' | 'Maniac' | 'Unknown';

export interface EquityResult {
  heroEquity: number;
  opponentRangeWin: number;
  ties: number;
  description: string;
}

export const HAND_VS_RANGE_EQUITY: Record<string, Record<OpponentType, { min: number; max: number }>> = {
  'AA': { Nit: { min: 82, max: 85 }, Tight: { min: 81, max: 84 }, TAG: { min: 80, max: 82 }, LAG: { min: 78, max: 80 }, Maniac: { min: 70, max: 72 }, Unknown: { min: 78, max: 80 } },
  'KK': { Nit: { min: 78, max: 80 }, Tight: { min: 77, max: 79 }, TAG: { min: 76, max: 78 }, LAG: { min: 74, max: 76 }, Maniac: { min: 66, max: 68 }, Unknown: { min: 74, max: 76 } },
  'QQ': { Nit: { min: 72, max: 74 }, Tight: { min: 71, max: 73 }, TAG: { min: 70, max: 72 }, LAG: { min: 68, max: 70 }, Maniac: { min: 62, max: 64 }, Unknown: { min: 68, max: 70 } },
  'JJTT': { Nit: { min: 66, max: 72 }, Tight: { min: 64, max: 70 }, TAG: { min: 64, max: 68 }, LAG: { min: 60, max: 66 }, Maniac: { min: 55, max: 62 }, Unknown: { min: 62, max: 68 } },
  'AKsAQs': { Nit: { min: 60, max: 66 }, Tight: { min: 59, max: 65 }, TAG: { min: 58, max: 64 }, LAG: { min: 56, max: 62 }, Maniac: { min: 52, max: 58 }, Unknown: { min: 58, max: 64 } },
  'AKoAQo': { Nit: { min: 55, max: 60 }, Tight: { min: 54, max: 59 }, TAG: { min: 53, max: 58 }, LAG: { min: 50, max: 56 }, Maniac: { min: 48, max: 54 }, Unknown: { min: 54, max: 58 } },
  'JTs98s87s': { Nit: { min: 48, max: 55 }, Tight: { min: 47, max: 53 }, TAG: { min: 46, max: 52 }, LAG: { min: 45, max: 52 }, Maniac: { min: 44, max: 52 }, Unknown: { min: 50, max: 56 } },
  '44-22': { Nit: { min: 46, max: 52 }, Tight: { min: 45, max: 51 }, TAG: { min: 44, max: 50 }, LAG: { min: 44, max: 50 }, Maniac: { min: 44, max: 50 }, Unknown: { min: 50, max: 56 } },
  'KJsQJs': { Nit: { min: 48, max: 52 }, Tight: { min: 47, max: 51 }, TAG: { min: 46, max: 50 }, LAG: { min: 44, max: 50 }, Maniac: { min: 42, max: 50 }, Unknown: { min: 48, max: 54 } },
  'lowSCD': { Nit: { min: 44, max: 48 }, Tight: { min: 43, max: 47 }, TAG: { min: 42, max: 48 }, LAG: { min: 42, max: 48 }, Maniac: { min: 40, max: 48 }, Unknown: { min: 46, max: 52 } },
  'trash': { Nit: { min: 32, max: 40 }, Tight: { min: 31, max: 39 }, TAG: { min: 30, max: 38 }, LAG: { min: 28, max: 36 }, Maniac: { min: 26, max: 36 }, Unknown: { min: 36, max: 42 } }
};

function getHandProfile(cards: Card[]): string {
  const ranks = cards.map(c => c.rank).sort((a, b) => RANKS.indexOf(b) - RANKS.indexOf(a));
  const suits = cards.map(c => c.suit);
  const isPair = ranks[0] === ranks[1];
  const isSuited = suits[0] === suits[1];
  if (isPair) {
    if (ranks[0] === 'A') return 'AA';
    if (ranks[0] === 'K') return 'KK';
    if (ranks[0] === 'Q') return 'QQ';
    if (['J', 'T'].includes(ranks[0])) return 'JJTT';
    return '44-22';
  }
  if (isSuited) {
    if (['A', 'K', 'Q'].includes(ranks[0]) && ['K', 'Q', 'J'].includes(ranks[1])) return 'AKsAQs';
    if (['K', 'Q', 'J'].includes(ranks[0]) && ['Q', 'J', 'T'].includes(ranks[1])) return 'KJsQJs';
    return 'lowSCD';
  }
  if (['A', 'K', 'Q'].includes(ranks[0]) && ['K', 'Q', 'J'].includes(ranks[1])) return 'AKoAQo';
  if (['J', 'T', '9'].includes(ranks[0]) && ['T', '9', '8'].includes(ranks[1])) return 'JTs98s87s';
  return 'trash';
}

export function estimateEquity(
  heroCards: Card[],
  boardCards: Card[],
  opponentType: OpponentType,
  activeOpponents: number
): EquityResult {
  const profile = getHandProfile(heroCards);
  const range = HAND_VS_RANGE_EQUITY[profile]?.[opponentType] || { min: 50, max: 55 };
  const baseEquity = (range.min + range.max) / 200;
  const curEquity = baseEquity * Math.pow(0.88, activeOpponents - 1) * Math.min(activeOpponents * 0.12, 0.5);
  const heroEquity = Math.max(0, Math.min(1, curEquity));
  const opponentRangeWin = Math.max(0, 1 - curEquity);
  const ties = 0;
  return {
    heroEquity,
    opponentRangeWin,
    ties,
    description: `Hero wins ${(heroEquity * 100).toFixed(1)}%`
  };
}

export type Position = 'UTG' | 'UTG1' | 'MP' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export const POSITIONS: Position[] = ['UTG', 'UTG1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
export const POSITION_NAMES: Record<Position, string> = {
  UTG: 'UTG', UTG1: 'UTG+1', MP: 'MP', HJ: 'HJ', CO: 'CO', BTN: 'BTN', SB: 'SB', BB: 'BB'
};

export function positionAdvantage(heroPos: Position): number {
  const scores: Record<Position, number> = { UTG: -0.3, UTG1: 0.1, MP: 0.3, HJ: 0.5, CO: 0.7, BTN: 1.0, SB: -0.1, BB: 0.05 };
  return scores[heroPos];
}

export function positionLabel(pos: Position): string {
  return POSITION_NAMES[pos];
}

export function potOdds(toCall: number, potSize: number): number {
  return toCall / (potSize + toCall);
}

export function impliedOdds(heroStack: number, effStack: number, potOddsNeeded: number): number {
  const effectiveStack = Math.min(heroStack, effStack);
  const futurePotential = effectiveStack + potOddsNeeded;
  return Number((futurePotential / Math.max(potOddsNeeded, 0.01)).toFixed(2));
}

export function spr(effStack: number, potSize: number): number {
  return Math.round((effStack / Math.max(potSize, 0.01)) * 100) / 100;
}

export type GameType = 'TOURNAMENT' | 'CASH';
export const GAME_TYPE_LABELS: Record<GameType, string> = {
  TOURNAMENT: 'Tournament', CASH: 'Cash Game'
};

export interface SPRInfo {
  spr: number;
  label: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  betSizingMultiplier: number;
}

export function sprInfo(effStack: number, potSize: number): SPRInfo {
  const s = spr(effStack, potSize);
  if (s <= 3) {
    return { spr: s, label: 'LOW', description: 'Commit-heavy territory', betSizingMultiplier: 0.67 };
  }
  if (s <= 10) {
    return { spr: s, label: 'MEDIUM', description: 'Standard c-bet sizing', betSizingMultiplier: 1.0 };
  }
  return { spr: s, label: 'HIGH', description: 'Deep-stack play, overbet options', betSizingMultiplier: 1.33 };
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

export interface AnalysisInput {
  heroCards: string[];
  boardCards: string[];
  heroPosition: Position;
  gameType: GameType;
  potSize: number;
  amountToCall: number;
  heroStack: number;
  effStack: number;
  activeOpponents: number;
  opponentPositions: Position[];
  opponentType: OpponentType;
  tournamentM: number;
  dealerButton: number;
}

export function analyzePokerHand(input: AnalysisInput): Recommendation & { equity: number; potOddsPct: number; spr: number; sprInfo: SPRInfo; positionAdv: number } {
  const heroCards = parseCards(...input.heroCards);
  const boardCards = parseCards(...input.boardCards);

  const { heroEquity } = estimateEquity(heroCards, boardCards, input.opponentType, input.activeOpponents);
  const potOddsDecimal = input.amountToCall === 0 ? 0 : potOdds(input.amountToCall, input.potSize);
  const sprInf = sprInfo(input.effStack, input.potSize);
  const positionAdv = positionAdvantage(input.heroPosition);

  let score = heroEquity * 100;
  let baseSizing = sprInf.betSizingMultiplier;

  if (potOddsDecimal > 0) {
    const effectiveOdds = heroEquity / potOddsDecimal;
    if (effectiveOdds >= 3) score += 20;
    else if (effectiveOdds >= 2) score += 10;
    else if (effectiveOdds < 1) score -= 25;
  }

  score += positionAdv * 10;
  if (sprInf.label === 'LOW') score += 5;
  if (sprInf.label === 'HIGH') score += 8;

  if (input.gameType === 'TOURNAMENT') {
    const tournamentTightness = Math.max(0, (12 - input.tournamentM) * 1.5);
    score -= tournamentTightness;
    if (input.activeOpponents > 2) score -= 3 * (input.activeOpponents - 2);
  }

  const dilution = Math.max(0, (input.activeOpponents - 1) * 0.03);
  score -= dilution * 100;

  const allRanks = [...heroCards.map(c => rankValue(c.rank)), ...boardCards.map(c => rankValue(c.rank))];
  if (allRanks.some(r => r >= 10)) score += 5;

  score = Math.max(0, Math.min(100, score));

  if (input.gameType === 'TOURNAMENT' && input.tournamentM <= 10) {
    baseSizing *= 0.7;
  }

  let action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'JAM';
  let confidence = 0;
  let betSize = '';

  if (score >= 80) {
    action = 'JAM';
    confidence = score;
    betSize = 'All-In';
  } else if (score >= 65) {
    action = 'RAISE';
    confidence = score;
    betSize = sprInf.label === 'LOW' ? '2.5x Pot' : sprInf.label === 'MEDIUM' ? 'Pot' : '1.5x Pot';
  } else if (score >= 40) {
    action = input.amountToCall > 0 ? 'CALL' : 'CHECK';
    confidence = score;
    betSize = 'N/A';
  } else if (score >= 20) {
    action = 'BET';
    confidence = score;
    betSize = `${baseSizing.toFixed(2)}x Pot`;
  } else {
    action = 'FOLD';
    confidence = score;
    betSize = 'N/A';
  }

  let ev: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  if (score >= 80) ev = 'VERY_HIGH';
  else if (score >= 60) ev = 'HIGH';
  else if (score >= 40) ev = 'MEDIUM';
  else if (score >= 20) ev = 'LOW';
  else ev = 'VERY_LOW';

  let risk: 'LOW' | 'MEDIUM' | 'HIGH';
  if (input.activeOpponents >= 4 || sprInf.label === 'HIGH') risk = 'HIGH';
  else if (input.activeOpponents >= 2 || sprInf.label === 'MEDIUM') risk = 'MEDIUM';
  else risk = 'LOW';

  const reasoning: string[] = [];
  if (heroEquity >= 0.55) reasoning.push('Strong hand with winning equity');
  else if (heroEquity >= 0.45) reasoning.push('Decent raw equity');
  else if (heroEquity >= 0.33) reasoning.push('Marginal equity, rely on pot odds');

  if (potOddsDecimal > 0) {
    const effectiveOdds = heroEquity / potOddsDecimal;
    if (effectiveOdds >= 2) reasoning.push('Excellent pot odds for call');
    else if (effectiveOdds < 1) reasoning.push('Insufficient pot odds to continue');
  }

  if (positionAdv >= 0.5) reasoning.push('Strong positional advantage');
  else if (positionAdv < -0.2) reasoning.push('Out of position, tighter range required');

  if (sprInf.label === 'LOW') reasoning.push('Shallow SPR – committing is correct');
  else if (sprInf.label === 'HIGH') reasoning.push('Deep stack gives room to apply pressure');

  if (input.gameType === 'TOURNAMENT') reasoning.push('Tournament ICM pressure present');
  if (input.activeOpponents > 2) reasoning.push('Multi-way pot complicates equity calculation');

  const summary = `${action} (${confidence.toFixed(0)}% confidence) - ${ev} EV, ${risk} risk`;

  return {
    action,
    confidence: Math.round(confidence),
    ev,
    risk,
    betSize,
    reasoning,
    summary,
    equity: heroEquity,
    potOddsPct: potOddsDecimal,
    spr: sprInf.spr,
    sprInfo: sprInf,
    positionAdv
  };
}