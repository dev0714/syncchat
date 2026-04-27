 "use client";

import { useId } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface PacmanLoaderProps {
  size?: number;
  className?: string;
  label?: string;
}

export default function PacmanLoader({
  size = 44,
  className = "",
  label = "Loading",
}: PacmanLoaderProps) {
  const id = useId().replace(/:/g, "");
  const style = {
    ["--pacman-scale" as string]: `${size / 60}`,
  } as CSSProperties;

  return (
    <span
      className={cn("pacman-loader-shell", className)}
      role="status"
      aria-label={label}
      style={style}
    >
      <svg
        className="pacman-loader"
        aria-hidden="true"
        width="160"
        height="60"
        viewBox="0 0 160 60"
      >
        <defs>
          <mask id={`pacman-mouth-${id}`}>
            <rect width="160" height="60" fill="white" />
            <path
              className="pacman-loader__mouth"
              d="M 30 30 L 54 16 L 54 44 Z"
              fill="black"
            />
          </mask>
        </defs>

        <circle
          className="pacman-loader__pacman"
          cx="30"
          cy="30"
          r="22"
          mask={`url(#pacman-mouth-${id})`}
        />

        <circle className="pacman-loader__eye" cx="38" cy="22" r="3.5" />

        <g className="pacman-loader__dots">
          <circle cx="74" cy="30" r="4" />
          <circle cx="102" cy="30" r="4" />
          <circle cx="130" cy="30" r="4" />
        </g>
      </svg>
    </span>
  );
}
