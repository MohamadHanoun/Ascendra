import type { Metadata } from "next";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Cookie Policy | Ascendra",
  description: "Ascendra cookie policy.",
};

const sections = [
  {
    title: "What cookies are",
    description:
      "Cookies are small files stored in your browser to help websites remember information and provide essential functionality.",
  },
  {
    title: "How Ascendra uses cookies",
    description:
      "Ascendra may use cookies or similar storage for login sessions, authentication, security, user preferences, and basic website functionality.",
  },
  {
    title: "Discord login",
    description:
      "When you sign in with Discord, authentication cookies may be used to keep you logged in and connect your Discord account with your Ascendra profile.",
  },
  {
    title: "Managing cookies",
    description:
      "You can clear or block cookies in your browser settings. Some Ascendra features, such as login and profile management, may not work correctly if required cookies are disabled.",
  },
  {
    title: "Updates",
    description:
      "This cookie policy may be updated as Ascendra develops and new platform features are added.",
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

export default function CookiesPage() {
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
              Cookie Policy
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              How Ascendra uses cookies and similar browser storage for login
              and core website features.
            </p>
          </div>
        </section>

        <section className="relative -mt-14 mx-auto grid max-w-[1200px] gap-8 px-6 pb-16 lg:px-10">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
              Summary
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Cookies support login and basic functionality.
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">
              Required cookies or similar storage may be needed for
              authentication, sessions, and core platform features.
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
