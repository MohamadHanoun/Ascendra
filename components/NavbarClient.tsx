"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Locale, NavigationMessages } from "@/lib/i18n";

const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "";

type NavbarClientProps = {
  locale: Locale;
  labels: NavigationMessages;
  isAdmin: boolean;
  isLoggedIn: boolean;
  userName: string | null;
  userImage: string | null;
};

function BrandLogo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-3">
      <Image
        src="/images/brand/ascendra-logo-mark.png"
        alt="Ascendra"
        width={44}
        height={44}
        priority
        className="h-11 w-11 object-contain"
      />
      <Image
        src="/images/brand/ascendra-wordmark.png"
        alt="Ascendra"
        width={165}
        height={44}
        priority
        className="hidden h-10 w-auto object-contain sm:block"
      />
    </Link>
  );
}

const CUT8 = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

function NavSearchBar() {
  return (
    <div
      className="hidden items-center gap-2 lg:flex"
      style={{
        width: 220,
        background: "var(--asc-bg-1)",
        border: "1px solid var(--asc-line-soft)",
        padding: "6px 10px",
        clipPath: CUT8,
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        fontSize: 11,
        color: "var(--asc-fg-3)",
        letterSpacing: "0.06em",
        cursor: "default",
        flexShrink: 0,
      }}
    >
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="7"/>
        <path d="m20 20-3.5-3.5"/>
      </svg>
      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Search teams, players…</span>
      <kbd style={{ fontFamily: "inherit", fontSize: 10, padding: "2px 5px", background: "var(--asc-bg-2)", border: "1px solid var(--asc-line-soft)", color: "var(--asc-fg-3)", flexShrink: 0 }}>⌘K</kbd>
    </div>
  );
}

function NavBellBtn() {
  return (
    <button
      type="button"
      className="hidden lg:grid"
      style={{
        placeItems: "center",
        width: 36, height: 36, flexShrink: 0,
        background: "var(--asc-bg-1)",
        border: "1px solid var(--asc-line-soft)",
        color: "var(--asc-fg-1)",
        clipPath: CUT8,
        cursor: "pointer",
        position: "relative",
      }}
    >
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/>
        <path d="M10 21a2 2 0 0 0 4 0"/>
      </svg>
      <span
        style={{
          position: "absolute", top: -2, right: -2,
          background: "var(--asc-accent)",
          color: "var(--asc-fg-0)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 9, fontWeight: 600,
          padding: "1px 4px",
          lineHeight: 1.4,
        }}
      >2</span>
    </button>
  );
}

function NavAvatarPill({
  userName,
  userImage,
  isOpen,
  onClick,
}: {
  userName: string | null;
  userImage: string | null;
  isOpen: boolean;
  onClick: () => void;
}) {
  const initials = (userName || "PL").slice(0, 2).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "4px 10px 4px 4px",
        background: isOpen ? "var(--asc-bg-2)" : "var(--asc-bg-1)",
        border: "1px solid var(--asc-line-soft)",
        clipPath: CUT8,
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 120ms ease",
      }}
    >
      {userImage ? (
        <Image
          src={userImage}
          alt={userName || ""}
          width={28} height={28}
          style={{ objectFit: "cover", flexShrink: 0, clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
        />
      ) : (
        <span style={{
          display: "grid", placeItems: "center",
          width: 28, height: 28, flexShrink: 0,
          background: "linear-gradient(135deg, var(--asc-accent), var(--asc-accent-2))",
          color: "oklch(0.97 0.01 290)",
          fontFamily: "var(--font-display, sans-serif)",
          fontWeight: 700, fontSize: 11, letterSpacing: "0.04em",
          clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
        }}>{initials}</span>
      )}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 3, textAlign: "start" }}>
        <span style={{
          fontFamily: "var(--font-display, sans-serif)",
          fontWeight: 600, fontSize: 12,
          letterSpacing: "0.08em",
          color: "var(--asc-fg-0)",
          maxWidth: 96, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          textTransform: "uppercase",
        }}>{userName || "Player"}</span>
        <span style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 9, color: "var(--asc-accent)",
          letterSpacing: "0.08em",
        }}>▲ PLAYER</span>
      </div>
    </button>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative px-4 py-2 transition"
      style={{
        color: isActive ? "var(--asc-accent)" : "var(--asc-fg-2)",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: "0.8rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      {label}
      {isActive && (
        <span
          className="nav-active-line"
          style={{
            position: "absolute",
            bottom: "-1px",
            insetInlineStart: 0,
            insetInlineEnd: 0,
            height: "2px",
            background: "var(--asc-accent)",
            boxShadow: "0 0 10px var(--asc-accent-glow)",
          }}
        />
      )}
    </Link>
  );
}

const CUT6 = "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)";

