import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import AdminGameForm from "@/components/AdminGameForm";
import AdminGameList from "@/components/AdminGameList";
import Footer from "@/components/Footer";
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
    <main className="asc-ambient min-h-screen overflow-hidden text-white" style={{ background: "var(--asc-bg-0)" }}>
      <Navbar />

      <section className="relative min-h-[430px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/images/backgrounds/admin-hero.webp")' }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,oklch(0.06 0.03 287 / 0.92) 0%,oklch(0.06 0.03 287 / 0.66) 44%,oklch(0.06 0.03 287 / 0.82) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-44" style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }} />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-2 text-sm font-black transition hover:opacity-90"
            style={{ color: "var(--asc-fg-3)" }}
          >
            ← Back to admin
          </Link>

          <p className="mb-4 text-sm font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>
            Ascendra admin panel
          </p>

          <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight md:text-6xl" style={{ color: "var(--asc-fg-0)" }}>
            Manage Games.
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7" style={{ color: "var(--asc-fg-2)" }}>
            Add, edit, and configure games available on the Ascendra platform.
            Games are used when creating tournaments and teams.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span
              className="border px-3 py-1 font-black"
              style={{ borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }}
            >
              Admin
            </span>

            <span
              className="border px-3 py-1 font-bold"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
            >
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
    </main>
  );
}
