import React, { createContext, useContext, useState } from 'react';
import { AVATAR_IMAGES, HERO_AVATAR } from './avatars';

export const PLAYER_AVATARS = [HERO_AVATAR, ...AVATAR_IMAGES];
const KEY = 'frankie-game-settings-v1';
export type UIStyle = 'offsuit' | 'frank';
const defaults = { avatar: 0, color: '#35654d', uiStyle: 'offsuit' as UIStyle };
type Settings = typeof defaults;
const Context = createContext({ settings: defaults, update: (_: Partial<Settings>) => {} });
export const useGameSettings = () => useContext(Context);
export function GameSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        uiStyle: value.uiStyle === 'frank' ? 'frank' : 'offsuit',
        avatar: Number.isInteger(value.avatar) && value.avatar >= 0 && value.avatar < PLAYER_AVATARS.length ? value.avatar : 0,
        color: /^#[0-9a-f]{6}$/i.test(value.color) ? value.color : defaults.color,
      };
    } catch { return defaults; }
  });
  const update = (patch: Partial<Settings>) => setSettings(previous => {
    const next = { ...previous, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Session settings still work without storage. */ }
    return next;
  });
  return <Context.Provider value={{ settings, update }}>{children}</Context.Provider>;
}
export function feltStyle(color: string): React.CSSProperties {
  const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
  const edge = rgb.map(n => Math.round(n * 0.36));
  return {
    '--felt-base': `rgb(${edge.join(',')})`,
    '--felt-gradient': `radial-gradient(circle at center, ${color} 0%, rgb(${edge.join(',')}) 100%)`,
    '--felt-surface-rgb': rgb.map(n => Math.round(n * 0.59)).join(','),
    '--felt-separator-rgb': rgb.map(n => Math.round(n * 0.9)).join(','),
  } as React.CSSProperties;
}
