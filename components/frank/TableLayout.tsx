import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../../services/i18n';

// Keep one table and one instance of each information panel across all widths.
export function TableLayout({ children, roster, log }: {
  children: React.ReactNode;
  roster: React.ReactNode;
  log: React.ReactNode;
}) {
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState(() => window.innerWidth >= 1440 ? 'wide' : window.innerWidth >= 1024 ? 'desktop' : 'compact');
  const [panel, setPanel] = useState<'roster' | 'log'>('roster');
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const wide = window.matchMedia('(min-width: 1440px)');
    const update = () => setMode(wide.matches ? 'wide' : desktop.matches ? 'desktop' : 'compact');
    desktop.addEventListener('change', update);
    wide.addEventListener('change', update);
    return () => { desktop.removeEventListener('change', update); wide.removeEventListener('change', update); };
  }, []);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const transition = { duration: reduceMotion ? 0 : .25 };
  const visible = mode !== 'compact' || open;
  return (
    <div className="frank-workspace" data-layout={mode} data-panel={panel} data-open={open}>
      <button type="button" className="frank-info-toggle" aria-expanded={open} aria-controls="frank-information"
        onClick={() => setOpen(v => !v)} aria-label={lang === 'zh' ? '玩家与牌局记录' : 'Players and hand log'}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></svg>
      </button>
      {mode === 'compact' && open && <button type="button" className="frank-info-backdrop" onClick={() => setOpen(false)} aria-label={t.profile.done} />}
      <motion.div layout="position" transition={transition} className="frank-table-center">{children}</motion.div>
      <div id="frank-information" className="frank-information" inert={!visible} aria-hidden={!visible}>
        <div className="frank-panel-tabs" role="group" aria-label={lang === 'zh' ? '牌桌信息' : 'Table information'}>
          <button type="button" aria-pressed={panel === 'roster'} onClick={() => setPanel('roster')}>{t.desk.seats}</button>
          <button type="button" aria-pressed={panel === 'log'} onClick={() => setPanel('log')}>{t.desk.handLog}</button>
          {mode === 'compact' && <button type="button" className="frank-panel-close" onClick={() => setOpen(false)}>{t.profile.done}</button>}
        </div>
        <motion.div layout="position" transition={transition} className="frank-roster-panel" aria-label={t.desk.seats}>
          <div className="frank-panel-content">{roster}</div>
        </motion.div>
        <motion.div layout="position" transition={transition} className="frank-log-panel" aria-label={t.desk.handLog}>
          <div className="frank-panel-content">{log}</div>
        </motion.div>
      </div>
    </div>
  );
}
