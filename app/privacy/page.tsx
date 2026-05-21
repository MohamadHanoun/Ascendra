import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | Ascendra",
  description: "Ascendra privacy policy.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#070811] text-white">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
          Legal
        </p>

        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-5xl">
          Privacy Policy
        </h1>

        <div className="mt-8 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-gray-300">
          <section>
            <h2 className="text-xl font-black text-white">
              1. Data we collect
            </h2>
            <p className="mt-2">
              Ascendra may store Discord account information such as username,
              avatar, Discord ID, team membership, tournament registrations, and
              tournament results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">
              2. How data is used
            </h2>
            <p className="mt-2">
              Data is used to manage user profiles, teams, tournament
              registrations, Discord role access, tournament results, and admin
              moderation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">3. Discord bot</h2>
            <p className="mt-2">
              The Ascendra bot may use Discord IDs to assign or remove
              tournament-related roles and manage tournament voice channels.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">4. Data sharing</h2>
            <p className="mt-2">
              Ascendra does not sell user data. Data is only used for platform
              and community tournament functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">5. Contact</h2>
            <p className="mt-2">
              For privacy questions or data removal requests, contact the
              Ascendra administrators through the official Discord server.
            </p>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
