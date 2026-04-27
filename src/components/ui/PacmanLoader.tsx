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
  return (
    <span
      className={cn("pacman-loader", className)}
      role="status"
      aria-label={label}
      style={{ ["--pacman-size" as string]: `${size}px` }}
    >
      <span className="pacman-loader__pacman" />
      <span className="pacman-loader__ball" />
    </span>
  );
}
