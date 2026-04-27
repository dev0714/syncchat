"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface DashboardTransitionProps {
  children: ReactNode;
}

export default function DashboardTransition({ children }: DashboardTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-reveal">
      {children}
    </div>
  );
}
