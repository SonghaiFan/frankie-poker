import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../services/i18n';
import { PLAYER_AVATARS, useGameSettings } from '../services/gameSettings';
import { Avatar } from './Avatar';
import { AIConnectionSettings } from './AIConnectionSettings';

const FELTS = ['#35654d', '#344e70', '#594568', '#75533b', '#292929'];

const Check = ({ className = '' }: { className?: string }) => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m5 12 4 4L19 6" />
  </svg>
);

// How you look at the table: avatar and felt. Built like the opponent sheet —
// rises from the bottom on a phone, settles in the middle on a larger screen —
// and every change shows straight away on the felt behind it.
export function GameSettings({ onClose, name, requireConnection = false }: { onClose: () => void; name?: string; requireConnection?: boolean }) {
  const { t, lang } = useLanguage();
  const { settings, update } = useGameSettings();
  const done = useRef<HTMLButtonElement>(null);
  const custom = !FELTS.includes(settings.color.toLowerCase());

  useEffect(() => {
    done.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ring = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70';

  // Portalled to the body: the lobby animates with a transform, which would pin a fixed sheet to it
  return createPortal(
    <div data-ui-style={settings.uiStyle} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="game-settings-title">
      {/* Light enough that the felt colour you pick still shows through */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fade-in_200ms_ease-out]" onClick={onClose} />

      <div
        className="relative w-full max-w-[480px] max-h-[88svh] flex flex-col bg-[#1c1c1e] text-white rounded-t-[28px] sm:rounded-[28px] sm:border sm:border-white/[0.06] sm:shadow-2xl sm:shadow-black/60 animate-[sheet-up_320ms_cubic-bezier(0.19,1,0.22,1)] sm:animate-[panel-in_360ms_cubic-bezier(0.19,1,0.22,1)]"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <div className="shrink-0 flex justify-center pt-2.5 pb-1 sm:hidden">
          <span className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Who: the avatar as it will appear at the table */}
        <div className="shrink-0 flex items-center gap-4 px-5 pt-3 pb-5 sm:pt-6">
          <Avatar isHuman alt="" className="w-16 h-16 object-contain" />
          <div className="min-w-0 flex-1">
            <h2 id="game-settings-title" className="text-[22px] leading-tight truncate">{name || t.profile.you}</h2>
            <div className="text-[15px] text-white/45 truncate">{t.profile.subtitle}</div>
          </div>
          <button
            ref={done}
            type="button"
            onClick={onClose}
            className={`hidden sm:block h-10 px-6 rounded-full bg-white text-black text-[15px] active:scale-[0.98] transition-transform cursor-pointer ${ring}`}
          >
            {t.profile.done}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 space-y-7 pb-2">
          <section>
            <h3 className="text-[14px] text-white/45 mb-2">{t.profile.uiStyle}</h3>
            <div className="grid grid-cols-2 gap-3" role="group" aria-label={t.profile.uiStyle}>
              {(['offsuit', 'frank'] as const).map(style => (
                <button key={style} type="button" aria-pressed={settings.uiStyle === style}
                  onClick={() => update({ uiStyle: style })}
                  className={`relative p-4 rounded-2xl text-left cursor-pointer ${ring} ${settings.uiStyle === style ? 'bg-white/10 ring-2 ring-white' : 'bg-white/[0.03] hover:bg-white/[0.07]'}`}>
                  {settings.uiStyle === style && <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center"><Check /></span>}
                  <span aria-hidden="true" className={`block mb-3 text-2xl ${style === 'frank' ? 'font-mono text-[#d4af37]' : 'text-white'}`}>♠ ♥ ♣ ♦</span>
                  <span className="block text-[17px]">{style === 'offsuit' ? 'Offsuit' : 'Frank'}</span>
                  <span className="block mt-1 text-[12px] text-white/55">{style === 'offsuit' ? t.profile.offsuitDescription : t.profile.frankDescription}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-white/55">
              {lang === 'zh' ? '选择自动保存；牌桌风格在进入游戏后显示。' : 'Saved automatically. Table style appears when you enter a game.'}
            </p>
          </section>
          <AIConnectionSettings required={requireConnection} />
          <section>
            <h3 className="text-[14px] text-white/45 mb-2">{t.profile.avatar}</h3>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label={t.profile.avatar}>
              {PLAYER_AVATARS.map((src, i) => {
                const on = settings.avatar === i;
                return (
                  <button
                    key={src}
                    type="button"
                    aria-label={`${t.profile.avatar} ${i + 1}`}
                    aria-pressed={on}
                    onClick={() => update({ avatar: i })}
                    className={`relative aspect-square rounded-[18px] p-2 transition-colors cursor-pointer ${ring} ${on ? 'bg-white/10 ring-2 ring-white' : 'bg-white/[0.03] hover:bg-white/[0.07]'}`}
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-contain" />
                    {on && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-[14px] text-white/45 mb-3">{t.profile.felt}</h3>
            <div className="grid grid-cols-6 gap-1" role="group" aria-label={t.profile.felt}>
              {FELTS.map((color, i) => {
                const on = settings.color.toLowerCase() === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => update({ color })}
                    aria-pressed={on}
                    className={`flex flex-col items-center gap-2 rounded-[14px] py-1 text-[12px] cursor-pointer ${ring} ${on ? 'text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-shadow ${on ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e]' : 'ring-1 ring-white/10'}`}
                      style={{ background: color }}
                    >
                      {on && <Check className="text-white" />}
                    </span>
                    {t.profile.feltNames[i]}
                  </button>
                );
              })}
              {/* Any other colour: the swatch becomes the colour you picked */}
              <label className={`relative flex flex-col items-center gap-2 rounded-[14px] py-1 text-[12px] cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white/70 ${custom ? 'text-white' : 'text-white/50 hover:text-white'}`}>
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${custom ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e]' : 'ring-1 ring-white/10'}`}
                  style={{ background: custom ? settings.color : 'conic-gradient(from 180deg, #f87171, #facc15, #4ade80, #38bdf8, #a78bfa, #f87171)' }}
                >
                  {custom ? <Check className="text-white" /> : <span aria-hidden className="text-[18px] leading-none text-black/70">+</span>}
                </span>
                {t.profile.custom}
                <input
                  type="color"
                  value={settings.color}
                  onChange={e => update({ color: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </section>

          <p className="text-[13px] text-white/35">{t.profile.saved}</p>
        </div>

        <div className="shrink-0 px-5 pt-3 sm:hidden">
          <button
            type="button"
            onClick={onClose}
            className={`w-full h-[52px] rounded-full bg-white text-black text-[16px] active:scale-[0.98] transition-transform cursor-pointer ${ring}`}
          >
            {t.profile.done}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
