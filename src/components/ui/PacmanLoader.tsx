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
  const scale = size / 60;
  const style = {
    ["--pacman-bg" as string]: backgroundColor,
    ["--pacman-scale" as string]: `${scale}`,
    width: `${160 * scale}px`,
    height: `${60 * scale}px`,
  } as CSSProperties;

  return (
    <span
      className={cn("pacman-loader-shell", className)}
      role="status"
      aria-label={label}
      style={style}
    >
      <span className="pacman-loader" aria-hidden="true">
        <span className="circles">
          <span className="one" />
          <span className="two" />
          <span className="three" />
        </span>
        <span className="pacman">
          <span className="top" />
          <span className="bottom" />
          <span className="left" />
          <span className="eye" />
        </span>
      </span>
    </span>
  );
}
