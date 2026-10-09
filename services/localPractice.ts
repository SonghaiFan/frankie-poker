import { Card, GameConfig, GamePhase, Player } from '../types';
import { bestHandOf } from './pokerEvaluator';
import { handPercentile } from './preflop';
import type { ActionOption } from './pokerSituation';

export const LOCAL_MODEL = 'local/rules';
export const PRACTICE_STACK = 1000;
export const isLocalGame = (config: GameConfig) => config.mode === 'local';

// Force every seat onto the local path, even with saved remote/custom settings.
export const prepareLocalGame = (config: GameConfig): GameConfig => ({
  ...config,
  mode: 'local',
  aiModel: LOCAL_MODEL,
  opponentModels: Array.from({ length: config.opponentCount }, () => LOCAL_MODEL),
  opponents: config.opponents?.map(seat => ({ name: seat.name, model: LOCAL_MODEL })),
});

// A simple deterministic practice bot, not a poker-strength model.
// Only its own cards, the revealed board and public betting amounts are inputs.
export function localDecision(
  player: Pick<Player, 'hand' | 'chips' | 'currentBet'>,
  board: Card[], phase: GamePhase, pot: number, highBet: number, bigBlind: number,
): { action: ActionOption; amount?: number; reasoning: string } {
  const toCall = Math.max(0, Math.min(highBet - player.currentBet, player.chips));
  const maxTotal = player.chips + player.currentBet;
  const passive = toCall > 0 ? 'fold' : 'check';
  if (player.hand.length !== 2 || player.chips <= 0) {
    return { action: passive, reasoning: 'Local rules: take the safe action.' };
  }
  const preflop = phase === GamePhase.PRE_FLOP;
  // The UI deals five cards up front. Never inspect unrevealed streets.
  const visible = board.slice(0, preflop ? 0 : phase === GamePhase.FLOP ? 3 : phase === GamePhase.TURN ? 4 : 5);
  const percentile = preflop ? handPercentile(player.hand) : 1;
  const rank = visible.length >= 3 ? bestHandOf([...player.hand, ...visible]).rankValue : -1;
  const strong = preflop ? percentile <= 0.12 : rank >= 2;
  const playable = preflop ? percentile <= 0.65 : rank >= 1;
  // One modest value raise; meet a later re-raise by calling, avoiding loops.
  if (strong && player.currentBet <= bigBlind && highBet <= 3 * bigBlind && maxTotal > highBet) {
    const amount = Math.min(maxTotal, Math.max(highBet + bigBlind,
      Math.round((highBet + Math.max(bigBlind, pot / 2)) / bigBlind) * bigBlind));
    return { action: 'raise', amount, reasoning: 'Local rules: strong hand, modest value raise.' };
  }
  if (toCall === 0) return { action: 'check', reasoning: 'Local rules: check when playing is free.' };
  const affordable = toCall <= Math.max(2 * bigBlind, Math.min(pot / 2, player.chips / 4));
  if (strong || (playable && affordable) || toCall <= bigBlind) {
    return { action: 'call', reasoning: 'Local rules: continue with a playable hand or a small call.' };
  }
  return { action: 'fold', reasoning: 'Local rules: fold a weak hand facing an expensive bet.' };
}
