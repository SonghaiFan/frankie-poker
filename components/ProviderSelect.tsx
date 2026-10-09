import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe2, Plug } from 'lucide-react';
import { AIConnection } from '../services/aiConnection';
import { useLanguage } from '../services/i18n';

export function ProviderSelect({ value, onChange }: {
  value: AIConnection['provider'];
  onChange: (value: AIConnection['provider']) => void;
}) {
  const { lang } = useLanguage();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const options = [
    { value: 'openrouter' as const, label: 'OpenRouter', icon: Globe2,
      description: lang === 'zh' ? '一个密钥，使用 JEV 和多种聊天模型' : 'One key for JEV and multiple chat models' },
    { value: 'compatible' as const, label: lang === 'zh' ? '兼容 OpenAI 的服务' : 'OpenAI-compatible', icon: Plug,
      description: lang === 'zh' ? '连接自己的接口与聊天模型' : 'Connect your own endpoint and chat model' },
  ];
  const selectedIndex = options.findIndex(option => option.value === value);
  const selected = options[selectedIndex];
  const Icon = selected.icon;
  const show = () => { setActive(selectedIndex); setOpen(true); };
  const choose = (index: number) => {
    if (options[index].value !== value) onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus();
  };

  useEffect(() => {
    if (open) optionsRef.current[active]?.focus({ preventScroll: true });
  }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  return <div ref={root} className="relative" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }} onKeyDown={event => {
    if (open && event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus();
    }
  }}>
    <span id={`${id}-label`} className="mb-1.5 block text-sm text-white/65">{lang === 'zh' ? '服务商' : 'Provider'}</span>
    <button ref={trigger} type="button" aria-haspopup="listbox" aria-expanded={open}
      aria-controls={open ? `${id}-list` : undefined} aria-labelledby={`${id}-label ${id}-value`}
      onClick={() => open ? setOpen(false) : show()}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); }
      }}
      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${open ? 'border-white/40 bg-white/10' : 'border-white/20 bg-white/5 hover:bg-white/[0.08] hover:border-white/30'}`}>
      <Icon aria-hidden="true" size={19} className="shrink-0 text-white/60" />
      <span id={`${id}-value`} className="min-w-0 flex-1 text-base text-white">{selected.label}</span>
      <ChevronDown aria-hidden="true" size={17} className={`shrink-0 text-white/45 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`}
      className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-white/15 bg-[#29292c] p-1.5 shadow-xl shadow-black/40"
      onKeyDown={event => {
        let next = active;
        if (event.key === 'ArrowDown') next = (active + 1) % options.length;
        else if (event.key === 'ArrowUp') next = (active + options.length - 1) % options.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = options.length - 1;
        else return;
        event.preventDefault(); setActive(next);
      }}>
      {options.map((option, index) => <button key={option.value} type="button" role="option"
        ref={element => { optionsRef.current[index] = element; }}
        aria-selected={value === option.value} tabIndex={active === index ? 0 : -1}
        onClick={() => choose(index)} onFocus={() => setActive(index)}
        className="flex min-h-[76px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left cursor-pointer hover:bg-white/[0.07] focus:bg-white/10 focus:outline-none">
        <option.icon aria-hidden="true" size={19} className="shrink-0 text-white/60" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] text-white">{option.label}</span>
          <span className="mt-1 block text-[13px] leading-[1.4] text-white/50">{option.description}</span>
        </span>
        <span className="w-4 shrink-0">{value === option.value && <Check aria-hidden="true" size={16} className="text-white" />}</span>
      </button>)}
    </div>}
  </div>;
}
