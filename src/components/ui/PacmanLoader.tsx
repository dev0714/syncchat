import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface PacmanLoaderProps {
  size?: number;
  className?: string;
  label?: string;
  backgroundColor?: string;
}

export default function PacmanLoader({
  size = 44,
  className = "",
  label = "Loading",
  backgroundColor = "#ffffff",
}: PacmanLoaderProps) {
  const width = Math.round(size * 2.9);
  const height = size;
  const cx = size * 0.52;
  const cy = size * 0.5;
  const r = size * 0.44;
  const mouthX = cx + r * 0.98;
  const mouthY = r * 0.56;

  return (
    <span
      className={cn("pacman-loader", className)}
      role="status"
      aria-label={label}
      style={
        {
          ["--pacman-size" as string]: `${size}px`,
          ["--pacman-bg" as string]: backgroundColor,
        } as CSSProperties
      }
    >
      <svg
        className="pacman-loader__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        <g className="pacman-loader__pacman">
          <circle cx={cx} cy={cy} r={r} />
          <circle className="pacman-loader__eye" cx={cx - r * 0.18} cy={cy - r * 0.24} r={size * 0.045} />
          <path
            className="pacman-loader__mouth"
            d={`M ${cx} ${cy}
               L ${mouthX} ${cy - mouthY}
               A ${r} ${r} 0 0 1 ${mouthX} ${cy + mouthY}
               Z`}
          />
        </g>
        <g className="pacman-loader__dots">
          {Array.from({ length: 4 }).map((_, index) => (
            <circle
              key={index}
              cx={size * 1.2 + index * size * 0.55}
              cy={size * 0.5}
              r={size * 0.09}
            />
          ))}
        </g>
      </svg>
    </span>
  );
}
