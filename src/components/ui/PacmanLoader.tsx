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
          <circle cx={size * 0.52} cy={size * 0.5} r={size * 0.44} />
          <path
            className="pacman-loader__mouth"
            d={`M ${size * 0.52} ${size * 0.5} L ${size * 1.02} ${size * 0.2} L ${size * 1.02} ${size * 0.8} Z`}
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
