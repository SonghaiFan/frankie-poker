import React, { useState, useSyncExternalStore } from 'react';
import { clearAIConnection, getAIConnection, saveAIConnection, subscribeAIConnection } from '../services/aiConnection';
import { useLanguage } from '../services/i18n';
import { ProviderSelect } from './ProviderSelect';

const copy = {
  en: {
    title: 'AI connection', provider: 'Provider', compatible: 'OpenAI-compatible', key: 'API key',
    savedKey: 'Key saved · enter a new key to replace it', base: 'API base URL', model: 'Model ID',
    help: 'Saved in this browser until you clear it. Requests go directly to your provider and use your balance. Use a key with a spending limit on a trusted device.',
    customHelp: 'All opponents use this chat model. The endpoint must support browser access (CORS) and JSON schema responses. JEV is available through OpenRouter only.',
    save: 'Save connection', clear: 'Clear key', saved: 'Connection saved. No API call made.', cleared: 'Key cleared from this browser.',
    missingKey: 'Enter an API key for this provider.', missingModel: 'Enter a chat model ID. JEV requires OpenRouter.',
    invalidEndpoint: 'Enter an HTTPS API base URL without credentials, query parameters, or a fragment.',
    storageUnavailable: 'Browser storage is unavailable. Allow site storage and try again.',
    getKey: 'Get an OpenRouter key', required: 'Add your API key before sitting down.',
  },
  zh: {
    title: 'AI 连接', provider: '服务商', compatible: '兼容 OpenAI 的服务', key: 'API 密钥',
    savedKey: '已保存密钥 · 输入新密钥以替换', base: 'API 基础地址', model: '模型 ID',
    help: '保存在此浏览器中，直到你主动清除。请求直接发送给服务商，使用你的余额。请在可信设备上使用设有消费限额的密钥。',
    customHelp: '所有对手使用此聊天模型。接口必须支持浏览器访问（CORS）和 JSON Schema 响应。JEV 仅通过 OpenRouter 使用。',
    save: '保存连接', clear: '清除密钥', saved: '连接已保存，未调用 API。', cleared: '已从此浏览器清除密钥。',
    missingKey: '请输入此服务商的 API 密钥。', missingModel: '请输入聊天模型 ID。JEV 需要 OpenRouter。',
    invalidEndpoint: '请输入 HTTPS API 基础地址，不含凭据、查询参数或片段。',
    storageUnavailable: '浏览器存储不可用，请允许此网站使用存储后重试。',
    getKey: '获取 OpenRouter 密钥', required: '入座前请先添加 API 密钥。',
  },
};

export function AIConnectionSettings({ required = false }: { required?: boolean }) {
  const { lang } = useLanguage();
  const t = copy[lang];
  const current = useSyncExternalStore(subscribeAIConnection, getAIConnection);
  const [provider, setProvider] = useState(current.provider);
  const [baseUrl, setBaseUrl] = useState(current.provider === 'compatible' ? current.baseUrl : '');
  const [model, setModel] = useState(current.model);
  const [key, setKey] = useState('');
  const [notice, setNotice] = useState<keyof typeof copy.en | ''>('');
  const sameDestination = provider === current.provider &&
    (provider === 'openrouter' || baseUrl.trim().replace(/\/+$/, '') === current.baseUrl);
  const hasSavedKey = sameDestination && !!current.apiKey;
  const inputClass = 'w-full rounded-xl border border-white/20 bg-white/5 px-3 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-white/60';
  return (
    <section aria-labelledby="ai-connection-title" className="space-y-3">
      <h3 id="ai-connection-title" className="text-[16px]">{t.title}</h3>
      {required && !current.apiKey && <p role="status" className="text-sm text-yellow-200">{t.required}</p>}
      <form className="space-y-3" onSubmit={event => {
        event.preventDefault();
        try {
          saveAIConnection({ provider, baseUrl, model, apiKey: key || (sameDestination ? current.apiKey : '') });
          setKey(''); setNotice('saved');
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          setNotice(message === 'missingKey' || message === 'missingModel' || message === 'storageUnavailable' ? message : 'invalidEndpoint');
        }
      }}>
        <ProviderSelect value={provider} onChange={next => {
          setProvider(next); setKey(''); setNotice('');
        }} />
        {provider === 'compatible' && <>
          <label className="block space-y-1 text-sm text-white/65"><span>{t.base}</span>
            <input type="url" required value={baseUrl} onChange={e => { setBaseUrl(e.target.value); setKey(''); }} placeholder="https://your-provider.example/v1" className={inputClass} autoComplete="off" spellCheck={false} />
          </label>
          <label className="block space-y-1 text-sm text-white/65"><span>{t.model}</span>
            <input required value={model} onChange={e => setModel(e.target.value)} className={inputClass} autoComplete="off" spellCheck={false} />
          </label>
          <p className="text-sm text-white/55">{t.customHelp}</p>
        </>}
        <label className="block space-y-1 text-sm text-white/65"><span>{t.key}</span>
          <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder={hasSavedKey ? t.savedKey : t.key} className={inputClass} autoComplete="off" spellCheck={false} autoCapitalize="none" />
        </label>
        <p className="text-sm text-white/55">{t.help}</p>
        {provider === 'openrouter' && <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer" className="inline-block text-sm underline underline-offset-4">{t.getKey}</a>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-full bg-white px-4 py-2.5 text-sm text-black cursor-pointer">{t.save}</button>
          {current.apiKey && <button type="button" className="rounded-full border border-white/30 px-4 py-2.5 text-sm cursor-pointer" onClick={() => {
            try { clearAIConnection(); setKey(''); setProvider('openrouter'); setBaseUrl(''); setModel(''); setNotice('cleared'); }
            catch { setNotice('storageUnavailable'); }
          }}>{t.clear}</button>}
        </div>
        {notice && <p role="status" className="text-sm text-white/75">{t[notice]}</p>}
      </form>
    </section>
  );
}
