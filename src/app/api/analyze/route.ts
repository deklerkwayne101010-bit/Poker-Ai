export const dynamic = 'force-dynamic';

import type { AnalysisInput, Position, GameType, OpponentType } from '@/lib/poker/engine';
import { analyzePokerHand } from '@/lib/poker/engine';
import { NextRequest, NextResponse } from 'next/server';
import type { Recommendation, SPRInfo } from '@/lib/poker/engine';

type AnalysisResult = Recommendation & { equity: number; potOddsPct: number; spr: number; sprInfo: SPRInfo; positionAdv: number };

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
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

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
      opponentPositions: body.opponentPositions as Position[],
      opponentType: body.opponentType as OpponentType,
      tournamentM: body.tournamentM as number,
      dealerButton: body.dealerButton as number,
    };

    const result: AnalysisResult = analyzePokerHand(input);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Internal server error' },
      { status: (err as Error).message ? 500 : 400 }
    );
  }
}
