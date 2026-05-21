
export interface RangeEntry {
  hands: string[];
  percentage: number;
}

export interface PushFoldEntry {
  hands: string[];
  m: number;
}

export const PREFLOP_OPEN_RANGES: Record<string, RangeEntry> = {
  UTG: {
    percentage: 15,
    hands: [
      'AA','KK','QQ','JJ','TT','99',
      'AKs','AQs','AJs','ATs','A9s','A8s','KQs',
      'AKo','AQo','AJo',
      'JTs','T9s','98s','87s','76s','65s',
      'QJs',
    ],
  },
  UTG1: {
    percentage: 18,
    hands: [
      'AA','KK','QQ','JJ','TT','99','88',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','KQs','KJs',
      'AKo','AQo','AJo','KQo',
      'QTs','JTs','T9s','98s','87s','76s','65s','54s',
      '55',
    ],
  },
  MP: {
    percentage: 20,
    hands: [
      'AA','KK','QQ','JJ','TT','99','88','77',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','KQs','KJs','KTs',
      'KT',
      'QJs','QTs','JTs','T9s','98s','87s','76s','65s','54s',
      'AKo','AQo','AJo','KQo','KJo','QJo',
      '44','33','22',
      'A4s','A3s','A2s',
    ],
  },
  HJ: {
    percentage: 24,
    hands: [
      'AA','KK','QQ','JJ','TT','99','88','77','66',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'KQs','KJs','KTs','K9s','QJs','QTs','Q9s',
      'JTs','J9s',
      'T9s','T8s','98s','97s','87s','86s','76s','75s','65s','64s','54s',
      'AKo','AQo','AJo','ATo','KQo','KJo','QJo','JTo',
      '55','44','33','22',
    ],
  },
  CO: {
    percentage: 30,
    hands: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'KQs','KJs','KTs','K9s','K8s',
      'QJs','QTs','Q9s','Q8s',
      'JTs','J9s','J8s',
      'T9s','T8s','T7s',
      '98s','97s','96s',
      '87s','86s','85s',
      '76s','75s','74s','65s','64s','63s','54s','53s','43s',
      'AKo','AQo','AJo','ATo','A9o',
      'KQo','KJo','KTo',
      'QJo','QTo','JTo',
      '44','33','22',
    ],
  },
  BTN: {
    percentage: 38,
    hands: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s',
      'QJs','QTs','Q9s','Q8s','Q7s','Q6s',
      'JTs','J9s','J8s','J7s',
      'T9s','T8s','T7s','T6s',
      '98s','97s','96s','95s',
      '87s','86s','85s','84s',
      '76s','75s','74s','73s',
      '65s','64s','63s','62s',
      '54s','53s','52s',
      '43s','42s',
      '32s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
      'KQo','KJo','KTo','K9o','QJo','QTo','Q9o','JTo','J9o','T9o',
    ],
  },
  SB: {
    percentage: 28,
    hands: [
      'AA','KK','QQ','JJ','TT','99','88','77','66',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'KQs','KJs','KTs','K9s',
      'QJs','QTs','Q9s',
      'JTs','J9s',
      'T9s','T8s',
      '98s','97s','87s','86s','76s','75s','65s','64s','54s',
      'AKo','AQo','AJo','ATo','KQo','KJo','QJo',
      '55','44','33','22',
    ],
  },
  BB: {
    percentage: 35,
    hands: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'KQs','KJs','KTs','K9s','K8s',
      'QJs','QTs','Q9s','Q8s',
      'JTs','J9s','J8s',
      'T9s','T8s','T7s',
      '98s','97s','96s',
      '87s','86s','85s','76s','75s','74s','65s','64s','63s','54s','53s','43s',
      'AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo',
      '33','22',
    ],
  },
} as const;

const WP = [
  'AA','KK','QQ','JJ','TT','AKs','AQs','AJs','KQs','AKo','99','88','77','ATs',
  'KJs','QJs','JTs','T9s','98s','87s','76s','A9s','A8s','A7s','A6s','A5s','A4s',
  'A3s','A2s','66','55','44','33','22','KQo','KJo','QJo','T8s','97s','86s','65s',
  'AQo','KTo','QTo','JTo',
];

export function equityAgainstRange(_hero: string[], _board: string[]): number {
  void _hero; void _board;
  return 0.5;
}

export function effectiveSPR(effStack: number, pot: number): number {
  return +(effStack / (pot || 1)).toFixed(1);
}

export function potOdds(pot: number, call: number): number {
  if (call <= 0) return 0;
  return +(call / (pot + call) * 100).toFixed(1);
}

function wpExpansion(): string[] {
  return WP;
}

export const PUSH_FOLD_CHARTS: Record<string, { hands: string[]; m: number }> = {
  M1: {
    m: 1,
    hands: wpExpansion(),
  },
  M5: {
    m: 5,
    hands: wpExpansion(),
  },
  M10: {
    m: 10,
    hands: wpExpansion(),
  },
};
