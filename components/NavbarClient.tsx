"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import GlobalSearch from "@/components/GlobalSearch";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import PublicThemeToggle from "@/components/PublicThemeToggle";
import type { Locale, NavigationMessages } from "@/lib/i18n";

type NavbarClientProps = {
  locale: Locale;
  labels: NavigationMessages;
  isAdmin: boolean;
  isLoggedIn: boolean;
  userName: string | null;
  userImage: string | null;
};

const CUT6 = "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)";

function BrandLogo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-3">
      <Image
        src="/images/brand/ascendra-logo-mark.png"
        alt="Ascendra"
        width={44}
        height={44}
        priority
        className="asc-brand-mark h-11 w-11 object-contain"
      />
      <Image
        src="/images/brand/ascendra-wordmark.png"
        alt="Ascendra"
        width={165}
        height={44}
        priority
        className="asc-brand-wordmark hidden h-10 w-auto object-contain sm:block"
      />
    </Link>
  );
}

function NavAvatarPill({
  userName,
  userImage,
  fallbackName,
  playerLabel,
  isOpen,
  onClick,
}: {
  userName: string | null;
  userImage: string | null;
  fallbackName: string;
  playerLabel: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  const initials = (userName || "PL").slice(0, 2).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      className="asc-nav-profile"
      data-open={isOpen ? "true" : undefined}
      aria-expanded={isOpen}
    >
      {userImage ? (
        <Image
          src={userImage}
          alt={userName || ""}
          width={28}
          height={28}
          style={{ objectFit: "cover", flexShrink: 0, clipPath: CUT6 }}
        />
      ) : (
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 28,
            height: 28,
            flexShrink: 0,
            background: "linear-gradient(135deg, var(--asc-gold-bright, #e8c66a), var(--asc-bronze, #9c6f33))",
            color: "#0a0a0b",
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.04em",
            clipPath: CUT6,
          }}
        >
          {initials}
        </span>
      )}
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 3, textAlign: "start" }}>
        <span
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.08em",
            color: "var(--asc-fg-0)",
            maxWidth: 96,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          {userName || fallbackName}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 9,
            color: "var(--asc-accent)",
            letterSpacing: "0.08em",
          }}
        >
          ▲ {playerLabel}
        </span>
      </span>
    </button>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      className="asc-nav-link"
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  index,
  arrow,
  onClick,
}: {
  href: string;
  label: string;
  index: number;
  arrow: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className="asc-nav-mobile-link"
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="asc-nav-mobile-link__index">
        {String(index + 1).padStart(2, "0")}
      </span>
      {label}
      <span aria-hidden="true" className="asc-nav-mobile-link__arrow">
        {arrow}
      </span>
    </Link>
  );
}

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
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const arrow = locale === "ar" ? "‹" : "›";

  const mainLinks = [
    { href: "/", label: labels.links.home },
    { href: "/tournaments", label: labels.links.tournaments },
    { href: "/games", label: labels.links.games },
    { href: "/leaderboard", label: labels.links.leaderboard },
    { href: "/community", label: labels.links.community },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }

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
      <header className="asc-nav asc-navbar sticky top-0 z-40">
        <nav className="flex w-full items-center gap-4 px-6 py-3 lg:px-10 2xl:px-14">
          <BrandLogo />

          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {mainLinks.map((link) => (
              <DesktopNavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>

          <div className="hidden items-center gap-2 ltr:ml-auto rtl:mr-auto lg:flex">
            {/* Search bar */}
            <GlobalSearch labels={labels.search} />

            <span aria-hidden="true" className="asc-nav-divider" />

            {/* Discord */}
            <Link href="/discord" className="asc-nav-discord">
              DISCORD
            </Link>

            {/* Bell */}
            <NotificationsDropdown isLoggedIn={isLoggedIn} />

            {/* Auth */}
            {isLoggedIn ? (
              <div ref={profileMenuRef} className="relative">
                <NavAvatarPill
                  userName={userName}
                  userImage={userImage}
                  fallbackName={labels.account.fallbackName}
                  playerLabel={labels.account.playerLabel}
                  isOpen={isProfileOpen}
                  onClick={() => setIsProfileOpen((v) => !v)}
                />

                {isProfileOpen && (
                  <div className="asc-nav-panel ltr:right-0 rtl:left-0">
                    <div className="asc-nav-panel__head">
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

                    <Link href="/profile" className="asc-nav-panel__row">
                      {labels.links.profile}
                    </Link>

                    {isAdmin && (
                      <>
                        <div className="asc-nav-panel__divider" />
                        <Link href="/admin" className="asc-nav-panel__row">
                          {labels.links.adminPanel}
                        </Link>
                        <Link
                          href="/admin/bot"
                          className="asc-nav-panel__row asc-nav-panel__row--bot"
                        >
                          {labels.links.botDashboard}
                        </Link>
                      </>
                    )}

                    <div className="asc-nav-panel__divider" />
                    <div className="asc-nav-panel__section">
                      <span className="asc-nav-panel__section-title">Interface</span>
                      <div className="asc-nav-panel__settings">
                        <PublicThemeToggle compact />
                        <LanguageSwitcher
                          locale={locale}
                          labels={labels.language}
                          compact
                        />
                      </div>
                    </div>

                    <div className="asc-nav-panel__divider" />
                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="asc-nav-panel__row asc-nav-panel__row--danger"
                    >
                      {labels.actions.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="asc-nav-login">
                {labels.actions.login}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-expanded={isMenuOpen}
            className="asc-nav-menu-btn ltr:ml-auto rtl:mr-auto"
          >
            {isMenuOpen ? labels.actions.close : labels.actions.menu}
          </button>
        </nav>

        {isMenuOpen && (
          <div className="asc-nav-mobile px-6 py-5 lg:hidden">
            <div className="grid gap-1">
              {mainLinks.map((link, index) => (
                <MobileNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  index={index}
                  arrow={arrow}
                  onClick={() => setIsMenuOpen(false)}
                />
              ))}

              <div
                className="mt-4 grid gap-2 pt-4"
                style={{ borderTop: "1px solid var(--asc-line-soft)" }}
              >
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-3 px-4 py-3 text-center"
                      style={{
                        border: "1px solid var(--asc-accent-border)",
                        background: "var(--asc-accent-dim)",
                        clipPath:
                          "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
                      }}
                    >
                      <UserAvatar
                        userName={userName}
                        userImage={userImage}
                        fallbackName={labels.account.fallbackName}
                        small
                      />
                      <span
                        className="text-sm font-bold uppercase tracking-[0.08em]"
                        style={{ color: "var(--asc-fg-0)" }}
                      >
                        {labels.links.profile}
                      </span>
                    </Link>

                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="asc-nav-menu-btn justify-center"
                        >
                          {labels.links.adminPanel}
                        </Link>
                        <Link
                          href="/admin/bot"
                          onClick={() => setIsMenuOpen(false)}
                          className="px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.12em] transition"
                          style={{
                            border: "1px solid var(--asc-green-border)",
                            background: "var(--asc-green-bg)",
                            color: "var(--asc-green)",
                            clipPath:
                              "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
                          }}
                        >
                          {labels.links.botDashboard}
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.12em] transition"
                      style={{
                        border: "1px solid var(--asc-live-border)",
                        color: "var(--asc-live)",
                        clipPath:
                          "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
                      }}
                    >
                      {labels.actions.logout}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="asc-nav-menu-btn justify-center"
                  >
                    {labels.actions.login}
                  </Link>
                )}

                <Link
                  href="/discord"
                  onClick={() => setIsMenuOpen(false)}
                  className="asc-nav-discord justify-center"
                  style={{ padding: "0.85rem 1rem" }}
                >
                  {labels.actions.joinDiscord}
                </Link>

                {!isAdminPath && <PublicThemeToggle compact />}

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
              clipPath:
                "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
            }}
          >
            <span aria-hidden="true" className="asc-corner-mark" />
            <h2 className="mb-3 text-2xl" style={{ color: "var(--asc-fg-0)" }}>
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
