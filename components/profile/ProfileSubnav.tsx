"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ProfileTabLabels } from "@/components/profile/types";

type ProfileSubnavProps = {
  labels: ProfileTabLabels;
  invitationCount: number;
  activeMatchesCount: number;
  dir: "ltr" | "rtl";
};

type ProfileSubnavItem = {
  href: string;
  label: string;
  badge?: number;
};

function isActivePath(pathname: string, href: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const normalizedHref = href.replace(/\/+$/, "") || "/";

  if (normalizedHref === "/profile") {
    return normalizedPath === "/profile";
  }

  return normalizedPath === normalizedHref;
}

function Badge({ value }: { value: number }) {
  if (value <= 0) {
    return null;
  }

  return (
    <span
      className="inline-flex h-[18px] min-w-[18px] items-center justify-center px-1 text-[9px] font-black"
      style={{ background: "var(--asc-accent)", color: "#000" }}
    >
      {value}
    </span>
  );
}

function MobileItem({
  item,
  active,
}: {
  item: ProfileSubnavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-4 text-[10px] font-black uppercase tracking-[0.10em] transition-colors motion-reduce:transition-none"
      style={{
        color: active ? "var(--asc-fg-0)" : "var(--asc-fg-3)",
        background: active ? "var(--asc-accent-dim)" : "transparent",
        boxShadow: active ? "inset 0 -3px 0 var(--asc-accent)" : "none",
      }}
    >
      <span>{item.label}</span>
      <Badge value={item.badge ?? 0} />
    </Link>
  );
}

function DesktopItem({
  item,
  active,
}: {
  item: ProfileSubnavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="flex min-h-12 items-center justify-between gap-3 border px-4 py-3 text-sm font-black uppercase tracking-[0.10em] transition-colors motion-reduce:transition-none"
      style={{
        borderColor: active ? "var(--asc-accent-border)" : "transparent",
        color: active ? "var(--asc-fg-0)" : "var(--asc-fg-3)",
        background: active ? "var(--asc-accent-dim)" : "transparent",
      }}
    >
      <span>{item.label}</span>
      <Badge value={item.badge ?? 0} />
    </Link>
  );
}

export default function ProfileSubnav({
  labels,
  invitationCount,
  activeMatchesCount,
  dir,
}: ProfileSubnavProps) {
  const pathname = usePathname() || "/profile";
  const items: ProfileSubnavItem[] = [
    { href: "/profile", label: labels.overview },
    { href: "/profile/account", label: labels.account },
    {
      href: "/profile/teams",
      label: labels.teams,
      badge: invitationCount || undefined,
    },
    {
      href: "/profile/matches",
      label: labels.matches,
      badge: activeMatchesCount || undefined,
    },
    { href: "/profile/history", label: labels.history },
    { href: "/profile/achievements", label: labels.achievements },
  ];

  return (
    <>
      <nav
        aria-label="Profile sections"
        dir={dir}
        className="lg:hidden"
        style={{
          border: "1px solid var(--asc-line-soft)",
          background: "var(--asc-bg-1)",
        }}
      >
        <div className="flex overflow-x-auto">
          {items.map((item) => (
            <MobileItem
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
            />
          ))}
        </div>
      </nav>

      <aside
        dir={dir}
        className="hidden lg:block"
        style={{ position: "sticky", top: 96, alignSelf: "start" }}
      >
        <nav
          aria-label="Profile sections"
          className="grid gap-1 border p-2"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-1)",
          }}
        >
          {items.map((item) => (
            <DesktopItem
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
