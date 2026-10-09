import { ModelBrandIcon } from "./ModelBrandIcon";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AI_MODELS } from "../constants";
import { AIModelOption, GamePhase, PlayerStats } from "../types";
import { useLanguage } from "../services/i18n";
import { Avatar } from "./Avatar";
import { NATURAL, SeatSettings, promptForModel, withPromptForModel } from "../services/seats";
import { DEFAULT_CHAT_PROMPT_TEMPLATE, modelKindFor } from "../services/aiProviders";
import { ACTION_INSTRUCTIONS } from "../services/pokerSituation";
import { isKnownField, referencesIn, PROMPT_FIELDS, fieldLabel } from "../services/promptFields";
import { PREVIEW_STREETS, PreviewStreet, sampleSituation, valueAt, formatValue } from "../services/promptPreview";
import { PromptVariables } from "./PromptVariables";
import { PromptEditor, PromptEditorHandle, VarState } from "./PromptEditor";
import { PromptPreview } from "./PromptPreview";
import { StylePad } from "./StylePad";
import { StatCards } from "./StatCards";
import { CUSTOM, StylePoint, personaFor, pointFor, pointOf, presetPoint, snapToPreset, styleKeyOf } from "../services/style";
import { entryKey } from "../services/seatStats";
import { MIN_HANDS_FOR_READS, summarise } from "../services/playerStats";

interface OpponentSheetProps {
  seat: SeatSettings;
  menu: AIModelOption[]; // the models this venue serves
  model: string; // the model the seat will actually sit down with here
  onChange: (seat: SeatSettings) => void;
  onClose: () => void;
  record?: Record<string, PlayerStats>; // how each seat has played at this player's tables, per style
}

const START_POINT: StylePoint = { x: 0.3, y: 0.7 }; // where the dot lands when you first give a seat a style
const PROMPT_LIMIT = 12000;

// Desktop settings sit beside one shared prompt workspace.
const WIDE = "(min-width: 1024px)";
const useWide = () => {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(WIDE).matches);
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
};

