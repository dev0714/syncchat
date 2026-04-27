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
  const style = {
    ["--pacman-size" as string]: `${size}px`,
    ["--pacman-bg" as string]: backgroundColor,
  } as CSSProperties;

  return (
    <span
      className={cn("pacman-loader-shell", className)}
      role="status"
      aria-label={label}
      style={style}
    >
      <span className="pacman-loader">
        <span className="circles" aria-hidden="true">
          <span className="one" />
          <span className="two" />
          <span className="three" />
        </span>
        <span className="pacman" aria-hidden="true">
          <span className="top" />
          <span className="bottom" />
          <span className="left" />
          <span className="eye" />
        </span>
      </span>
    </span>
  );
}
