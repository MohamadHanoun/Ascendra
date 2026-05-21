import type { Metadata } from "next";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | Ascendra",
  description: "Ascendra privacy policy.",
};

const sections = [
  {
    title: "Data we collect",
    description:
      "Ascendra may store Discord account information such as username, avatar, Discord ID, team membership, tournament registrations, and tournament results.",
  },
  {
    title: "How data is used",
    description:
      "Data is used to manage profiles, teams, tournament registrations, Discord role access, tournament results, and admin moderation.",
  },
  {
    title: "Discord bot",
    description:
      "The Ascendra bot may use Discord IDs to assign or remove tournament-related roles and manage tournament voice channels.",
  },
  {
    title: "Data sharing",
    description:
      "Ascendra does not sell user data. Data is used for platform and community tournament functionality.",
  },
  {
    title: "Contact",
    description:
      "For privacy questions or data removal requests, contact Ascendra administrators through the official Discord server.",
  },
];

function LegalSection({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <article className="grid gap-3 border-b border-white/10 px-5 py-5 last:border-b-0 md:grid-cols-[80px_minmax(0,1fr)]">
      <p className="text-sm font-black text-violet-300">
        {String(index + 1).padStart(2, "0")}
      </p>

      <div>
        <h2 className="text-xl font-black text-white">{title}</h2>

        <p className="mt-2 text-sm leading-7 text-gray-400">{description}</p>
      </div>
    </article>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[360px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.94)_0%,rgba(7,8,17,0.70)_48%,rgba(7,8,17,0.86)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1200px] px-6 pb-24 pt-20 lg:px-10">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Legal
            </p>

            <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-6xl">
              Privacy Policy
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              How Ascendra handles account, team, tournament, and Discord
              integration data.
            </p>
          </div>
        </section>

        <section className="relative -mt-14 mx-auto grid max-w-[1200px] gap-8 px-6 pb-16 lg:px-10">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
              Summary
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Data is used for platform functionality.
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">
              Ascendra uses user and team data to support login, team
              management, tournament registration, Discord access, and official
              results.
            </p>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
            {sections.map((section, index) => (
              <LegalSection
                key={section.title}
                index={index}
                title={section.title}
                description={section.description}
              />
            ))}
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}
