import assert from 'node:assert/strict';
import { Card, GamePhase, Suit } from '../types';
import { DEFAULT_CONFIG, initializeGame } from '../constants';
import { LOCAL_MODEL, localDecision, prepareLocalGame } from '../services/localPractice';
import { getAIDecision } from '../services/pokerAi';
import { applyAction, createEngine, currentHighBet, potTotal, startHand, visibleBoard } from '../services/pokerEngine';

const card = (rank: string, suit: Suit): Card => ({ rank, suit, id: rank + suit });
const aces = [card('A', Suit.Hearts), card('A', Suit.Spades)];
const junk = [card('7', Suit.Clubs), card('2', Suit.Diamonds)];
const board = [card('K', Suit.Hearts), card('9', Suit.Spades), card('4', Suit.Clubs), card('J', Suit.Clubs), card('8', Suit.Diamonds)];
const player = { hand: aces, chips: 1000, currentBet: 0 };
assert.equal(localDecision(player, [], GamePhase.PRE_FLOP, 15, 10, 10).action, 'raise');
assert.equal(localDecision({ ...player, hand: junk }, [], GamePhase.PRE_FLOP, 500, 200, 10).action, 'fold');
assert.equal(localDecision({ ...player, hand: junk }, board, GamePhase.RIVER, 100, 0, 10).action, 'check');
assert.equal(localDecision(player, board, GamePhase.RIVER, 100, 20, 10).action, 'call');
assert.equal(localDecision({ ...player, hand: [] }, [], GamePhase.PRE_FLOP, 0, 0, 10).action, 'check');
const futureAces = [...board.slice(0, 3), card('A', Suit.Clubs), card('A', Suit.Diamonds)];
assert.deepEqual(localDecision(player, futureAces, GamePhase.FLOP, 100, 0, 10), localDecision(player, board.slice(0, 3), GamePhase.FLOP, 100, 0, 10));
assert.deepEqual(localDecision(player, futureAces, GamePhase.TURN, 100, 0, 10), localDecision(player, futureAces.slice(0, 4), GamePhase.TURN, 100, 0, 10));
const short = localDecision({ ...player, chips: 12 }, [], GamePhase.PRE_FLOP, 15, 10, 10);
assert.equal(short.amount, 12);
assert.equal(localDecision({ ...player, chips: 5 }, [], GamePhase.PRE_FLOP, 15, 10, 10).action, 'call');

const original = { ...DEFAULT_CONFIG, opponents: [{ name: 'Test', model: 'remote/model', prompt: 'keep me', styleKey: 'RAW' }] };
const practice = prepareLocalGame(original);
assert.equal(original.opponents[0].prompt, 'keep me');
assert.equal(practice.aiModel, LOCAL_MODEL);
assert.ok(practice.opponentModels?.every(model => model === LOCAL_MODEL));
assert.deepEqual(practice.opponents, [{ name: 'Test', model: LOCAL_MODEL }]);

let networkCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { networkCalls++; throw new Error('Local practice must never fetch'); };
const random = Math.random;
let seed = 20261009;
Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const streets = new Set<GamePhase>();
let showdowns = 0;
try {
  const testPlayer = { ...initializeGame(practice).players.find(p => !p.isHuman)!, hand: aces, chips: 1000, currentBet: 0 };
  const hiddenPlayers = new Proxy([], { get() { throw new Error('Opponent data must not be read'); } });
  await getAIDecision(testPlayer, hiddenPlayers, [], 15, GamePhase.PRE_FLOP, 10, 10, []);
  // Fixed-seed offline fixtures only. No tournament runner or provider calls.
  for (const count of [1, 5, 9]) {
    for (let hand = 0; hand < 10; hand++) {
      const config = prepareLocalGame({ ...DEFAULT_CONFIG, opponentCount: count, opponents: [], opponentModels: [], startingStackHuman: 1000, startingStackAI: 1000, blindBig: 10 });
      const players = initializeGame(config).players.map(p => ({ ...p, model: LOCAL_MODEL }));
      const total = players.reduce((sum, p) => sum + p.chips, 0);
      let state = startHand(createEngine(players, 10));
      let moves = 0;
      while (!state.handOver && moves++ < 200) {
        streets.add(state.phase);
        const actor = state.players.find(p => p.id === state.activePlayerId)!;
        assert.ok(actor, 'There must be an active player until the hand ends');
        const high = currentHighBet(state);
        const decision = await getAIDecision(actor, state.players, visibleBoard(state), potTotal(state), state.phase, high, 10, state.handHistory);
        if (decision.action === 'check') assert.equal(actor.currentBet, high);
        if (decision.action === 'raise') {
          assert.ok(Number.isFinite(decision.amount));
          assert.ok(decision.amount! > high && decision.amount! <= actor.currentBet + actor.chips);
        }
        state = applyAction(state, decision.action, decision.amount);
        assert.ok(state.players.every(p => p.chips >= 0 && Number.isFinite(p.chips)));
      }
      assert.ok(state.handOver, 'Practice hand must finish within 200 actions');
      assert.equal(state.players.reduce((sum, p) => sum + p.chips, 0), total, 'Chips must be conserved after settlement');
      if (state.result?.showdown) showdowns++;
    }
  }
  for (const street of [GamePhase.PRE_FLOP, GamePhase.FLOP, GamePhase.TURN, GamePhase.RIVER]) assert.ok(streets.has(street));
  assert.ok(showdowns > 0);
  assert.equal(networkCalls, 0);
  console.log(`Local practice: 30 offline hands across 2/6/10 seats completed; ${showdowns} showdowns. All streets, legal actions, chip conservation, short stacks and zero network calls verified.`);
} finally { Math.random = random; globalThis.fetch = originalFetch; }
