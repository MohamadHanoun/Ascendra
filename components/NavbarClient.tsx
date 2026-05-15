"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const mainLinks = [
    { href: "/", label: "Home" },
    { href: "/tournaments", label: "Tournaments" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/announcements", label: "Announcements" },
];

const moreLinks = [
    { href: "/about", label: "About" },
    { href: "/rules", label: "Rules" },
    { href: "/roles", label: "Roles" },
    { href: "/staff", label: "Staff" },
];

const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#";

type NavbarClientProps = {
    isAdmin: boolean;
};

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
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isActive
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
        >
            {label}
        </Link>
    );
}

export default function NavbarClient({ isAdmin }: NavbarClientProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const moreMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                moreMenuRef.current &&
                !moreMenuRef.current.contains(event.target as Node)
            ) {
                setIsMoreOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsMoreOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f1a]/90 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
                <Link href="/" className="flex shrink-0 items-center gap-3">
                    <Image
                        src="/logo-mark-clean.svg"
                        alt="RTN logo"
                        width={44}
                        height={44}
                        priority
                        className="rounded-xl"
                    />

                    <div className="hidden sm:block">
                        <span className="block text-lg font-black leading-none text-white">
                            RTN
                        </span>

                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                            The Noobs of Temple & Rift
                        </span>
                    </div>
                </Link>


                <div className="hidden items-center gap-2 lg:flex">
                    {mainLinks.map((link) => (
                        <NavLink key={link.href} href={link.href} label={link.label} />
                    ))}

                    <div ref={moreMenuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setIsMoreOpen((value) => !value)}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/10       hover:text-white">
                            More
                        </button>

                        {isMoreOpen && (
                            <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-white/10 bg-[#111827] p-2 shadow-2xl">
                                {moreLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMoreOpen(false)}
                                        className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                        >
                            Admin
                        </Link>
                    )}

                    <a
                        href={discordInvite}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-indigo-400"
                    >
                        Join Discord
                    </a>
                </div>

                <button
                    type="button"
                    onClick={() => setIsMenuOpen((value) => !value)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white lg:hidden"
                >
                    Menu
                </button>
            </nav>

            {isMenuOpen && (
                <div className="border-t border-white/10 bg-[#0b0f1a] px-6 py-5 lg:hidden">
                    <div className="mx-auto grid max-w-7xl gap-2">
                        {[...mainLinks, ...moreLinks].map((link) => (
                            <NavLink
                                key={link.href}
                                href={link.href}
                                label={link.label}
                                onClick={() => setIsMenuOpen(false)}
                            />
                        ))}

                        <div className="mt-3 grid gap-2 border-t border-white/10 pt-4">
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                                >
                                    Admin
                                </Link>
                            )}

                            <a
                                href={discordInvite}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl bg-indigo-500 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-indigo-400"
                            >
                                Join Discord
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}