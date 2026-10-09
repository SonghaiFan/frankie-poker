import localVenueIcon from "../assets/venues/local-practice.png";
import venueIcon0 from "../assets/venues/footscray.png";
import venueIcon1 from "../assets/venues/box-hill.png";
import venueIcon2 from "../assets/venues/glen-waverley.png";
import venueIcon3 from "../assets/venues/balwyn.png";
import venueIcon4 from "../assets/venues/toorak.png";
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AI_MODELS, DEFAULT_CONFIG, modelCostPerM } from "../constants";
import { STARTING_WEALTH } from "../services/bankroll";
import { AIModelOption, GameConfig } from "../types";
import { getAIConnection, subscribeAIConnection } from '../services/aiConnection';
import { useLanguage } from "../services/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { OpponentSheet } from "./OpponentSheet";
import { SeatSnake } from "./SeatSnake";
import { ProfileAvatar } from "./ProfileAvatar";
import { Avatar } from "./Avatar";
import { NATURAL, SeatSettings, defaultSeat, defaultSeats, loadSeats, promptForModel, saveSeats } from "../services/seats";
import { CUSTOM, personaFor, styleKeyOf } from "../services/style";
import { loadSeatStats } from "../services/seatStats";
import { LOCAL_MODEL, PRACTICE_STACK } from '../services/localPractice';

interface LandingPageProps {
  onOpenSettings: () => void;
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
  icon: string;
  bgClass: string;
}

const VENUES: GameVenue[] = [
  {
    id: 'local', name: 'Local Practice', sub: 'On this device',
    buyIn: PRACTICE_STACK, blindBig: 10, desc: 'Rule-based · No API key',
    budgetPerM: 0, icon: localVenueIcon, bgClass: 'from-[#d5e9e5] to-[#91bfb5]',
  },
  {
    id: "footscray",
    name: "Footscray Social Room",
    sub: "Inner West",
    buyIn: 200,
    blindBig: 2,
    desc: "Entry-Level",
    budgetPerM: 0.05,
    icon: venueIcon0,
    bgClass: "from-[#fef08a] to-[#fde047]", // butter yellow
  },
  {
    id: "boxhill",
    name: "Box Hill Card Room",
    sub: "Eastern Hub",
    buyIn: 1000,
    blindBig: 10,
    desc: "Middle-Class",
    budgetPerM: 1,
    icon: venueIcon1,
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
    icon: venueIcon2,
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
    icon: venueIcon3,
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
    icon: venueIcon4,
    bgClass: "from-[#fed7aa] to-[#fdba74]", // amber peach
  },
];

const VenueArt = ({ venue, className }: { venue: GameVenue; className: string }) =>
  <img src={venue.icon} alt="" draggable={false} className={className} />;

const MIN_OPPONENTS = 1;
const MAX_OPPONENTS = 9;

const affordable = (venue: GameVenue, wealth: number) => venue.id === 'local' || venue.buyIn <= wealth;

// What a venue serves: every model within its per-token budget, cheapest first
const menuFor = (venue: GameVenue) =>
  AI_MODELS.filter((m) => modelCostPerM(m) <= venue.budgetPerM).sort(
    (a, b) => modelCostPerM(a) - modelCostPerM(b)
  );

const ChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
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
  onOpenSettings,
  wealth,
  onTopUp,
  isExiting,
}) => {
  const { t, lang } = useLanguage();
  const connection = useSyncExternalStore(subscribeAIConnection, getAIConnection);
  const [venueIndex, setVenueIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const venue = VENUES[venueIndex];
  const local = venue.id === 'local';
  const customModel = !local && connection.provider === 'compatible' ? connection.model : '';
  const menu: AIModelOption[] = useMemo(() => local
    ? [{ id: LOCAL_MODEL, label: lang === 'zh' ? '规则对手' : 'Rule-based bot', sub: '', kind: 'chat', pricePerM: { input: 0, output: 0 } }]
    : customModel
    ? [{ id: customModel, label: customModel, sub: 'Custom provider', kind: 'chat', pricePerM: null }]
    : menuFor(venue), [venue, customModel, local, lang]);

  // The opponents, remembered per player
  const [seats, setSeats] = useState<SeatSettings[]>(() => loadSeats(username) ?? defaultSeats(5));
  useEffect(() => saveSeats(username, seats), [username, seats]);

  // A seat keeps the model you chose for it; a venue that doesn't serve it seats them on one it does
  const modelAt = (seat: SeatSettings, i: number) =>
    menu.some((m) => m.id === seat.model) ? seat.model : menu[i % menu.length]?.id ?? AI_MODELS[0].id;

  // Desktop keeps the opponent list open; phones can fold it into an avatar stack.
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia?.("(min-width: 1024px)").matches ?? false);
  const [unfolded, setUnfolded] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const listOpen = isDesktop || unfolded;
  const [editing, setEditing] = useState<string | null>(null);
  // How each seat has played at this player's tables, per style (written by the game after every hand)
  const [record] = useState(() => loadSeatStats(username));
  const bind = (id: string): React.ButtonHTMLAttributes<HTMLButtonElement> => local ? { disabled: true } : ({
    onClick: () => setEditing(id),
    onContextMenu: (e) => {
      e.preventDefault();
      setEditing(id);
    },
  });
  const editingIndex = seats.findIndex((s) => s.id === editing);

  const updateSeat = (next: SeatSettings) =>
    setSeats((prev) => prev.map((s) => (s.id === next.id ? { ...next, model: customModel ? s.model : next.model } : s)));

  // A new opponent takes the top of the list and pushes the rest down; − takes the top one away again
  const addSeat = () =>
    setSeats((prev) => (prev.length >= MAX_OPPONENTS ? prev : [defaultSeat(prev.length, prev.map((s) => s.id)), ...prev]));
  const removeSeat = () => setSeats((prev) => (prev.length <= MIN_OPPONENTS ? prev : prev.slice(1)));

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
    mode: local ? 'local' : 'online',
    playerName: username || DEFAULT_CONFIG.playerName,
    blindBig: venue.blindBig,
    startingStackHuman: venue.buyIn,
    startingStackAI: venue.buyIn,
    opponents: seats.map((s, i) => ({
      name: s.id,
      model: modelAt(s, i),
      strategy: s.strategy,
      prompt: promptForModel(s, modelAt(s, i)),
      persona: personaFor(s.strategy, s.style),
      styleKey: styleKeyOf(s.strategy, s.style),
    })),
    opponentModels: seats.map((s, i) => modelAt(s, i)),
    opponentCount: seats.length,
  };

  const isBroke = wealth < VENUES[1].buyIn;
  const canSit = affordable(venue, wealth);
  const venueLine = (v: GameVenue) => v.id === 'local'
    ? (lang === 'zh' ? '免费练习筹码 1,000 · 盲注 5/10' : '1,000 free practice chips · 5/10 blinds')
    : t.setup.venueLine(v.buyIn, v.blindBig / 2, v.blindBig);

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
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t.profile.edit}
            title={t.profile.edit}
            className="flex items-center gap-2 h-9 pl-1 pr-3.5 rounded-full bg-[#1c1c1e] hover:bg-[#2a2a2d] min-w-0 active:scale-[0.97] transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
          >
            <ProfileAvatar size={28} badge={13} />
            <span className="text-[14px] text-white truncate">{username || t.setup.unknown}</span>
          </button>
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
                  relative overflow-hidden shrink-0 w-[84%] h-[260px] snap-start rounded-[32px] p-6 text-left
                  flex flex-col justify-between bg-gradient-to-br ${v.bgClass} text-black select-none cursor-pointer
                  transition-opacity duration-300 ${i === venueIndex ? "opacity-100" : "opacity-60"}
                `}
              >
                <VenueArt venue={v} className={`absolute w-auto max-w-none aspect-square object-contain pointer-events-none right-[-16%] bottom-[-30%] h-[90%]`} />
                <div className="relative z-10 pr-8">
                  <div className="text-[26px] leading-tight tracking-tight">{venueName(v)}</div>
                  <div className="mt-1 text-[15px] text-black/55">{venueLine(v)}</div>
                  {v.id === 'local' && <div className="mt-1 text-[14px] text-black/65">{t.venues.local.desc}</div>}
                </div>
                {!open && <span className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-black/60"><Lock /></span>}
              </button>
            );
          })}
          {/* lets the last card snap to the left edge */}
          <div className="shrink-0 w-[calc(16%-32px)]" aria-hidden />
        </div>

        {/* Six venues: two columns on compact layouts, three on wider layouts. */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-6 lg:grid-cols-2 xl:grid-cols-6 gap-3 px-5">
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
                  relative overflow-hidden min-w-0 h-[260px] xl:h-[280px] rounded-[28px] p-4 xl:p-5 text-left flex flex-col justify-between
                  col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-3
                  bg-gradient-to-br ${v.bgClass} text-black select-none cursor-pointer
                  transition-[opacity,transform,box-shadow] duration-300
                  ${on ? "opacity-100 ring-2 ring-white ring-offset-4 ring-offset-black" : "opacity-55 hover:opacity-80"}
                `}
              >
                <VenueArt venue={v} className={`absolute w-auto max-w-none aspect-square object-contain pointer-events-none right-[-18%] bottom-[-30%] h-[90%]`} />
                <div className="relative z-10 min-w-0 pr-5">
                  <div className="text-[17px] xl:text-[19px] leading-tight tracking-tight line-clamp-2">{venueName(v)}</div>
                  <div className="mt-0.5 text-[13px] text-black/55">{t.venues[v.id]?.desc ?? v.desc}</div>
                  <div className="text-[13px] text-black/55">{venueLine(v)}</div>
                </div>
                {!open && <span className="absolute top-4 right-3 z-10 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-black/60"><Lock /></span>}
              </button>
            );
          })}
        </div>

        </div>

        <div className="flex-1 flex flex-col lg:self-stretch">

        {/* The table: faces stacked until you open it, then a list you can edit */}
        <div className="px-5 pt-10 lg:pt-8 flex items-center justify-between gap-4">
          {isDesktop ? (
            <div className="flex items-center gap-1.5 text-[20px] text-white">{t.setup.yourTable}</div>
          ) : (
            <button
              type="button"
              onClick={() => setUnfolded((u) => !u)}
              aria-expanded={unfolded}
              className="flex items-center gap-1.5 text-[20px] text-white cursor-pointer"
            >
              {t.setup.yourTable}
              <span className={`text-white/40 transition-transform duration-300 ${unfolded ? "rotate-180" : ""}`}>
                <ChevronDown />
              </span>
            </button>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={removeSeat}
              disabled={seats.length <= MIN_OPPONENTS}
              aria-label={t.setup.removeSeat}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] text-white text-[20px] leading-none disabled:opacity-30 active:scale-95 transition cursor-pointer disabled:cursor-default"
            >
              −
            </button>
            <span className="min-w-[88px] text-center text-[15px] text-white/70 tabular-nums">
              {t.setup.playersCount(seats.length + 1)}
            </span>
            <button
              type="button"
              onClick={addSeat}
              disabled={seats.length >= MAX_OPPONENTS}
              aria-label={t.setup.addSeat}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] text-white text-[20px] leading-none disabled:opacity-30 active:scale-95 transition cursor-pointer disabled:cursor-default"
            >
              +
            </button>
          </div>
        </div>
        <p className="px-5 mt-1 text-[14px] text-white/45">{local
          ? (lang === 'zh' ? '简单规则对手，用于测试界面与牌局流程。练习输赢不影响资金和对手统计。' : 'Simple rule-based opponents for testing the game. Practice leaves your bankroll and opponent records unchanged.')
          : listOpen ? t.setup.tapToEdit : t.setup.tapToOpen}</p>

        <SeatSnake
          rows={seats.map((seat, i) => ({
            id: seat.id,
            title: seat.id,
            model: modelAt(seat, i),
            subtitle: [
              menu.find((x) => x.id === modelAt(seat, i))?.label,
              local || seat.strategy === NATURAL ? "" : seat.strategy === CUSTOM ? t.seat.custom : t.personas[seat.strategy]?.name,
            ]
              .filter(Boolean)
              .join(" · "),
            marked: !local && promptForModel(seat, modelAt(seat, i)).trim() !== "",
          }))}
          unfolded={listOpen}
          onUnfold={() => setUnfolded(true)}
          unfoldLabel={t.setup.tapToOpen}
          markTitle={t.seat.customPrompt}
          rowProps={bind}
        />

        {/* Sit down */}
        <div
          className="felt-footer isolate sticky bottom-0 z-10 mt-auto px-5 pt-8"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          {customModel && <p className="mb-3 text-sm text-white/65 break-words">{lang === 'zh' ? '所有对手使用：' : 'All opponents use: '}{customModel}</p>}
          {canSit ? (
            <button
              type="button"
              onClick={() => onStartGame(config)}
              className="w-full h-[52px] rounded-full bg-white text-black text-[16px] active:scale-[0.98] transition-transform cursor-pointer"
            >
              {local ? (lang === 'zh' ? '开始本地练习 · 无需密钥' : 'Practice locally · No API key') : t.setup.sitDown(venue.buyIn)}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full h-[52px] rounded-full border border-white/15 text-white/40 text-[16px] flex items-center justify-center gap-2 cursor-default"
            >
              <Lock />
              {t.setup.lockedCta(venue.buyIn, wealth)}
            </button>
          )}
        </div>
        </div>
        </div>
      </div>

      {!local && editingIndex !== -1 && (
        <OpponentSheet
          key={seats[editingIndex].id}
          seat={seats[editingIndex]}
          menu={menu}
          model={modelAt(seats[editingIndex], editingIndex)}
          onChange={updateSeat}
          onClose={() => setEditing(null)}
          record={record}
        />
      )}
    </div>
  );
};
