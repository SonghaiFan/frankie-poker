import React, { useEffect, useMemo, useRef, useState } from "react";
import { AI_MODELS, DEFAULT_CONFIG, modelCostPerM } from "../constants";
import { STARTING_WEALTH } from "../services/bankroll";
import { GameConfig } from "../types";
import { useLanguage } from "../services/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { OpponentSheet } from "./OpponentSheet";
import { OpponentPicker } from "./OpponentPicker";
import { OPPONENT_NAMES } from "../services/avatars";
import { Avatar } from "./Avatar";
import { NATURAL, SeatSettings, loadSeats, saveSeats } from "../services/seats";
import { personaFor, styleKeyOf } from "../services/style";
import { loadSeatStats } from "../services/seatStats";

interface LandingPageProps {
  onStartGame: (config: GameConfig) => void;
  username: string | null;
  wealth: number;
  onTopUp: () => void;
  isExiting?: boolean;
}

interface GameVenue {
  id: string;
  name: string;
  sub: string;
  buyIn: number;
  blindBig: number;
  desc: string;
  budgetPerM: number;
  emoji: string;
  bgClass: string;
}

const VENUES: GameVenue[] = [
  {
    id: "footscray",
    name: "Footscray Courts",
    sub: "Inner West",
    buyIn: 200,
    blindBig: 2,
    desc: "Entry-Level",
    budgetPerM: 0.05,
    emoji: "🏀",
    bgClass: "from-[#fef08a] to-[#fde047]", // butter yellow
  },
  {
    id: "boxhill",
    name: "Box Hill Centre",
    sub: "Eastern Hub",
    buyIn: 1000,
    blindBig: 10,
    desc: "Middle-Class",
    budgetPerM: 1,
    emoji: "🥟",
    bgClass: "from-[#bbf7d0] to-[#86efac]", // mint jade
  },
  {
    id: "glen",
    name: "Glen Waverley",
    sub: "School District",
    buyIn: 10000,
    blindBig: 100,
    desc: "Family-Stability",
    budgetPerM: 3,
    emoji: "🎓",
    bgClass: "from-[#bae6fd] to-[#93c5fd]", // sky blue
  },
  {
    id: "balwyn",
    name: "Balwyn Hill",
    sub: "Blue-Chip East",
    buyIn: 100000,
    blindBig: 1000,
    desc: "Old Money",
    budgetPerM: 4,
    emoji: "🏛️",
    bgClass: "from-[#e9d5ff] to-[#d8b4fe]", // lavender
  },
  {
    id: "toorak",
    name: "Toorak Estate",
    sub: "Elite South",
    buyIn: 500000,
    blindBig: 5000,
    desc: "Top of the Chain",
    budgetPerM: Infinity,
    emoji: "👑",
    bgClass: "from-[#fed7aa] to-[#fdba74]", // amber peach
  },
];

const MAX_OPPONENTS = 9;

const affordable = (venue: GameVenue, wealth: number) => venue.buyIn <= wealth;

// What a venue serves: every model within its per-token budget, cheapest first
const menuFor = (venue: GameVenue) =>
  AI_MODELS.filter((m) => modelCostPerM(m) <= venue.budgetPerM).sort(
    (a, b) => modelCostPerM(a) - modelCostPerM(b)
  );

