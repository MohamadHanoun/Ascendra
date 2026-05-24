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
      className="relative px-4 py-2 text-sm font-bold tracking-wide transition"
      style={{ color: isActive ? "var(--asc-accent)" : "var(--asc-fg-2)" }}
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
        className="rounded-full"
      />
    );
  }

  return (
    <span
      className="grid place-items-center rounded-full"
      style={{
        width: small ? "2rem" : "2.25rem",
        height: small ? "2rem" : "2.25rem",
        background: "var(--asc-accent-dim)",
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

          <div className="hidden items-center gap-3 ltr:ml-auto rtl:mr-auto lg:flex">
            {isLoggedIn ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-3 px-3 py-2 transition"
                  style={{
                    border: "1px solid var(--asc-line-soft)",
                    background: isProfileOpen ? "var(--asc-accent-dim)" : "transparent",
                  }}
                >
                  <UserAvatar
                    userName={userName}
                    userImage={userImage}
                    fallbackName={labels.account.fallbackName}
                    small
                  />
                  <span
                    className="max-w-[120px] truncate text-sm font-bold"
                    style={{ color: "var(--asc-fg-1)" }}
                  >
                    {labels.links.profile}
                  </span>
                </button>

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
                className="px-5 py-2 text-sm font-black text-white transition"
                style={{ background: "var(--asc-accent-2)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--asc-accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--asc-accent-2)";
                }}
              >
                {labels.actions.joinDiscord}
              </a>
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
