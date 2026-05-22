import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export type LegalHighlight = {
  label: string;
  value: string;
};

export type LegalSection = {
  id: string;
  title: string;
  intro?: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
};

type LegalPolicyPageProps = {
  title: string;
  description: string;
  summaryTitle: string;
  summaryBody: string;
  lastUpdated: string;
  highlights: LegalHighlight[];
  sections: LegalSection[];
};

const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
];

function HighlightCard({ label, value }: LegalHighlight) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </article>
  );
}

function LegalNav({ sections }: { sections: LegalSection[] }) {
  return (
    <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 lg:sticky lg:top-24">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
        Legal pages
      </p>

      <div className="mt-4 grid gap-2">
        {legalLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-gray-300 transition hover:border-violet-400/30 hover:bg-white/10 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="my-5 h-px bg-white/10" />

      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
        On this page
      </p>

      <div className="mt-4 grid gap-2">
        {sections.map((section, index) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-xl px-3 py-2 text-sm font-bold text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <span className="mr-2 text-violet-300">
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.title}
          </a>
        ))}
      </div>
    </aside>
  );
}

function LegalSectionCard({
  section,
  index,
}: {
  section: LegalSection;
  index: number;
}) {
  return (
    <article
      id={section.id}
      className="scroll-mt-28 border-b border-white/10 px-5 py-7 last:border-b-0 md:grid md:grid-cols-[90px_minmax(0,1fr)] md:gap-6"
    >
      <p className="mb-4 text-sm font-black text-violet-300 md:mb-0">
        {String(index + 1).padStart(2, "0")}
      </p>

      <div>
        <h2 className="text-2xl font-black text-white">{section.title}</h2>

        {section.intro && (
          <p className="mt-3 text-sm leading-7 text-gray-300">
            {section.intro}
          </p>
        )}

        {section.paragraphs && section.paragraphs.length > 0 && (
          <div className="mt-4 grid gap-3">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-gray-400">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {section.bullets && section.bullets.length > 0 && (
          <ul className="mt-4 grid gap-2">
            {section.bullets.map((bullet) => (
              <li
                key={bullet}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-gray-300"
              >
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {section.note && (
          <p className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm leading-7 text-violet-100">
            {section.note}
          </p>
        )}
      </div>
    </article>
  );
}

export default function LegalPolicyPage({
  title,
  description,
  summaryTitle,
  summaryBody,
  lastUpdated,
  highlights,
  sections,
}: LegalPolicyPageProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[440px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/news-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.96)_0%,rgba(7,8,17,0.76)_50%,rgba(7,8,17,0.9)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1500px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              AscendraHub legal
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
              {title}
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-300">
              {description}
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1500px] gap-8 px-6 pb-16 lg:grid-cols-[310px_minmax(0,1fr)] lg:px-10 2xl:px-14">
          <LegalNav sections={sections} />

          <div className="grid gap-8">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                    Last updated: {lastUpdated}
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-white">
                    {summaryTitle}
                  </h2>

                  <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-400">
                    {summaryBody}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {highlights.map((highlight) => (
                    <HighlightCard
                      key={highlight.label}
                      label={highlight.label}
                      value={highlight.value}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
              {sections.map((section, index) => (
                <LegalSectionCard
                  key={section.id}
                  section={section}
                  index={index}
                />
              ))}
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/25 p-6">
              <p className="text-sm leading-7 text-gray-400">
                These pages are written for transparency and platform
                governance. They do not replace advice from a qualified lawyer.
                If AscendraHub starts paid tournaments, sponsorships, business
                operations, or a registered company, these policies should be
                reviewed and updated.
              </p>
            </section>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