// One opponent's settings with a shared edit/preview workspace. Every change applies as
// it is made; Done only closes.
export const OpponentSheet: React.FC<OpponentSheetProps> = ({ seat, menu, model, onChange, onClose, record = {} }) => {
  const { t, lang } = useLanguage();

  // --- Style: a point on the map, a named corner of it, or none at all ---
  const natural = seat.strategy === NATURAL;
  const point = pointFor(seat.strategy, seat.style) ?? seat.style ?? START_POINT;
  const persona = personaFor(seat.strategy, seat.style);
  const styleName = natural
    ? t.personas[NATURAL]?.name
    : seat.strategy === CUSTOM
      ? t.seat.custom
      : t.personas[seat.strategy]?.name ?? seat.strategy;
  // Near a named style, the dot snaps onto it; anywhere else, it is a style of its own
  const dragTo = (p: StylePoint) => {
    const named = snapToPreset(p);
    onChange({ ...seat, strategy: named ?? CUSTOM, style: named ? presetPoint(named) ?? p : p });
  };
  const pickPreset = (id: string) => onChange({ ...seat, strategy: id, style: presetPoint(id) ?? undefined });
  const toggleNatural = () => {
    if (!natural) return onChange({ ...seat, strategy: NATURAL, style: point });
    const back = seat.style ?? START_POINT;
    const named = snapToPreset(back);
    onChange({ ...seat, strategy: named ?? CUSTOM, style: back });
  };
  // How this seat has actually played with this style, across sessions
  const played = summarise(record[entryKey(seat.id, styleKeyOf(seat.strategy, seat.style))]);
  const enough = played.hands >= MIN_HANDS_FOR_READS;
  const actualPoint = !natural && enough ? pointOf(played.vpip, played.pfr) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const currentModel = AI_MODELS.find((m) => m.id === model);
  // The box holds its own draft, so clearing it to start over doesn't snap the default back in.
  // What is saved: "" (the default) unless the text says something else.
  const defaultPrompt = modelKindFor(model) === "decisions" ? ACTION_INSTRUCTIONS : DEFAULT_CHAT_PROMPT_TEMPLATE;
  const promptLabel = modelKindFor(model) === "decisions" ? t.seat.decisionsInstructions : t.seat.prompt;
  const savedPrompt = promptForModel(seat, model);
  const [promptText, setPromptText] = useState(savedPrompt.trim() ? savedPrompt : defaultPrompt);
  const edited = savedPrompt.trim() !== "";
  useEffect(() => {
    const next = promptForModel(seat, model);
    setPromptText(next.trim() ? next : modelKindFor(model) === "decisions" ? ACTION_INSTRUCTIONS : DEFAULT_CHAT_PROMPT_TEMPLATE);
  }, [model]);
  const editPrompt = (text: string) => {
    setPromptText(text);
    const trimmed = text.trim();
    onChange(withPromptForModel(seat, model, trimmed === "" || trimmed === defaultPrompt ? "" : text));
  };

  // A field from the list goes in where the caret is, as a pill — or at the
  // end, until you have put the caret somewhere yourself
  const editor = useRef<PromptEditorHandle>(null);
  const refs = referencesIn(promptText);
  const insertField = (path: string) => editor.current?.insert(path);

  // The same sample hand for every street, played through the real builders
  const wide = useWide();
  const [street, setStreet] = useState<PreviewStreet>(GamePhase.FLOP);
  const [picked, setPicked] = useState<string | null>(null);
  const [promptMode, setPromptMode] = useState<"edit" | "preview">("edit");
  const spot = sampleSituation(seat.id, street).state as Record<string, unknown>;
  const valueOf = (name: string) => valueAt(spot, name);
  const stateOf = (name: string): VarState =>
    !isKnownField(name) ? "unknown" : valueAt(spot, name) === undefined ? "absent" : "known";

  // Availability and selection share one surface, scoped to this opponent.
  const modelSection = (
    <section>
      <h3 className="text-[14px] text-white/45 mb-2">{t.desk.venueMenu}</h3>
      <div className="flex flex-col gap-1" role="group" aria-label={t.seat.model}>
        {menu.map(m => (
          <button key={m.id} type="button" aria-pressed={model === m.id}
            onClick={() => onChange({ ...seat, model: m.id })}
            className={`flex items-center gap-3 w-full min-h-[52px] rounded-[14px] px-3 py-2 text-left transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 ${model === m.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
            <ModelBrandIcon model={m.id} size={20} />
            <span className="flex-1 min-w-0">
              <span className="block text-[14px]">{m.label}</span>
              <span className="block text-[12px] text-white/40">{m.sub}</span>
            </span>
            {model === m.id && <span aria-hidden="true" className="text-white/80">✓</span>}
          </button>
        ))}
      </div>
    </section>
  );

  // Style: leave it to the model, or drag the shape, tap a corner
  const styleSection = (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] text-white/45">{t.seat.strategy}</h3>
        <span className="text-[14px] text-white/80">{styleName}</span>
      </div>

      {/* The switch comes first: turning it on folds away everything below it, not the switch itself */}
      <button
        type="button"
        role="switch"
        aria-checked={natural}
        onClick={toggleNatural}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] bg-black/35 text-left cursor-pointer"
      >
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] text-white">{t.seat.naturalSwitch}</span>
          <span className="block text-[13px] text-white/40">{t.seat.naturalSwitchSub}</span>
        </span>
        <span className={`relative w-11 h-[26px] rounded-full shrink-0 transition-colors ${natural ? "bg-[#34c759]" : "bg-white/15"}`}>
          <span className={`absolute top-[3px] w-5 h-5 rounded-full bg-white shadow transition-transform ${natural ? "translate-x-[21px]" : "translate-x-[3px]"}`} />
        </span>
      </button>

      {/* Folds shut while the model decides (grid rows 0fr ↔ 1fr animate the height) */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${natural ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
        inert={natural}
        aria-hidden={natural}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-3">
            <StylePad
              target={point}
              actual={actualPoint}
              onChange={dragTo}
              onPreset={pickPreset}
              selectedPreset={seat.strategy === CUSTOM || natural ? null : seat.strategy}
            />
            {persona?.vpip !== undefined && (
              <p className="mt-3 text-[14px] leading-snug text-white tabular-nums">
                {t.seat.targets(Math.round(persona.vpip * 100), Math.round(persona.pfr! * 100))}
              </p>
            )}
            {played.hands === 0 && <p className="mt-1 text-[13px] leading-snug text-white/40">{t.seat.noRecord}</p>}
            {/* How this style has actually played, once it has played at all */}
            {played.hands > 0 && (
              <div className="mt-3">
                <StatCards stats={played} targets={persona} quiet={!enough} />
                {!enough && (
                  <p className="mt-2 text-[13px] leading-snug text-white/40 tabular-nums">
                    {t.seat.recordFew(played.hands, MIN_HANDS_FOR_READS)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  const variables = <PromptVariables used={refs.used} onInsert={insertField} valueOf={valueOf} />;

  const streetPicker = (
    <div className="flex rounded-full bg-black/35 p-1 mb-4">
      {PREVIEW_STREETS.map(s => <button key={s} type="button" aria-pressed={street === s}
        onClick={() => setStreet(s)} className={`flex-1 h-9 rounded-full text-[13px] cursor-pointer ${street === s ? "bg-white text-black" : "text-white/60"}`}>
        {t.desk.phases[s]}
      </button>)}
    </div>
  );
  const preview = (
    <div>
      {streetPicker}
      <PromptPreview name={seat.id} street={street} modelId={model} prompt={promptText} chartPreflop={!natural}>
        <PromptEditor value={promptText} onChange={editPrompt} limit={PROMPT_LIMIT}
          label={promptLabel} stateOf={stateOf} valueOf={valueOf} showValues
          selected={picked} onSelect={setPicked} edited={edited} />
      </PromptPreview>
    </div>
  );
  const field = PROMPT_FIELDS.find(f => f.path === picked || f.children?.includes(picked ?? ""));
  const inspection = picked && (
    <div className="mt-3 rounded-xl bg-white/5 p-4 text-[13px]">
      <div className="flex justify-between gap-3">
        <strong>{fieldLabel(picked, lang)}</strong>
        <button type="button" onClick={() => setPicked(null)} aria-label={t.seat.done}>×</button>
      </div>
      {field && <p className="mt-2 text-white/55">{field.desc[lang]}</p>}
      {streetPicker}
      <pre className="whitespace-pre-wrap break-words text-[#f5e35b]">{formatValue(valueOf(picked))}</pre>
    </div>
  );

  const promptSection = (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 min-h-7">
        <h3 className="text-[14px] text-white/45 flex items-center gap-2">
          {promptLabel}
          <span className={`h-5 px-2 rounded-full text-[12px] leading-5 ${edited ? "bg-[#f5e35b] text-black" : "bg-white/[0.08] text-white/55"}`}>
            {edited ? t.seat.editedTag : t.seat.defaultTag}
          </span>
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-full bg-black/35 p-1" role="group" aria-label={promptLabel}>
            {(["edit", "preview"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={promptMode === mode}
                onClick={() => setPromptMode(mode)}
                className={`h-8 px-4 rounded-full text-[14px] transition-colors cursor-pointer ${promptMode === mode ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
              >
                {mode === "edit" ? t.seat.editMode : t.seat.previewMode}
              </button>
            ))}
          </div>
          {edited && (
            <button
              type="button"
              onClick={() => editPrompt(defaultPrompt)}
              className="h-7 px-3 rounded-full bg-white/[0.08] text-[13px] text-white hover:bg-white/[0.14] transition-colors cursor-pointer"
            >
              {t.seat.restoreDefault}
            </button>
          )}
        </div>
      </div>
      <div hidden={promptMode !== "edit"}>
      {wide && <p className="-mt-1 mb-3 text-[13px] leading-snug text-white/40">{modelKindFor(model) === "chat" ? t.seat.promptNote : t.seat.typeBacktick}</p>}
      <PromptEditor
        ref={editor}
        label={promptLabel}
        value={promptText}
        onChange={editPrompt}
        limit={PROMPT_LIMIT}
        stateOf={stateOf}
        valueOf={valueOf}
        showValues={false}
        selected={picked}
        onSelect={setPicked}
        edited={edited}
        className={wide ? "min-h-[280px]" : "min-h-[220px]"}
      />
      <div className="mt-1.5 flex justify-between gap-3 text-[13px] text-white/35">
        <span>{t.seat.typeBacktick}</span>
        <span className="tabular-nums shrink-0">{promptText.length}/{PROMPT_LIMIT}</span>
      </div>
      {refs.unknown.length > 0 && (
        <p className="mt-2 text-[13px] leading-snug text-[#ff8a8a]">
          {t.seat.unknownVariables}{" "}
          {refs.unknown.map((name) => (
            <code key={name} className="font-mono mr-1.5">`{name}`</code>
          ))}
        </p>
      )}
      {inspection}
      <div className="mt-5">{variables}</div>
      </div>
      {promptMode === "preview" && (
        <div>
          <p className="mb-4 text-[13px] leading-snug text-white/45">{t.seat.previewNote}</p>
          {preview}
        </div>
      )}
    </section>
  );

  const subtitle = [currentModel?.label, natural ? "" : styleName].filter(Boolean).join(" · ");

  // Portalled to the body: the lobby animates with a transform, which would pin a fixed sheet to it
  if (wide)
    return createPortal(
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={seat.id}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fade-in_200ms_ease-out]" onClick={onClose} />

        <div className="absolute inset-5 xl:inset-8 mx-auto max-w-[1080px] flex flex-col rounded-[28px] bg-[#1c1c1e] border border-white/[0.06] shadow-2xl shadow-black/60 overflow-hidden animate-[panel-in_360ms_cubic-bezier(0.19,1,0.22,1)]">
          <header className="shrink-0 flex items-center gap-4 px-6 h-[76px] border-b border-white/[0.06]">
            <Avatar name={seat.id} alt="" draggable={false} className="w-11 h-11 object-contain" />
            <div className="min-w-0">
              <div className="text-[19px] text-white leading-tight truncate">{seat.id}</div>
              <div className="text-[13px] text-white/45 truncate">{subtitle}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto h-10 px-6 rounded-full bg-white text-black text-[15px] active:scale-[0.98] transition-transform cursor-pointer"
            >
              {t.seat.done}
            </button>
          </header>

          <div className="flex-1 min-h-0 grid grid-cols-[280px_minmax(0,1fr)]">
            {/* The player */}
            <aside className="min-h-0 overflow-y-auto no-scrollbar px-6 py-6 space-y-7 border-r border-white/[0.06]">
              {modelSection}
              {styleSection}
            </aside>

            {/* The prompt, and the fields it can point at */}
            <main className="min-h-0 overflow-y-auto no-scrollbar px-6 py-6 space-y-5">
              {promptSection}
            </main>

          </div>
        </div>
      </div>,
      document.body
    );

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={seat.id}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fade-in_200ms_ease-out]" onClick={onClose} />

      <div
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px] max-h-[88svh] flex flex-col rounded-t-[28px] bg-[#1c1c1e] animate-[sheet-up_320ms_cubic-bezier(0.19,1,0.22,1)]"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="shrink-0 flex justify-center pt-2.5 pb-1">
          <span className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Who */}
        <div className="shrink-0 flex items-center gap-4 px-5 pt-3 pb-5">
          <Avatar name={seat.id} alt="" className="w-16 h-16 object-contain" />
          <div className="min-w-0">
            <div className="text-[22px] text-white leading-tight truncate">{seat.id}</div>
            <div className="text-[15px] text-white/45 truncate">
              {subtitle}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 space-y-7 pb-2">
          {modelSection}
          {styleSection}
          {promptSection}
        </div>

        <div className="shrink-0 px-5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-[52px] rounded-full bg-white text-black text-[16px] active:scale-[0.98] transition-transform cursor-pointer"
          >
            {t.seat.done}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
