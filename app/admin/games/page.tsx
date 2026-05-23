import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import AdminGameForm from "@/components/AdminGameForm";
import AdminGameList from "@/components/AdminGameList";
import { DiscordLoginButton, LogoutButton } from "@/components/AuthButtons";
import Footer from "@/components/Footer";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Games | Admin | Ascendra",
  description: "Manage games available on the Ascendra platform.",
};

export default async function AdminGamesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/admin-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.66)_44%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
            <Link
              href="/admin"
              className="mb-6 inline-flex items-center gap-2 text-sm font-black text-gray-400 transition hover:text-violet-300"
            >
              ← Back to admin
            </Link>

            <p className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
              Ascendra admin panel
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight text-white md:text-6xl">
              Manage Games.
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-300">
              Add, edit, and configure games available on the Ascendra platform.
              Games are used when creating tournaments and teams.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 font-black text-emerald-300">
                Admin
              </span>

              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 font-bold text-gray-300">
                {session.user.name}
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
          <AdminGameForm />
          <AdminGameList />
        </section>

        <Footer />
      </div>
    </main>
  );
}
