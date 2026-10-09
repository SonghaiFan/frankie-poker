import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../services/i18n';
import { PLAYER_AVATARS, useGameSettings } from '../services/gameSettings';

export function GameSettings({ onClose }: { onClose: () => void }) {
  const { lang } = useLanguage();
  const zh = lang === 'zh';
  const { settings, update } = useGameSettings();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const colors = ['#35654d', '#344e70', '#594568', '#75533b', '#292929'];
  const names = zh ? ['森林', '深海', '暮紫', '暖棕', '炭黑'] : ['Forest', 'Ocean', 'Plum', 'Walnut', 'Charcoal'];
  return <dialog ref={dialog} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    aria-labelledby="game-settings-title" className="m-auto w-[calc(100%-2rem)] max-w-[440px] max-h-[90svh] overflow-y-auto rounded-[28px] bg-[#1c1c1e] text-white p-6 backdrop:bg-black/50 backdrop:backdrop-blur-sm">
    <div className="flex items-center justify-between mb-6">
      <h2 id="game-settings-title" className="text-xl">{zh ? '游戏设置' : 'Game settings'}</h2>
      <button onClick={onClose} className="rounded-full bg-white text-black px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60">{zh ? '完成' : 'Done'}</button>
    </div>
    <h3 className="text-sm text-white/55 mb-3">{zh ? '你的头像' : 'Your avatar'}</h3>
    <div className="grid grid-cols-4 gap-2 mb-7">
      {PLAYER_AVATARS.map((src, i) => <button key={src} aria-label={`${zh ? '头像' : 'Avatar'} ${i + 1}`} aria-pressed={settings.avatar === i}
        onClick={() => update({ avatar: i })}
        className={`relative rounded-2xl p-1 aspect-square transition-colors cursor-pointer hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 ${settings.avatar === i ? 'bg-white/5' : ''}`}>
        <img src={src} alt="" className="w-full h-full object-contain" />
        {settings.avatar === i && <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute bottom-1 right-1 text-white/80"><path d="m5 12 4 4L19 6" /></svg>}
      </button>)}
    </div>
    <h3 className="text-sm text-white/55 mb-3">{zh ? '背景颜色' : 'Background color'}</h3>
    <div className="flex justify-between gap-2">
      {colors.map((color, i) => <button key={color} onClick={() => update({ color })} aria-label={names[i]} aria-pressed={settings.color === color} className="flex flex-col items-center gap-2 text-xs text-white/65">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{ background: color }}>{settings.color === color ? '✓' : ''}</span>{names[i]}
      </button>)}
    </div>
    <label className="flex items-center justify-between mt-5 text-sm text-white/70">{zh ? '自选颜色' : 'Custom color'}
      <input type="color" value={settings.color} onChange={e => update({ color: e.target.value })} className="w-12 h-9 cursor-pointer bg-transparent" />
    </label>
    <p className="mt-5 text-xs text-white/40">{zh ? '即时生效，自动保存在此设备。' : 'Applied instantly and saved on this device.'}</p>
  </dialog>;
}