const Lock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartGame,
  username,
  wealth,
  onTopUp,
  isExiting,
}) => {
  const { t } = useLanguage();
  const [venueIndex, setVenueIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const venue = VENUES[venueIndex];
  const menu = useMemo(() => menuFor(venue), [venue]);

  const [seats, setSeats] = useState<SeatSettings[]>(() => loadSeats(username) ??
    OPPONENT_NAMES.filter((_, i) => i % AI_MODELS.length === 0).map((id) => ({ id, model: AI_MODELS[0].id, strategy: NATURAL, prompt: "" })));
  const [roster, setRoster] = useState<SeatSettings[]>(() => {
    const saved = [...(loadSeats(username, "catalog") ?? []), ...seats];
    const defaults = OPPONENT_NAMES.map((id, i): SeatSettings => ({ id, model: AI_MODELS[i % AI_MODELS.length].id, strategy: NATURAL, prompt: "" }));
    const entries = new Map(defaults.map((s) => [s.id, s]));
    saved.forEach((s) => entries.set(s.id, s));
    return [...entries.values()];
  });
  useEffect(() => saveSeats(username, seats), [username, seats]);
  useEffect(() => saveSeats(username, roster, "catalog"), [username, roster]);
  const [editing, setEditing] = useState<string | null>(null);
  const [record] = useState(() => loadSeatStats(username));
  const editingSeat = roster.find((s) => s.id === editing);
  const updateSeat = (next: SeatSettings) => {
    setRoster((prev) => prev.map((s) => s.id === next.id ? next : s));
    setSeats((prev) => prev.map((s) => s.id === next.id ? next : s));
  };
  const toggleSeat = (seat: SeatSettings) => setSeats((prev) => {
    if (prev.some((s) => s.id === seat.id)) return prev.filter((s) => s.id !== seat.id);
    if (prev.length >= MAX_OPPONENTS || !menu.some((m) => m.id === seat.model)) return prev;
    return [...prev, seat];
  });
  const unavailableSeats = seats.some((s) => !menu.some((m) => m.id === s.model));
  const selectionIssue = seats.length === 0 ? t.setup.chooseAtLeastOne : unavailableSeats ? t.setup.unavailableOpponents : "";

  // --- Venue carousel: cards snap to the left edge; the one there is the one you pick ---
  const scrollToVenue = (i: number) => {
    const c = carouselRef.current;
    if (c && c.clientWidth === 0) {
      setVenueIndex(i);
      return;
    }
    const card = c?.children[i] as HTMLElement | undefined;
    if (!c || !card) return;
    c.scrollTo({ left: card.offsetLeft - 20, behavior: "smooth" });
  };

  const onCarouselScroll = () => {
    const c = carouselRef.current;
    if (!c || c.clientWidth === 0) return;
    let nearest = 0;
    let best = Infinity;
    Array.from(c.children).forEach((el, i) => {
      const d = Math.abs((el as HTMLElement).offsetLeft - 20 - c.scrollLeft);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    if (nearest !== venueIndex) setVenueIndex(nearest);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing || ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "")) return;
      if (e.key === "ArrowLeft" && venueIndex > 0) scrollToVenue(venueIndex - 1);
      if (e.key === "ArrowRight" && venueIndex < VENUES.length - 1) scrollToVenue(venueIndex + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [venueIndex, editing]);

  const venueName = (v: GameVenue) => t.venues[v.id]?.name ?? v.name;

  const config: GameConfig = {
    ...DEFAULT_CONFIG,
    playerName: username || DEFAULT_CONFIG.playerName,
    blindBig: venue.blindBig,
    startingStackHuman: venue.buyIn,
    startingStackAI: venue.buyIn,
    opponents: seats.map((s) => ({
      name: s.id,
      model: s.model,
      strategy: s.strategy,
      prompt: s.prompt,
      persona: personaFor(s.strategy, s.style),
      styleKey: styleKeyOf(s.strategy, s.style),
    })),
    opponentModels: seats.map((s) => s.model),
    opponentCount: seats.length,
  };

  const isBroke = wealth < VENUES[0].buyIn;
  const canSit = affordable(venue, wealth);

  return (
    <div
      className={`
        w-full h-full overflow-y-auto no-scrollbar bg-transparent
        transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]
        ${isExiting ? "-translate-y-6 opacity-0 blur-sm" : "opacity-100"}
      `}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="w-full max-w-[480px] sm:max-w-[720px] md:max-w-[880px] lg:max-w-[1080px] mx-auto min-h-full flex flex-col">
        {/* You, and the language */}
        <div className="h-14 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 h-9 pl-1 pr-3.5 rounded-full bg-[#1c1c1e] min-w-0">
            <Avatar isHuman alt="" className="w-7 h-7 object-contain" />
            <span className="text-[14px] text-white truncate">{username || t.setup.unknown}</span>
          </div>
          <LanguageToggle />
        </div>

        {/* One column on a phone; on a desktop, where you play on the left and who with on the right */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)] lg:gap-5 xl:gap-8 lg:items-start">
        <div className="lg:min-w-0">
        {/* Bankroll */}
        <div className="px-5 pt-6 pb-7 lg:pt-8 lg:pb-9">
          <div className="text-[60px] sm:text-[64px] xl:text-[72px] font-extralight leading-none tracking-tight text-white tabular-nums">
            {wealth.toLocaleString()}
          </div>
          <div className="mt-3 text-[15px] text-white/45">{t.setup.bankroll}</div>

          {wealth < STARTING_WEALTH && (
            <div className="mt-5 flex flex-col items-start gap-3">
              {isBroke && <p className="text-[15px] text-white/70">{t.setup.brokeTitle(wealth)}</p>}
              <button
                type="button"
                onClick={onTopUp}
                className="h-10 px-4 rounded-full bg-[#1c1c1e] text-[15px] text-white hover:bg-[#2a2a2d] active:scale-[0.97] transition-all cursor-pointer"
              >
                {t.setup.takeStakeAmount(STARTING_WEALTH)}
              </button>
            </div>
          )}
        </div>

        {/* Venues */}
        <div
          ref={carouselRef}
          onScroll={onCarouselScroll}
          className="relative flex sm:hidden gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-5 px-5 shrink-0"
        >
          {VENUES.map((v, i) => {
            const open = affordable(v, wealth);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => scrollToVenue(i)}
                aria-pressed={i === venueIndex}
                className={`
                  relative shrink-0 w-[84%] h-[220px] snap-start rounded-[32px] p-6 text-left
                  flex flex-col justify-between bg-gradient-to-br ${v.bgClass} text-black select-none cursor-pointer
                  transition-opacity duration-300 ${i === venueIndex ? "opacity-100" : "opacity-60"}
                `}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[52px] leading-none">{v.emoji}</span>
                  {!open && (
                    <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-black/60">
                      <Lock />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-[26px] leading-tight tracking-tight">{venueName(v)}</div>
                  <div className="mt-1 text-[15px] text-black/55">
                    {t.setup.venueLine(v.buyIn, v.blindBig / 2, v.blindBig)}
                  </div>
                </div>
              </button>
            );
          })}
          {/* lets the last card snap to the left edge */}
          <div className="shrink-0 w-[calc(16%-32px)]" aria-hidden />
        </div>

        {/* Tablet and desktop: venue grids expand from two to three columns. */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 px-5">
          {VENUES.map((v, i) => {
            const open = affordable(v, wealth);
            const on = i === venueIndex;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVenueIndex(i);
                  scrollToVenue(i);
                }}
                aria-pressed={on}
                className={`
                  relative min-w-0 h-[168px] rounded-[28px] p-4 xl:p-5 text-left flex flex-col justify-between
                  bg-gradient-to-br ${v.bgClass} text-black select-none cursor-pointer
                  transition-[opacity,transform,box-shadow] duration-300
                  ${on ? "opacity-100 ring-2 ring-white ring-offset-4 ring-offset-black" : "opacity-55 hover:opacity-80"}
                `}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[40px] leading-none">{v.emoji}</span>
                  {!open && (
                    <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-black/60">
                      <Lock />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[17px] xl:text-[19px] leading-tight tracking-tight truncate">{venueName(v)}</div>
                  <div className="mt-0.5 text-[13px] text-black/55 truncate">{t.venues[v.id]?.desc ?? v.desc}</div>
                  <div className="text-[13px] text-black/55 truncate">{t.setup.venueLine(v.buyIn, v.blindBig / 2, v.blindBig)}</div>
                </div>
              </button>
            );
          })}
        </div>

        </div>
        <div className="flex-1 min-w-0 flex flex-col lg:self-stretch">
          <OpponentPicker roster={roster} selected={seats} availableModels={menu.map((m) => m.id)} onToggle={toggleSeat} onEdit={setEditing} />

        {/* Sit down */}
        <div
          className="felt-footer isolate sticky bottom-0 z-10 mt-auto px-5 pt-8"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          {unavailableSeats && <p className="mb-3 text-[13px] text-amber-200">{t.setup.unavailableOpponents}</p>}
          {canSit && !selectionIssue ? (
            <button
              type="button"
              onClick={() => onStartGame(config)}
              className="w-full h-[52px] rounded-full bg-white text-black text-[16px] active:scale-[0.98] transition-transform cursor-pointer"
            >
              {t.setup.sitDown(venue.buyIn)}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full h-[52px] rounded-full border border-white/15 text-white/40 text-[16px] flex items-center justify-center gap-2 cursor-default"
            >
              <Lock />
              {!canSit ? t.setup.lockedCta(venue.buyIn, wealth) : seats.length === 0 ? t.setup.chooseAtLeastOne : t.seat.offMenu}
            </button>
          )}
        </div>
        </div>
        </div>
      </div>

      {editingSeat && (
        <OpponentSheet
          key={editingSeat.id}
          seat={editingSeat}
          menu={menu}
          model={editingSeat.model}
          onChange={updateSeat}
          onClose={() => setEditing(null)}
          record={record}
        />
      )}
    </div>
  );
};
