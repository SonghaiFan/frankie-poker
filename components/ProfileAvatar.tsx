import React from "react";
import { Avatar } from "./Avatar";

// Your avatar with a small pencil on its corner: the one sign, everywhere,
// that tapping it changes how you look at the table.
export const ProfileAvatar: React.FC<{ size: number; badge?: number }> = ({ size, badge = Math.round(size * 0.42) }) => (
  <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
    <Avatar isHuman alt="" className="w-full h-full object-contain" />
    <span
      aria-hidden
      className="absolute -right-0.5 -bottom-0.5 rounded-full bg-white text-black flex items-center justify-center ring-2 ring-[#1c1c1e]"
      style={{ width: badge, height: badge }}
    >
      <svg width="62%" height="62%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h4L19 9l-4-4L4 16z" />
      </svg>
    </span>
  </span>
);
