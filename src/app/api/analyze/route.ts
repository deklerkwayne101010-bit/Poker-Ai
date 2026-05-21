import 'dotenv/config';

import type { AnalysisInput, Position, GameType, OpponentType } from '@/lib/poker/engine';
import { analyzePokerHand } from '@/lib/poker/engine';
import { NextRequest, NextResponse } from 'next/server';
import { getAIReasoning, type AIRecommendationInput, type AIResponse } from '@/lib/ai/openAI';

type AnalysisResult = Record<string, unknown>;

function validateInput(body: Record<string, unknown>): string | null {
  if (!Array.isArray(body.heroCards) || body.heroCards.length === 0)
    return 'heroCards is required and must be a non-empty array';
  if (!Array.isArray(body.boardCards))
    return 'boardCards is required and must be an array';
  if (typeof body.heroPosition !== 'string' || body.heroPosition === '')
    return 'heroPosition is required and must be a non-empty string';
  if (typeof body.gameType !== 'string' || body.gameType === '')
    return 'gameType is required and must be a non-empty string';
  if (typeof body.potSize !== 'number' || !isFinite(body.potSize))
    return 'potSize is required and must be a number';
  if (typeof body.amountToCall !== 'number' || !isFinite(body.amountToCall))
    return 'amountToCall is required and must be a number';
  if (typeof body.heroStack !== 'number' || !isFinite(body.heroStack))
    return 'heroStack is required and must be a number';
  if (typeof body.effStack !== 'number' || !isFinite(body.effStack))
    return 'effStack is required and must be a number';
  if (typeof body.activeOpponents !== 'number' || !isFinite(body.activeOpponents))
    return 'activeOpponents is required and must be a number';
  if (typeof body.opponentType !== 'string' || body.opponentType === '')
    return 'opponentType is required and must be a non-empty string';
  if (typeof body.tournamentM !== 'number' || !isFinite(body.tournamentM))
    return 'tournamentM is required and must be a number';
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;

    const error = validateInput(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const input: AnalysisInput = {
      heroCards: body.heroCards as string[],
      boardCards: body.boardCards as string[],
      heroPosition: body.heroPosition as Position,
      gameType: body.gameType as GameType,
      potSize: body.potSize as number,
      amountToCall: body.amountToCall as number,
      heroStack: body.heroStack as number,
      effStack: body.effStack as number,
      activeOpponents: body.activeOpponents as number,
      opponentPositions: (body.opponentPositions ?? []) as Position[],
      opponentType: body.opponentType as OpponentType,
      tournamentM: body.tournamentM as number,
      dealerButton: body.dealerButton as number,
    };

    /* ── STEP 1: Deterministic engine (source of truth) ── */
    const engineResult = analyzePokerHand(input);

    /* ── STEP 2: OpenAI GPT-5.1-mini — best-effort AI reasoning ── */
    let aiResponse: AIResponse | null = null;
    let aiErr: { stage: string; reason: string } | null = null;

    try {
      const aiInput: AIRecommendationInput = {
        action:         engineResult.action,
        confidence:     engineResult.confidence,
        spr:            engineResult.spr,
        posAdv:         engineResult.positionAdv,
        equity:         engineResult.equity,
        potOdds:        engineResult.potOddsPct,
        gameType:       input.gameType === 'TOURNAMENT' ? 'TOURNAMENT' : 'CASH',
        opponentType:   input.opponentType,
        activeOpponents: input.activeOpponents,
        board:          input.boardCards,
        heroCards:      input.heroCards,
        amountToCall:   input.amountToCall,
        betSize:        engineResult.betSize,
        reasoning:      engineResult.reasoning,
      };
      aiResponse = await getAIReasoning(aiInput);
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'Unknown error';
      aiErr = { stage: 'openai', reason };
    }

    /* ── STEP 3: Merge engine + AI into final response ── */
    const response: AnalysisResult = {
      /* ── deterministic engine output ── */
      action:      engineResult.action,
      confidence:  engineResult.confidence,
      ev:          engineResult.ev,
      risk:        engineResult.risk,
      betSize:     engineResult.betSize,
      reasoning:   engineResult.reasoning,
      summary:     engineResult.summary,
      /* ── metrics ── */
      equity:      engineResult.equity,
      potOddsPct:  engineResult.potOddsPct,
      spr:         engineResult.spr,
      sprLabel:    engineResult.sprInfo.label,
      positionAdv: engineResult.positionAdv,
      /* ── AI reasoning (best-effort) ── */
      ...(aiResponse
        ? {
            aiReasoning:  aiResponse.reasoning,
            aiAction:     aiResponse.action,
            aiConfidence: aiResponse.confidence,
            aiEv:         aiResponse.ev,
            aiRisk:       aiResponse.risk,
            aiBetSize:    aiResponse.bet_size,
            aiUsed:       true,
          }
        : {
            aiReasoning: engineResult.reasoning,
            aiUsed:      false,
          }),
      /* ── error info if AI failed ── */
      ...(aiErr ? { aiError: aiErr } : {}),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Internal server error' },
      { status: (err as Error).message ? 500 : 400 }
    );
  }
}
