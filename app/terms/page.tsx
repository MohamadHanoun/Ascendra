import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Terms of Service | Ascendra",
  description: "Ascendra terms of service.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#070811] text-white">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
          Legal
        </p>

        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-5xl">
          Terms of Service
        </h1>

        <div className="mt-8 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-gray-300">
          <section>
            <h2 className="text-xl font-black text-white">
              1. Use of Ascendra
            </h2>
            <p className="mt-2">
              Ascendra is a tournament platform for gaming communities. By using
              the website or Discord features, you agree to use the service
              respectfully and only for its intended purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">2. User accounts</h2>
            <p className="mt-2">
              Some features require Discord login. You are responsible for the
              activity connected to your account and team actions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">3. Tournaments</h2>
            <p className="mt-2">
              Tournament rules, registration requirements, results, and rewards
              may be updated by Ascendra administrators. Teams may be approved,
              rejected, or cancelled if requirements are not met.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">4. Discord bot</h2>
            <p className="mt-2">
              The Ascendra Discord bot may create tournament announcements,
              roles, and voice channels to support tournament management.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">5. Changes</h2>
            <p className="mt-2">
              These terms may be updated as Ascendra develops. Continued use of
              the service means you accept the latest version.
            </p>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
