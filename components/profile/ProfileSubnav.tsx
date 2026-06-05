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
    <span className="asc-profile-nav-badge">
      {value}
    </span>
  );
}

function MobileItem({
  item,
  active,
  index,
}: {
  item: ProfileSubnavItem;
  active: boolean;
  index: number;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : undefined}
      className="asc-profile-nav-item min-w-[9.5rem] shrink-0 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.10em]"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="asc-profile-nav-item__index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="truncate">{item.label}</span>
      </span>
      <Badge value={item.badge ?? 0} />
    </Link>
  );
}

function DesktopItem({
  item,
  active,
  index,
}: {
  item: ProfileSubnavItem;
  active: boolean;
  index: number;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : undefined}
      className="asc-profile-nav-item text-sm font-black uppercase tracking-[0.10em]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="asc-profile-nav-item__index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="truncate">{item.label}</span>
      </span>
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
        className="asc-profile-mobile-nav lg:hidden"
      >
        <div className="asc-profile-mobile-nav__track">
          {items.map((item, index) => (
            <MobileItem
              key={item.href}
              item={item}
              index={index}
              active={isActivePath(pathname, item.href)}
            />
          ))}
        </div>
      </nav>

      <aside
        dir={dir}
        className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
      >
        <nav
          aria-label="Profile sections"
          className="asc-profile-subnav"
        >
          <div className="asc-profile-subnav__inner">
            {items.map((item, index) => (
              <DesktopItem
                key={item.href}
                item={item}
                index={index}
                active={isActivePath(pathname, item.href)}
              />
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
