import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

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
  lastUpdated: string;
  effectiveDate: string;
  sections: LegalSection[];
};

const legalPages = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
];

function LegalPageTabs() {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-5">
      {legalPages.map((page) => (
        <a
          key={page.href}
          href={page.href}
          className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
        >
          {page.label}
        </a>
      ))}
    </nav>
  );
}

function TableOfContents({ sections }: { sections: LegalSection[] }) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-gray-500">
          Contents
        </p>

        <div className="grid gap-1 border-l border-white/10 pl-4">
          {sections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="group py-2 text-sm font-bold text-gray-500 transition hover:text-white"
            >
              <span className="mr-2 text-violet-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="group-hover:text-white">{section.title}</span>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}

function LegalSectionBlock({
  section,
  index,
}: {
  section: LegalSection;
  index: number;
}) {
  return (
    <section
      id={section.id}
      className="scroll-mt-28 border-b border-white/10 py-10 last:border-b-0"
    >
      <div className="grid gap-5 md:grid-cols-[90px_minmax(0,1fr)]">
        <div>
          <p className="text-sm font-black text-violet-300">
            {String(index + 1).padStart(2, "0")}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            {section.title}
          </h2>

          {section.intro && (
            <p className="mt-4 text-base leading-8 text-gray-300">
              {section.intro}
            </p>
          )}

          {section.paragraphs && section.paragraphs.length > 0 && (
            <div className="mt-5 grid gap-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-8 text-gray-400">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {section.bullets && section.bullets.length > 0 && (
            <ul className="mt-6 grid gap-3">
              {section.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="relative pl-5 text-sm leading-8 text-gray-400 before:absolute before:left-0 before:top-[13px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-violet-400"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {section.note && (
            <p className="mt-6 border-l-2 border-violet-400/60 bg-violet-500/[0.06] px-5 py-4 text-sm leading-8 text-violet-100">
              {section.note}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function LegalPolicyPage({
  title,
  description,
  lastUpdated,
  effectiveDate,
  sections,
}: LegalPolicyPageProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.13)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08)_0%,transparent_28%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-[1500px] px-6 py-20 lg:px-10 2xl:px-14">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-violet-300">
              AscendraHub Legal
            </p>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div>
                <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
                  {title}
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-gray-300">
                  {description}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                  Document information
                </p>

                <div className="mt-4 grid gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500">
                      Last updated
                    </p>
                    <p className="mt-1 text-sm font-black text-white">
                      {lastUpdated}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500">
                      Effective date
                    </p>
                    <p className="mt-1 text-sm font-black text-white">
                      {effectiveDate}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500">Contact</p>
                    <p className="mt-1 text-sm font-black text-violet-200">
                      support@ascendrahub.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1500px] gap-12 px-6 py-12 lg:px-10 xl:grid-cols-[260px_minmax(0,1fr)] 2xl:px-14">
          <TableOfContents sections={sections} />

          <article className="mx-auto w-full max-w-[980px]">
            <LegalPageTabs />

            <div className="mt-4">
              {sections.map((section, index) => (
                <LegalSectionBlock
                  key={section.id}
                  section={section}
                  index={index}
                />
              ))}
            </div>
          </article>
        </section>

        <Footer />
      </div>
    </main>
  );
}
