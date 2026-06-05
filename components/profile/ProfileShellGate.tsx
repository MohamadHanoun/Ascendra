"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

function isTeamDetailPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "");
  return /^\/profile\/teams\/[^/]+(?:\/.*)?$/.test(normalizedPath);
}

export default function ProfileShellGate({
  children,
  shell,
}: {
  children: ReactNode;
  shell: ReactNode;
}) {
  const pathname = usePathname() || "";

  if (isTeamDetailPath(pathname)) {
    return <>{children}</>;
  }

  return <>{shell}</>;
}
