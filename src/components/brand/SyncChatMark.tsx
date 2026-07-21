"use client";
import { useId } from "react";

/**
 * SyncChat brand mark — a green speech bubble with three dots (typing/chat).
 * Vector so it stays crisp at any size. Colour is a green gradient matching the
 * SyncChat logo. Pass a className to size it (e.g. "w-9 h-9"). Each instance
 * gets a unique gradient id so multiple marks on one page never collide.
 */
export default function SyncChatMark({ className, title }: { className?: string; title?: string }) {
  const gid = "sc-grad-" + useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title ?? "SyncChat"} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3EE07E" />
          <stop offset="1" stopColor="#12A150" />
        </linearGradient>
      </defs>
      <path
        d="M7 4 H17 A4 4 0 0 1 21 8 V12 A4 4 0 0 1 17 16 H9 L5 20.5 L7 16 A4 4 0 0 1 3 12 V8 A4 4 0 0 1 7 4 Z"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill={`url(#${gid})`}>
        <circle cx="8.5" cy="10" r="1.5" />
        <circle cx="12" cy="10" r="1.5" />
        <circle cx="15.5" cy="10" r="1.5" />
      </g>
    </svg>
  );
}
