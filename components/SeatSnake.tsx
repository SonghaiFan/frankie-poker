import { ModelBrandIcon } from "./ModelBrandIcon";
import React, { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { Avatar } from "./Avatar";

// The opponents, folded into a stack of faces or unfolded into a list — and
// the unfolding is a snake, not a pendulum. Every face rides one track: along
// the stack to its left end, then straight down the list. The leftmost face
// is the head and goes first; each one behind follows its trail, sliding into
// the corner the one ahead just left before turning down. They move in lock
// step, so nobody passes anybody: the head runs furthest (the bottom row) and
// the tail stops first (the top row). Folding runs the same track backwards.
//
// Positions are one number per face, its distance along the track:
//   s < 0  — on the stack, |s| px right of the corner
//   s ≥ 0  — in the list, s px below the corner

export interface SnakeRow {
  id: string;
  title: string;
  subtitle: string;
  model?: string;
  marked?: boolean; // shows the prompt mark
}

interface SeatSnakeProps {
  rows: SnakeRow[]; // in list order, top to bottom
  unfolded: boolean;
  onUnfold: () => void;
  unfoldLabel: string;
  markTitle: string;
  rowProps: (id: string) => React.ButtonHTMLAttributes<HTMLButtonElement>;
}

const GUTTER = 20; // the page's side padding: where the corner sits
const FACE = 48;
const ROW_H = 68; // a list row: the face and 10px above and below
const TOP = 10; // the face's inset from the top of a row, and of the stack
const STEP = 36; // stacked faces overlap by a quarter
const SPEED = 450; // px per second along the track: slow enough to see the snake
const GLIDE_MS = 300; // a seat coming or going: the rest of the list slides to make room, or close it
const GLIDE = `${GLIDE_MS}ms cubic-bezier(0.19, 1, 0.22, 1)`;

const QuoteMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const SeatSnake: React.FC<SeatSnakeProps> = ({
  rows,
  unfolded,
  onUnfold,
  unfoldLabel,
  markTitle,
  rowProps,
}) => {
  const n = rows.length;
  // Row j is stacked at k = n-1-j: the last row leads from the left end of the stack
  const start = (j: number) => -(n - 1 - j) * STEP;
  const stop = (j: number) => j * ROW_H;
  // How far the whole snake has travelled; everyone moves by this much, then stops at their row
  const length = (n - 1) * ROW_H; // the head's journey, the longest
  const [travel, setTravel] = useState(unfolded ? length : 0);
  const travelRef = useRef(travel);
  // Folding and unfolding run the snake frame by frame; a seat added or removed
  // only moves the others by a row, which CSS glides instead
  const [snaking, setSnaking] = useState(false);
  const wasUnfolded = useRef(unfolded);

  useEffect(() => {
    const target = unfolded ? length : 0;
    const toggled = wasUnfolded.current !== unfolded;
    wasUnfolded.current = unfolded;
    if (!toggled || reducedMotion()) {
      travelRef.current = target;
      setTravel(target);
      return;
    }
    setSnaking(true);
    let done: ReturnType<typeof setTimeout> | undefined;
    const distance = Math.abs(target - travelRef.current);
    const controls = animate(travelRef.current, target, {
      duration: Math.max(0.25, distance / SPEED),
      ease: [0.45, 0, 0.25, 1],
      onUpdate: (v) => {
        travelRef.current = v;
        setTravel(v);
      },
      // a tick later, so the last frame lands before the glide is switched back on
      onComplete: () => {
        done = setTimeout(() => setSnaking(false));
      },
    });
    return () => {
      controls.stop();
      clearTimeout(done);
      setSnaking(false);
    };
  }, [unfolded, length]);

  const at = (j: number) => Math.min(start(j) + travel, stop(j));
  const arrived = (j: number) => unfolded && at(j) >= stop(j) - 0.5;

  const point = (s: number) => (s < 0 ? { x: GUTTER - s, y: TOP } : { x: GUTTER, y: TOP + s });
  const deepest = rows.reduce((m, _, j) => Math.max(m, point(at(j)).y), TOP);
  const height = deepest + FACE + TOP;

  // A face whose seat was just removed stays where it was for a moment, fading
  // out, while the rest close the gap
  const lastSeen = useRef(new Map<string, { x: number; y: number }>());
  const [leaving, setLeaving] = useState<{ id: string; x: number; y: number }[]>([]);
  const ids = rows.map((r) => r.id).join("|");
  useEffect(() => {
    const now = new Set(rows.map((r) => r.id));
    const gone = [...lastSeen.current].filter(([id]) => !now.has(id)).map(([id, p]) => ({ id, ...p }));
    lastSeen.current = new Map(rows.map((r, j) => [r.id, point(at(j))]));
    if (gone.length === 0 || reducedMotion()) return;
    setLeaving((l) => [...l.filter((g) => !now.has(g.id)), ...gone]);
    const timer = setTimeout(() => setLeaving((l) => l.filter((g) => !gone.some((x) => x.id === g.id))), GLIDE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  useEffect(() => {
    lastSeen.current = new Map(rows.map((r, j) => [r.id, point(at(j))]));
  });

  return (
    // isolate: the faces' z-indexes order them within the snake, and must not lift them over the page (the pinned Sit down button)
    <div className="relative isolate mt-3 mb-4" style={{ height }}>
      {/* The list: each row's words appear once its face has arrived */}
      {rows.map((row, j) => {
        const here = arrived(j);
        return (
          <button
            key={row.id}
            type="button"
            {...rowProps(row.id)}
            tabIndex={here ? 0 : -1}
            aria-hidden={!here}
            aria-haspopup="dialog"
            className={`
              group absolute inset-x-0 flex items-center gap-4 px-5 rounded-2xl text-left select-none [-webkit-touch-callout:none]
              transition-[opacity,background-color,transform,top] duration-300 cursor-pointer
              ${here ? "opacity-100" : "opacity-0 pointer-events-none"}
              hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/30 active:bg-white/[0.08] active:scale-[0.98]
            `}
            style={{ top: stop(j), height: ROW_H }}
          >
            <span className="w-12 h-12 shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block text-[17px] text-white truncate">{row.title}</span>
              <span className="flex items-center gap-1.5 text-[14px] text-white/45 min-w-0">{row.model && <ModelBrandIcon model={row.model} size={14} />}<span className="truncate">{row.subtitle}</span></span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-white/55 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h6m4 0h6M4 17h10m4 0h2" />
                <circle cx="12" cy="7" r="2" /><circle cx="16" cy="17" r="2" />
              </svg>
            </span>
            {row.marked && (
              <span className="text-white/35 shrink-0" title={markTitle}>
                <QuoteMark />
              </span>
            )}
          </button>
        );
      })}

      {/* Faces keep their position as the circular stack opens into an unframed list. */}
      {rows.map((row, j) => {
        const s = at(j);
        const { x, y } = point(s);
        // Morph along each face's own journey, so size and frame reverse smoothly too.
        const distance = stop(j) - start(j);
        const progress = distance > 0 ? Math.max(0, Math.min(1, (s - start(j)) / distance)) : Number(unfolded);
        const opened = progress * progress * (3 - 2 * progress);
        return (
          <span
            key={row.id}
            className="absolute w-12 h-12 rounded-full pointer-events-none"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${x}px, ${y}px)`,
              zIndex: j + 1, // the head, leftmost, lies on top of the stack
              transition: snaking ? "none" : `transform ${GLIDE}, padding ${GLIDE}, background-color ${GLIDE}, box-shadow ${GLIDE}`,
              animation: `fade-in ${GLIDE_MS}ms ease-out`, // a new seat fades in where it lands
              padding: 6 * (1 - opened),
              backgroundColor: `rgba(var(--felt-surface-rgb), ${1 - opened})`,
              boxShadow: `0 0 0 3px rgba(var(--felt-separator-rgb), ${1 - opened})`,
            }}
          >
            <Avatar name={row.id} alt="" className="w-full h-full object-contain" />
          </span>
        );
      })}

      {leaving.map((g) => (
        <span
          key={`leaving-${g.id}`}
          className="absolute w-12 h-12 pointer-events-none"
          style={{ left: 0, top: 0, transform: `translate(${g.x}px, ${g.y}px)`, zIndex: 0, animation: `fade-out ${GLIDE_MS}ms ease-out forwards` }}
        >
          <Avatar name={g.id} alt="" className="w-full h-full object-contain" />
        </span>
      ))}

      {/* Folded, the whole stack is one button */}
      {!unfolded && (
        <button
          type="button"
          onClick={onUnfold}
          aria-expanded={false}
          aria-label={unfoldLabel}
          className="absolute cursor-pointer rounded-full"
          style={{ left: GUTTER - 4, top: TOP - 4, width: FACE + (n - 1) * STEP + 8, height: FACE + 8, zIndex: n + 1 }}
        />
      )}
    </div>
  );
};
