"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/announcements", label: "News" },
];

const footerOnlyLinks = [
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
  { href: "/roles", label: "Roles" },
  { href: "/staff", label: "Staff" },
  { href: "/stats", label: "Stats" },
];

const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#";

type NavbarClientProps = {
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
      width={small ? 32 : 40}
      height={small ? 32 : 40}
      className={`${small ? "h-8 w-8" : "h-10 w-10"} object-contain`}
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
        width={170}
        height={45}
        priority
        className="h-10 w-auto object-contain"
      />
    </Link>
  );
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
  const isActive = pathname === href;

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

export default function NavbarClient({
  isAdmin,
  isLoggedIn,
  userName,
  userImage,
}: NavbarClientProps) {
  const pathname = usePathname();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

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

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            {isLoggedIn ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((value) => !value)}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:bg-white/10"
                >
                  {userImage ? (
                    <Image
                      src={userImage}
                      alt={userName || "User"}
                      width={30}
                      height={30}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500/15">
                      <AscendraMark small />
                    </span>
                  )}

                  <span className="max-w-[120px] truncate text-sm font-bold text-white">
                    Profile
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-[#11121d] p-3 shadow-2xl shadow-black/40">
                    <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
                      {userImage ? (
                        <Image
                          src={userImage}
                          alt={userName || "User"}
                          width={36}
                          height={36}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-500/15">
                          <AscendraMark small />
                        </span>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {userName || "Ascendra Player"}
                        </p>
                        <p className="text-xs text-gray-400">Player profile</p>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                      View Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                      >
                        Admin Panel
                      </Link>
                    )}

                    <div className="my-2 border-t border-white/10" />

                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Login
              </Link>
            )}

            <a
              href={discordInvite}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
            >
              Join Discord
            </a>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-expanded={isMenuOpen}
            className="ml-auto rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 lg:hidden"
          >
            {isMenuOpen ? "Close" : "Menu"}
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
                      {userImage ? (
                        <Image
                          src={userImage}
                          alt={userName || "User"}
                          width={30}
                          height={30}
                          className="rounded-full"
                        />
                      ) : (
                        <AscendraMark small />
                      )}

                      <span className="text-sm font-bold text-gray-200">
                        Profile
                      </span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                      >
                        Admin Panel
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="rounded-xl border border-red-500/20 px-4 py-3 text-center text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Login
                  </Link>
                )}

                <a
                  href={discordInvite}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-violet-600 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-violet-500"
                >
                  Join Discord
                </a>

                <div className="mt-3 border-t border-white/10 pt-4">
                  <p className="mb-2 px-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    More pages
                  </p>

                  <div className="grid gap-2">
                    {footerOnlyLinks.map((link) => (
                      <NavLink
                        key={link.href}
                        href={link.href}
                        label={link.label}
                        onClick={() => setIsMenuOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11121d] p-6 shadow-2xl">
            <h2 className="mb-3 text-2xl font-black text-white">
              Confirm logout
            </h2>

            <p className="mb-6 leading-7 text-gray-300">
              Are you sure you want to log out of your Ascendra account?
            </p>

            <div className="grid gap-3 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-3 font-bold text-gray-300 transition hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white transition hover:bg-red-400"
              >
                Yes, logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
