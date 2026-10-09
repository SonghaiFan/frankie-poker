export type AIConnection = {
  provider: 'openrouter' | 'compatible';
  apiKey: string;
  baseUrl: string;
  model: string;
};

const STORAGE_KEY = 'franks-holdem:ai-connection';
const defaults: AIConnection = {
  provider: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseUrl: 'https://openrouter.ai/api/v1',
  model: '',
};
function loadConnection(): AIConnection {
  if (typeof localStorage === 'undefined') return defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && (saved.provider === 'openrouter' || saved.provider === 'compatible') &&
      typeof saved.apiKey === 'string' && typeof saved.baseUrl === 'string' && typeof saved.model === 'string') {
      const url = new URL(saved.baseUrl);
      if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash) {
        return saved.provider === 'openrouter' ? { ...saved, baseUrl: defaults.baseUrl } : saved;
      }
    }
  } catch { /* Unavailable storage or old data: start with local defaults. */ }
  return defaults;
}
let connection = loadConnection();
const listeners = new Set<() => void>();
export const getAIConnection = () => connection;
export const subscribeAIConnection = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export function saveAIConnection(next: AIConnection) {
  const baseUrl = next.provider === 'openrouter'
    ? 'https://openrouter.ai/api/v1'
    : next.baseUrl.trim().replace(/\/+$/, '');
  const url = new URL(baseUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('invalidEndpoint');
  }
  if (!next.apiKey.trim()) throw new Error('missingKey');
  if (next.provider === 'compatible' && (!next.model.trim() || next.model.startsWith('~typesafe/'))) {
    throw new Error('missingModel');
  }
  const saved = { ...next, apiKey: next.apiKey.trim(), baseUrl, model: next.model.trim() };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }
  catch { throw new Error('storageUnavailable'); }
  connection = saved;
  listeners.forEach(listener => listener());
}

export function clearAIConnection() {
  try { localStorage.removeItem(STORAGE_KEY); }
  catch { throw new Error('storageUnavailable'); }
  connection = { provider: 'openrouter', apiKey: '', baseUrl: 'https://openrouter.ai/api/v1', model: '' };
  listeners.forEach(listener => listener());
}
