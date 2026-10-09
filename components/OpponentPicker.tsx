import React from "react";
import { AI_MODELS } from "../constants";
import { SeatSettings, NATURAL } from "../services/seats";
import { CUSTOM } from "../services/style";
import { useLanguage } from "../services/i18n";
import { Avatar } from "./Avatar";

interface Props {
  roster: SeatSettings[];
  selected: SeatSettings[];
  availableModels: string[];
  onToggle: (seat: SeatSettings) => void;
  onEdit: (id: string) => void;
}

export const OpponentPicker: React.FC<Props> = ({ roster, selected, availableModels, onToggle, onEdit }) => {
  const { t } = useLanguage();
  const full = selected.length >= 9;
  return (
    <section className="px-5 pt-8 pb-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[20px] text-white">{t.setup.chooseOpponents}</h2>
        <span className="text-[14px] text-white/65 shrink-0 tabular-nums">{t.setup.playersCount(selected.length + 1)}</span>
      </div>
      <p className="mt-2 mb-4 text-[13px] leading-relaxed text-white/55">{t.setup.chooseOpponentsHint}</p>
      {full && <p className="mb-3 text-[13px] text-white/65">{t.setup.tableFull}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
        {roster.map((seat) => {
          const model = AI_MODELS.find((m) => m.id === seat.model);
          const seated = selected.some((s) => s.id === seat.id);
          const available = availableModels.includes(seat.model);
          const disabled = !seated && (!available || full);
          const style = seat.strategy === NATURAL
            ? t.personas[NATURAL]?.name
            : seat.strategy === CUSTOM ? t.seat.custom : t.personas[seat.strategy]?.name ?? seat.strategy;
          return (
            <article key={seat.id} className={`rounded-[24px] border overflow-hidden ${seated ? "border-white/75 bg-white/[0.10]" : "border-white/10 bg-black/15"}`}>
              <button
                type="button"
                aria-pressed={seated}
                aria-label={`${seat.id} · ${model?.label ?? seat.model}${!available ? ` · ${t.seat.offMenu}` : ""}`}
                disabled={disabled}
                onClick={() => onToggle(seat)}
                onContextMenu={(e) => { e.preventDefault(); onEdit(seat.id); }}
                className={`relative w-full flex flex-col items-center gap-1.5 px-3 pt-4 pb-3 text-center transition-opacity ${disabled ? "opacity-45 cursor-default" : "cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.08]"}`}
              >
                {seated && <span className="absolute top-2 right-2 text-[11px] text-white" aria-label={t.setup.selectedOpponent}>✓</span>}
                <Avatar name={seat.id} className="w-14 h-14 object-contain" />
                <span className="text-[16px] text-white">{seat.id}</span>
                <span className="flex items-center gap-1.5 text-[12px] text-white/80"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: model?.color ?? "#fff" }} />{model?.label ?? seat.model}</span>
                <span className="text-[12px] text-white/55">{style}</span>
                {!available && <span className="text-[11px] text-amber-200/90">{t.seat.offMenu}</span>}
              </button>
              <button type="button" onClick={() => onEdit(seat.id)} aria-label={`${t.seat.editMode} ${seat.id}`} className="w-full min-h-9 border-t border-white/10 text-[12px] text-white/65 hover:bg-white/10 cursor-pointer">{t.seat.editMode}{seat.prompt.trim() ? " · ✎" : ""}</button>
            </article>
          );
        })}
      </div>
    </section>
  );
};
