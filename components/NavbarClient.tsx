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

function AscendraMark({ small = false }: { small?: boolean }) {
  return (
    <Image
      src="/images/brand/ascendra-logo-mark.png"
      alt="Ascendra"
      width={small ? 32 : 44}
      height={small ? 32 : 44}
      className={`${small ? "h-8 w-8" : "h-11 w-11"} object-contain`}
    />
  );
}

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
  if (href === "/") {
    return pathname === "/";
  }

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
      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
        isActive
          ? "bg-violet-500/20 text-violet-200 shadow shadow-violet-950/20"
          : "text-gray-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
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
      className={`grid place-items-center rounded-full bg-violet-500/15 ${
        small ? "h-8 w-8" : "h-9 w-9"
      }`}
    >
      <AscendraMark small />
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
    signOut({
      callbackUrl: "/login",
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070811]/90 backdrop-blur-xl">
        <nav className="flex w-full items-center gap-4 px-6 py-3 lg:px-10 2xl:px-14">
          <BrandLogo />

          <div className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            {mainLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>

          <div className="hidden items-center gap-3 ltr:ml-auto rtl:mr-auto lg:flex">
            {isLoggedIn ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((value) => !value)}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:bg-white/10"
                >
                  <UserAvatar
                    userName={userName}
                    userImage={userImage}
                    fallbackName={labels.account.fallbackName}
                    small
                  />

                  <span className="max-w-[120px] truncate text-sm font-bold text-white">
                    {labels.links.profile}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute mt-3 w-64 rounded-2xl border border-white/10 bg-[#11121d] p-3 shadow-2xl shadow-black/40 ltr:right-0 rtl:left-0">
                    <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
                      <UserAvatar
                        userName={userName}
                        userImage={userImage}
                        fallbackName={labels.account.fallbackName}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {userName || labels.account.fallbackName}
                        </p>

                        <p className="text-xs text-gray-400">
                          {labels.account.signedIn}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                      {labels.links.profile}
                    </Link>

                    {isAdmin && (
                      <>
                        <div className="my-2 border-t border-white/10" />

                        <Link
                          href="/admin"
                          className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                        >
                          {labels.links.adminPanel}
                        </Link>

                        <Link
                          href="/admin/bot"
                          className="block rounded-xl px-4 py-3 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/10 hover:text-white"
                        >
                          {labels.links.botDashboard}
                        </Link>
                      </>
                    )}

                    <div className="my-2 border-t border-white/10" />

                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10 rtl:text-right"
                    >
                      {labels.actions.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                {labels.actions.login}
              </Link>
            )}

            {discordInvite && (
              <a
                href={discordInvite}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
              >
                {labels.actions.joinDiscord}
              </a>
            )}

            <LanguageSwitcher locale={locale} labels={labels.language} />
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-expanded={isMenuOpen}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 ltr:ml-auto rtl:mr-auto lg:hidden"
          >
            {isMenuOpen ? labels.actions.close : labels.actions.menu}
          </button>
        </nav>

        {isMenuOpen && (
          <div className="border-t border-white/10 bg-[#070811] px-6 py-5 lg:hidden">
            <div className="grid gap-2">
              {mainLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={() => setIsMenuOpen(false)}
                />
              ))}

              <div className="mt-3 grid gap-2 border-t border-white/10 pt-4">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center"
                    >
                      <UserAvatar
                        userName={userName}
                        userImage={userImage}
                        fallbackName={labels.account.fallbackName}
                        small
                      />

                      <span className="text-sm font-bold text-gray-200">
                        {labels.links.profile}
                      </span>
                    </Link>

                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                        >
                          {labels.links.adminPanel}
                        </Link>

                        <Link
                          href="/admin/bot"
                          onClick={() => setIsMenuOpen(false)}
                          className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-center text-sm font-bold text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-500/15 hover:text-white"
                        >
                          {labels.links.botDashboard}
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="rounded-xl border border-red-500/20 px-4 py-3 text-center text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                    >
                      {labels.actions.logout}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    {labels.actions.login}
                  </Link>
                )}

                {discordInvite && (
                  <a
                    href={discordInvite}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-violet-600 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-violet-500"
                  >
                    {labels.actions.joinDiscord}
                  </a>
                )}

                <LanguageSwitcher
                  locale={locale}
                  labels={labels.language}
                  compact
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11121d] p-6 shadow-2xl">
            <h2 className="mb-3 text-2xl font-black text-white">
              {labels.account.logoutTitle}
            </h2>

            <p className="mb-6 leading-7 text-gray-300">
              {labels.account.logoutDescription}
            </p>

            <div className="grid gap-3 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-3 font-bold text-gray-300 transition hover:bg-white/10"
              >
                {labels.actions.cancel}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white transition hover:bg-red-400"
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
