"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { adminNavigationGroups, type AdminNavigationItem } from "@/data/adminNavigation";

type AdminSidebarNavProps = {
  userName?: string | null;
};

function isActiveItem({
  item,
  pathname,
  currentTab,
}: {
  item: AdminNavigationItem;
  pathname: string;
  currentTab: string;
}) {
  if (item.matchPaths?.some((path) => pathname.startsWith(path))) {
    return true;
  }

  if (item.path === "/admin" && pathname === "/admin") {
    return currentTab === (item.tab ?? "overview");
  }

  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

function NavItem({
  item,
  active,
}: {
  item: AdminNavigationItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="block px-3 py-2.5 text-sm font-black transition"
      style={
        active
          ? {
              borderColor: "var(--asc-accent-border)",
              background: "var(--asc-accent-dim)",
              color: "var(--asc-fg-0)",
              boxShadow: "inset 3px 0 0 var(--asc-accent)",
            }
          : {
              borderColor: "transparent",
              color: "var(--asc-fg-3)",
            }
      }
    >
      {item.label}
    </Link>
  );
}

function NavGroups() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab =
    pathname === "/admin" ? searchParams.get("tab") || "overview" : "";

  return (
    <div className="grid gap-5">
      {adminNavigationGroups.map((group) => (
        <section key={group.title} className="grid gap-2">
          <p
            className="px-3 text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {group.title}
          </p>

          <div className="grid gap-1">
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={isActiveItem({ item, pathname, currentTab })}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function BrandBlock({ userName }: AdminSidebarNavProps) {
  return (
    <div className="grid gap-5">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/images/brand/ascendra-logo-mark.png"
          alt="Ascendra"
          width={42}
          height={42}
          priority
          className="h-10 w-10 object-contain"
        />
        <Image
          src="/images/brand/ascendra-wordmark.png"
          alt="Ascendra"
          width={150}
          height={40}
          priority
          className="h-9 w-auto object-contain"
        />
      </Link>

      <div
        className="border px-4 py-3"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-bg-2)",
        }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-[0.18em]"
          style={{ color: "var(--asc-accent)" }}
        >
          Admin panel
        </p>
        <p
          className="mt-1 truncate text-sm font-black"
          style={{ color: "var(--asc-fg-0)" }}
        >
          {userName || "Ascendra Admin"}
        </p>
      </div>
    </div>
  );
}

export default function AdminSidebarNav({ userName }: AdminSidebarNavProps) {
  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[286px] flex-col border-r px-4 py-5 lg:flex"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-nav-bg)",
          boxShadow: "18px 0 48px rgb(0 0 0 / 0.22)",
        }}
      >
        <BrandBlock userName={userName} />

        <nav className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Admin navigation">
          <NavGroups />
        </nav>

        <Link
          href="/"
          className="mt-5 border px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] transition hover:opacity-90"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-2)",
            color: "var(--asc-fg-2)",
          }}
        >
          View public site
        </Link>
      </aside>

      <div
        className="sticky top-0 z-40 border-b px-4 py-3 lg:hidden"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-nav-bg)",
          backdropFilter: "blur(18px) saturate(140%)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/images/brand/ascendra-logo-mark.png"
              alt="Ascendra"
              width={36}
              height={36}
              priority
              className="h-9 w-9 object-contain"
            />
            <Image
              src="/images/brand/ascendra-wordmark.png"
              alt="Ascendra"
              width={132}
              height={36}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          <details className="relative">
            <summary
              className="cursor-pointer list-none border px-4 py-2 text-xs font-black uppercase tracking-[0.12em]"
              style={{
                borderColor: "var(--asc-accent-border)",
                background: "var(--asc-accent-dim)",
                color: "var(--asc-accent)",
              }}
            >
              Menu
            </summary>

            <div
              className="absolute right-0 top-full mt-3 max-h-[72vh] w-[min(84vw,360px)] overflow-y-auto border p-4 shadow-2xl"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
              }}
            >
              <NavGroups />
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
