import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

export default function NotFound() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[620px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.94)_0%,rgba(7,8,17,0.72)_48%,rgba(7,8,17,0.88)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto flex min-h-[620px] max-w-[900px] flex-col items-center justify-center px-6 pb-28 pt-20 text-center lg:px-10">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-violet-300">
              404 error
            </p>

            <h1 className="text-5xl font-black uppercase leading-[1.04] tracking-tight text-white md:text-7xl">
              Page not found.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              The page you are trying to open does not exist, was moved, or is
              no longer available.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryLink href="/">Back home</PrimaryLink>
              <SecondaryLink href="/tournaments">Tournaments</SecondaryLink>
              <SecondaryLink href="/community">Community</SecondaryLink>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
