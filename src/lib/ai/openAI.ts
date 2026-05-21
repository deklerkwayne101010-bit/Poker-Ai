import OpenAI from 'openai';

const PROMPT_TEMPLATE = `You are a world-class professional poker coach analyzing a single Texas Hold'em hand.
Your job is to explain the ENGINE'S DECISION in plain English — NOT question it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPUTED OUTPUT FROM MATHEMATICAL ENGINE (do not contradict this output):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recommended Action:  {action}
Confidence Score:   {confidence}%
Stack-to-Pot Ratio: {spr}
Position Advantage: {posAdv}
 estimated Equity:   {equityPct}%
Pot Odds:           {potOddsPct}%
Game Type:          {gameType}
Opponent Type:      {opponentType}
Active Opponents:   {activeOpponents}
Board:              {boardLabel}
Hero Cards:         {heroCardsLabel}
Amount to Call:     {amountToCall}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Agree with the engine's decision.
2. Write exactly {n} short bullet reasons (between 1–6 words each) for WHY that decision is correct, grounded in the computed metrics above.
3. Every bullet must be a concrete, factual poker concept — not motivational fluff.

⚠ RULES:
- NEVER contradict the action the engine already chose.
- NEVER break out of comma-separated phrasing; use commas only
- Output ONLY the JSON object — no markdown, no prose, no code fences.
- Exactly {n} reasoning items.
- Confidence: return only the integer 0-100 as the "confidence" field. If an integer is not already available use the closest integer value in 0-100. If unsure, use the default.

Return valid JSON matching this schema:
{
  "action": "FOLD|CHECK|CALL|BET|RAISE|JAM",
  "confidence": <integer 0-100>,
  "ev": "VERY_LOW|LOW|MEDIUM|HIGH|VERY_HIGH",
  "risk": "LOW|MEDIUM|HIGH",
  "bet_size": "<bet sizing string>",
  "reasoning": ["<bullet 1>", "...", "<bullet {n}>"]
}`;

export interface AIRecommendationInput {
  action: string;
  confidence: number;
  spr: number;
  posAdv: number;
  equity: number;
  potOdds: number;
  gameType: string;
  opponentType: string;
  activeOpponents: number;
  board: string[];
  heroCards: string[];
  amountToCall: number;
  betSize: string;
  reasoning: string[];
}

export interface AIResponse {
  action: string;
  confidence: number;
  ev: string;
  risk: string;
  bet_size: string;
  reasoning: string[];
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const key = process.env['OPENAI_API_KEY'];
  if (!key) throw new Error('OPENAI_API_KEY is not set — add it to .env.local');
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

export async function getAIReasoning(input: AIRecommendationInput): Promise<AIResponse> {
  const key = process.env['OPENAI_API_KEY'];
  if (!key) throw new Error('OPENAI_API_KEY is not set');

  const reasoningCount = input.reasoning?.length ?? 3;

  const prompt = PROMPT_TEMPLATE
    .replace('{action}', input.action)
    .replace('{confidence}', String(Math.round(input.confidence)))
    .replace('{spr}', input.spr < 0.01 ? '< 0.01 (all-in preflop)' : input.spr.toFixed(1))
    .replace('{posAdv}', input.posAdv >= 0 ? `+${input.posAdv.toFixed(2)}` : input.posAdv.toFixed(2))
    .replace('{equityPct}', (input.equity * 100).toFixed(1))
    .replace('{potOddsPct}', (input.potOdds * 100).toFixed(1))
    .replace('{gameType}', input.gameType.toUpperCase() === 'TOURNAMENT' ? 'Tournament' : 'Cash Game')
    .replace('{opponentType}', input.opponentType)
    .replace('{activeOpponents}', String(input.activeOpponents))
    .replace('{boardLabel}', input.board.length ? input.board.join(' ') : '(preflop — no board)')
    .replace('{heroCardsLabel}', input.heroCards.length ? input.heroCards.join(' ') : '(unknown)')
    .replace('{amountToCall}', String(input.amountToCall))
    .replace('{betSize}', input.betSize)
    .replace('{n}', String(reasoningCount));

  const openai = getClient();

  // Use Chat Completions API with gpt-5.1-mini (released May 2025)
  const response = await openai.chat.completions.create({
    model: 'gpt-5.1-mini',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.15,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(raw) as AIResponse;
  } catch {
    return {
      action: input.action,
      confidence: Math.round(input.confidence),
      ev: 'MEDIUM',
      risk: 'MEDIUM',
      bet_size: input.betSize,
      reasoning: ['AI reasoning unavailable — interpret metrics above.'],
    };
  }
}