function UserAvatar({
  userName,
  userImage,
  fallbackName,
  small = false,
}: {
  userName: string | null;
  userImage: string | null;
  fallbackName: string;
  small?: boolean;
}) {
  const size = small ? 30 : 36;

  if (userImage) {
    return (
      <Image
        src={userImage}
        alt={userName || fallbackName}
        width={size}
        height={size}
        style={{ objectFit: "cover", clipPath: CUT6 }}
      />
    );
  }

  return (
    <span
      className="grid place-items-center"
      style={{
        width: small ? "2rem" : "2.25rem",
        height: small ? "2rem" : "2.25rem",
        background: "var(--asc-accent-dim)",
        clipPath: CUT6,
      }}
    >
      <Image
        src="/images/brand/ascendra-logo-mark.png"
        alt="Ascendra"
        width={small ? 20 : 24}
        height={small ? 20 : 24}
        className="object-contain"
        style={{ width: small ? "1.25rem" : "1.5rem", height: small ? "1.25rem" : "1.5rem" }}
      />
    </span>
  );
}

export default function NavbarClient({
  locale,
  labels,
  isAdmin,
  isLoggedIn,
  userName,
  userImage,
}: NavbarClientProps) {
  const pathname = usePathname();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const mainLinks = [
    { href: "/", label: labels.links.home },
    { href: "/tournaments", label: labels.links.tournaments },
    { href: "/leaderboard", label: labels.links.leaderboard },
    { href: "/announcements", label: labels.links.news },
    { href: "/community", label: labels.links.community },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        setIsMenuOpen(false);
        setIsLogoutConfirmOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function confirmLogout() {
    setIsLogoutConfirmOpen(true);
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  }

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <header
        className="sticky top-0 z-40"
        style={{
          borderBottom: "1px solid var(--asc-line-soft)",
          background: "oklch(0.06 0.03 287 / 0.92)",
          backdropFilter: "blur(18px) saturate(140%)",
        }}
      >
        <nav className="flex w-full items-center gap-4 px-6 py-3 lg:px-10 2xl:px-14">
          <BrandLogo />

          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {mainLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>

          <div className="hidden items-center gap-2 ltr:ml-auto rtl:mr-auto lg:flex">
            {/* Search bar */}
            <NavSearchBar />

            {/* Discord */}
            {discordInvite && (
              <a
                href={discordInvite}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 12px",
                  background: "oklch(0.62 0.18 270)",
                  color: "oklch(0.98 0.01 290)",
                  fontFamily: "var(--font-display, sans-serif)",
                  fontWeight: 600, fontSize: 12,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  clipPath: CUT8,
                  textDecoration: "none",
                  flexShrink: 0,
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.55 0.20 270)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.62 0.18 270)"; }}
              >
                DISCORD
              </a>
            )}

            {/* Bell */}
            <NavBellBtn />

            {/* Auth */}
            {isLoggedIn ? (
              <div ref={profileMenuRef} className="relative">
                <NavAvatarPill
                  userName={userName}
                  userImage={userImage}
                  isOpen={isProfileOpen}
                  onClick={() => setIsProfileOpen((v) => !v)}
                />

                {isProfileOpen && (
                  <div
                    className="absolute mt-2 w-64 p-2 shadow-2xl ltr:right-0 rtl:left-0"
                    style={{
                      border: "1px solid var(--asc-line)",
                      background: "var(--asc-bg-2)",
                    }}
                  >
                    <div
                      className="mb-2 flex items-center gap-3 p-3"
                      style={{ background: "var(--asc-accent-dim)" }}
                    >
                      <UserAvatar
                        userName={userName}
                        userImage={userImage}
                        fallbackName={labels.account.fallbackName}
                      />
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-bold"
                          style={{ color: "var(--asc-fg-0)" }}
                        >
                          {userName || labels.account.fallbackName}
                        </p>
                        <p className="text-xs" style={{ color: "var(--asc-fg-3)" }}>
                          {labels.account.signedIn}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 text-sm font-bold transition"
                      style={{ color: "var(--asc-fg-2)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--asc-fg-0)";
                        e.currentTarget.style.borderInlineStart = "2px solid var(--asc-accent)";
                        e.currentTarget.style.paddingInlineStart = "calc(1rem - 2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--asc-fg-2)";
                        e.currentTarget.style.borderInlineStart = "";
                        e.currentTarget.style.paddingInlineStart = "";
                      }}
                    >
                      {labels.links.profile}
                    </Link>

                    {isAdmin && (
                      <>
                        <div
                          className="my-1"
                          style={{ borderTop: "1px solid var(--asc-line-soft)" }}
                        />
                        <Link
                          href="/admin"
                          className="block px-4 py-2.5 text-sm font-bold transition"
                          style={{ color: "var(--asc-fg-2)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--asc-fg-0)";
                            e.currentTarget.style.borderInlineStart = "2px solid var(--asc-accent)";
                            e.currentTarget.style.paddingInlineStart = "calc(1rem - 2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--asc-fg-2)";
                            e.currentTarget.style.borderInlineStart = "";
                            e.currentTarget.style.paddingInlineStart = "";
                          }}
                        >
                          {labels.links.adminPanel}
                        </Link>
                        <Link
                          href="/admin/bot"
                          className="block px-4 py-2.5 text-sm font-bold transition"
                          style={{ color: "var(--asc-green)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--asc-fg-0)";
                            e.currentTarget.style.borderInlineStart = "2px solid var(--asc-green)";
                            e.currentTarget.style.paddingInlineStart = "calc(1rem - 2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--asc-green)";
                            e.currentTarget.style.borderInlineStart = "";
                            e.currentTarget.style.paddingInlineStart = "";
                          }}
                        >
                          {labels.links.botDashboard}
                        </Link>
                      </>
                    )}

                    <div
                      className="my-1"
                      style={{ borderTop: "1px solid var(--asc-line-soft)" }}
                    />
                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="w-full px-4 py-2.5 text-left text-sm font-bold transition rtl:text-right"
                      style={{ color: "var(--asc-live)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "oklch(0.25 0.18 25 / 0.18)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "";
                      }}
                    >
                      {labels.actions.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-bold transition"
                style={{
                  border: "1px solid var(--asc-line)",
                  color: "var(--asc-fg-2)",
                  clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
                }}
              >
                {labels.actions.login}
              </Link>
            )}

            <LanguageSwitcher locale={locale} labels={labels.language} />
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-expanded={isMenuOpen}
            className="px-4 py-2 text-sm font-bold transition ltr:ml-auto rtl:mr-auto lg:hidden"
            style={{
              border: "1px solid var(--asc-line-soft)",
              color: "var(--asc-fg-1)",
            }}
          >
            {isMenuOpen ? labels.actions.close : labels.actions.menu}
          </button>
        </nav>

        {isMenuOpen && (
          <div
            className="px-6 py-5 lg:hidden"
            style={{
              borderTop: "1px solid var(--asc-line-soft)",
              background: "var(--asc-bg-1)",
            }}
          >
            <div className="grid gap-1">
              {mainLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={() => setIsMenuOpen(false)}
                />
              ))}

              <div
                className="mt-3 grid gap-2 pt-4"
                style={{ borderTop: "1px solid var(--asc-line-soft)" }}
              >
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-3 px-4 py-3 text-center"
                      style={{
                        border: "1px solid var(--asc-line-soft)",
                        background: "var(--asc-accent-dim)",
                      }}
                    >
                      <UserAvatar
                        userName={userName}
                        userImage={userImage}
                        fallbackName={labels.account.fallbackName}
                        small
                      />
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--asc-fg-1)" }}
                      >
                        {labels.links.profile}
                      </span>
                    </Link>

                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="px-4 py-3 text-center text-sm font-bold transition"
                          style={{
                            border: "1px solid var(--asc-line-soft)",
                            color: "var(--asc-fg-2)",
                          }}
                        >
                          {labels.links.adminPanel}
                        </Link>
                        <Link
                          href="/admin/bot"
                          onClick={() => setIsMenuOpen(false)}
                          className="px-4 py-3 text-center text-sm font-bold transition"
                          style={{
                            border: "1px solid oklch(0.55 0.14 150 / 0.4)",
                            background: "oklch(0.25 0.12 150 / 0.15)",
                            color: "var(--asc-green)",
                          }}
                        >
                          {labels.links.botDashboard}
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="px-4 py-3 text-center text-sm font-bold transition"
                      style={{
                        border: "1px solid oklch(0.50 0.20 25 / 0.4)",
                        color: "var(--asc-live)",
                      }}
                    >
                      {labels.actions.logout}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 text-center text-sm font-bold transition"
                    style={{
                      border: "1px solid var(--asc-line-soft)",
                      color: "var(--asc-fg-2)",
                    }}
                  >
                    {labels.actions.login}
                  </Link>
                )}

                {discordInvite && (
                  <a
                    href={discordInvite}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-3 text-center text-sm font-black text-white transition"
                    style={{ background: "var(--asc-accent-2)" }}
                  >
                    {labels.actions.joinDiscord}
                  </a>
                )}

                <LanguageSwitcher locale={locale} labels={labels.language} compact />
              </div>
            </div>
          </div>
        )}
      </header>

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6">
          <div
            className="w-full max-w-md p-6 shadow-2xl"
            style={{
              border: "1px solid var(--asc-line)",
              background: "var(--asc-bg-2)",
            }}
          >
            <h2
              className="mb-3 text-2xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {labels.account.logoutTitle}
            </h2>
            <p className="mb-6 leading-7" style={{ color: "var(--asc-fg-2)" }}>
              {labels.account.logoutDescription}
            </p>
            <div className="grid gap-3 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-5 py-3 font-bold transition"
                style={{
                  border: "1px solid var(--asc-line)",
                  color: "var(--asc-fg-2)",
                }}
              >
                {labels.actions.cancel}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-3 font-bold text-white transition"
                style={{ background: "var(--asc-live)" }}
              >
                {labels.actions.confirmLogout}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
