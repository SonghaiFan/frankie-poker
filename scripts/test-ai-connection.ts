import assert from 'node:assert/strict';
import { GamePhase } from '../types';

// Isolated storage and dummy credentials only; no paid or network requests.
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}, configurable: true });
process.env.OPENROUTER_API_KEY = '';
const { getAIConnection, saveAIConnection, clearAIConnection } = await import('../services/aiConnection');
const { runModel } = await import('../services/aiProviders');
const { sampleSituation, costPerDecision } = await import('../services/promptPreview');
const { AI_MODELS } = await import('../constants');

const custom = { provider: 'compatible' as const, apiKey: 'dummy-test-only', baseUrl: 'https://provider.example/v1/', model: 'custom-chat' };
for (const baseUrl of ['http://provider.example/v1', 'https://user:pass@provider.example/v1', 'https://provider.example/v1?key=dummy', 'https://provider.example/v1#fragment']) {
  assert.throws(() => saveAIConnection({ ...custom, baseUrl }));
}
assert.throws(() => saveAIConnection({ ...custom, apiKey: '' }));
assert.throws(() => saveAIConnection({ ...custom, model: '' }));
assert.throws(() => saveAIConnection({ ...custom, model: '~typesafe/jev-latest' }));
saveAIConnection(custom);
assert.equal(getAIConnection().baseUrl, 'https://provider.example/v1');
assert.equal(storage.size, 1);
assert.equal(JSON.parse([...storage.values()][0]).apiKey, custom.apiKey);
assert.equal(costPerDecision(custom.model, 100), null);

const situation = sampleSituation('Test', GamePhase.FLOP);
let calls = 0;
globalThis.fetch = async (input, init) => {
  calls++;
  const url = String(input);
  const body = JSON.parse(String(init?.body));
  const headers = init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer dummy-test-only');
  if (url.includes('provider.example')) {
    assert.equal(url, 'https://provider.example/v1/chat/completions');
    assert.equal(body.model, 'custom-chat');
    assert.equal(body.response_format.json_schema.strict, true);
    assert.equal(headers['X-Title'], undefined);
    assert.equal(body.reasoning, undefined);
  }
  if (url.endsWith('/decisions')) {
    return Response.json({ answers: { hand_strength: { score: 2 }, action: { choice: situation.safeDefault } } });
  }
  return Response.json({ choices: [{ message: { content: JSON.stringify({
    hand_strength: 2, action_probabilities: { [situation.safeDefault]: 1 }, reasoning: 'Test response.',
  }) } }] });
};
const trace = await runModel(situation, custom.model, custom.apiKey, undefined, getAIConnection().baseUrl);
assert.equal(trace.model, custom.model);
assert.equal(trace.judgement.handStrength, 2);
assert.equal(calls, 1);
const jev = AI_MODELS.find(model => model.kind === 'decisions')!.id;
await assert.rejects(runModel(situation, jev, custom.apiKey, undefined, custom.baseUrl));
assert.equal(calls, 1, 'JEV must not send a credential to a custom endpoint');
await runModel(situation, jev, custom.apiKey);
assert.equal(calls, 2);
globalThis.fetch = async () => new Response('sensitive provider response', { status: 401 });
await assert.rejects(runModel(situation, custom.model, custom.apiKey), error =>
  error instanceof Error && error.message === 'AI provider returned HTTP 401');
clearAIConnection();
assert.equal(getAIConnection().apiKey, '');
assert.equal(storage.size, 0);
console.log('AI connection storage, clear, endpoint validation, provider routing, response contract and error redaction checks passed. No real API calls.');
