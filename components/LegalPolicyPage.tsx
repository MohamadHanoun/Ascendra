import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

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

type LegalPolicyMessages = {
  label: string;
  contents: string;
  documentInformation: string;
  lastUpdated: string;
  effectiveDate: string;
  contact: string;
  pages: {
    href: string;
    label: string;
  }[];
};

const legalPolicyMessages: Record<Locale, LegalPolicyMessages> = {
  en: {
    label: "AscendraHub Legal",
    contents: "Contents",
    documentInformation: "Document information",
    lastUpdated: "Last updated",
    effectiveDate: "Effective date",
    contact: "Contact",
    pages: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  },

  ar: {
    label: "الشؤون القانونية في AscendraHub",
    contents: "المحتويات",
    documentInformation: "معلومات المستند",
    lastUpdated: "آخر تحديث",
    effectiveDate: "تاريخ السريان",
    contact: "التواصل",
    pages: [
      { href: "/terms", label: "شروط الاستخدام" },
      { href: "/privacy", label: "سياسة الخصوصية" },
      { href: "/cookies", label: "سياسة ملفات تعريف الارتباط" },
    ],
  },
};

function LegalPageTabs({ pages }: { pages: LegalPolicyMessages["pages"] }) {
  return (
    <nav className="flex flex-wrap gap-2 pb-5" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
      {pages.map((page) => (
        <a
          key={page.href}
          href={page.href}
          className="border px-4 py-2 text-sm font-bold transition"
          style={{ border: "1px solid var(--asc-line)", background: "oklch(0.20 0.02 287 / 0.035)", color: "var(--asc-fg-2)" }}
        >
          {page.label}
        </a>
      ))}
    </nav>
  );
}

function TableOfContents({
  sections,
  label,
}: {
  sections: LegalSection[];
  label: string;
}) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>
          {label}
        </p>

        <div className="grid gap-1 pl-4" style={{ borderLeft: "1px solid var(--asc-line-soft)" }}>
          {sections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="group py-2 text-sm font-bold transition"
              style={{ color: "var(--asc-fg-3)" }}
            >
              <span className="mr-2" style={{ color: "var(--asc-accent)" }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{section.title}</span>
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
      className="scroll-mt-28 py-10 last:border-b-0"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <div className="grid gap-5 md:grid-cols-[90px_minmax(0,1fr)]">
        <div>
          <p className="text-sm font-black" style={{ color: "var(--asc-accent)" }}>
            {String(index + 1).padStart(2, "0")}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl" style={{ color: "var(--asc-fg-0)" }}>
            {section.title}
          </h2>

          {section.intro && (
            <p className="mt-4 text-base leading-8" style={{ color: "var(--asc-fg-1)" }}>
              {section.intro}
            </p>
          )}

          {section.paragraphs && section.paragraphs.length > 0 && (
            <div className="mt-5 grid gap-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-8" style={{ color: "var(--asc-fg-3)" }}>
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
                  className="relative pl-5 text-sm leading-8 before:absolute before:left-0 before:top-[13px] before:h-1.5 before:w-1.5 before:rounded-full"
                  style={{ color: "var(--asc-fg-3)", ["--tw-before-bg" as string]: "var(--asc-accent)" }}
                >
                  <span className="absolute left-0 top-[13px] h-1.5 w-1.5 rounded-full" style={{ background: "var(--asc-accent)" }} />
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {section.note && (
            <p
              className="mt-6 px-5 py-4 text-sm leading-8"
              style={{ borderLeft: "2px solid oklch(0.70 0.22 285 / 0.60)", background: "var(--asc-accent-dim)", color: "var(--asc-fg-0)" }}
            >
              {section.note}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function LegalPolicyPage({
  title,
  description,
  lastUpdated,
  effectiveDate,
  sections,
}: LegalPolicyPageProps) {
  const locale = await getLocale();
  const messages = legalPolicyMessages[locale];

  return (
    <main className="asc-public-page asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        <section style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <div className="mx-auto max-w-[1500px] px-6 py-20 lg:px-10 2xl:px-14">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.24em]" style={{ color: "var(--asc-accent)" }}>
              {messages.label}
            </p>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div>
                <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
                  {title}
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8" style={{ color: "var(--asc-fg-1)" }}>
                  {description}
                </p>
              </div>

              <div className="p-5" style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-fg-3)" }}>
                  {messages.documentInformation}
                </p>

                <div className="mt-4 grid gap-4">
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
                      {messages.lastUpdated}
                    </p>
                    <p className="mt-1 text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                      {lastUpdated}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
                      {messages.effectiveDate}
                    </p>
                    <p className="mt-1 text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                      {effectiveDate}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
                      {messages.contact}
                    </p>
                    <p className="mt-1 text-sm font-black" style={{ color: "var(--asc-accent)" }}>
                      support@ascendrahub.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1500px] gap-12 px-6 py-12 lg:px-10 xl:grid-cols-[260px_minmax(0,1fr)] 2xl:px-14">
          <TableOfContents sections={sections} label={messages.contents} />

          <article className="mx-auto w-full max-w-[980px]">
            <LegalPageTabs pages={messages.pages} />

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
