import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SectionReveal from "@/components/SectionReveal";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RulesMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    title: string;
    description: string;
  };
  summary: {
    label: string;
    title: string;
    total: string;
  };
  empty: {
    title: string;
    description: string;
  };
};

const rulesMessages: Record<Locale, RulesMessages> = {
  en: {
    metadata: {
      title: "Rules | Ascendra",
      description: "Ascendra community rules.",
    },
    hero: {
      label: "Community",
      title: "Rules",
      description: "Clear rules for fair and organized play.",
    },
    summary: {
      label: "Community rules",
      title: "Active guidelines",
      total: "Total",
    },
    empty: {
      title: "No active rules yet",
      description: "Rules will appear here when they are published.",
    },
  },

  ar: {
    metadata: {
      title: "القواعد | Ascendra",
      description: "قواعد مجتمع Ascendra.",
    },
    hero: {
      label: "المجتمع",
      title: "القواعد",
      description: "قواعد واضحة للحفاظ على منافسة عادلة ومنظّمة.",
    },
    summary: {
      label: "قواعد المجتمع",
      title: "الإرشادات النشطة",
      total: "الإجمالي",
    },
    empty: {
      title: "لا توجد قواعد نشطة حاليًا",
      description: "ستظهر القواعد هنا عند نشرها.",
    },
  },
};

const panelClip =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = rulesMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

async function getRules() {
  return prisma.rule.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: "asc",
    },
  });
}

function CornerMark() {
  return (
    <div
      aria-hidden="true"
      className="asc-corner-mark"
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        width: 12,
        height: 12,
        borderTop: "1.5px solid var(--asc-accent)",
        borderLeft: "1.5px solid var(--asc-accent)",
        opacity: 0.9,
        pointerEvents: "none",
        zIndex: 30,
      }}
    />
  );
}

function Panel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      className={`relative overflow-hidden border shadow-2xl shadow-black/20 ${className}`}
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath: panelClip,
        ...style,
      }}
    >
      <CornerMark />
      {children}
    </section>
  );
}

function SummaryCard({
  label,
  title,
  totalLabel,
  total,
}: {
  label: string;
  title: string;
  totalLabel: string;
  total: number;
}) {
  return (
    <Panel className="p-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px] md:items-end">
        <div>
          <p
            className="asc-section-label"
          >
            ▲ {label}
          </p>

          <h2
            className="mt-2 text-3xl md:text-4xl"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {title}
          </h2>
        </div>

        <div>
          <p
            className="text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {totalLabel}
          </p>

          <p
            className="mt-2 text-5xl font-black tabular-nums"
            style={{
              color: "var(--asc-accent)",
              fontFamily: "var(--font-display)",
            }}
          >
            {total}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function RuleCard({ index, text }: { index: number; text: string }) {
  return (
    <article
      className="relative overflow-hidden border p-6"
      style={{
        borderColor: "var(--asc-line-soft)",
        background:
          "linear-gradient(135deg, var(--asc-accent-dim), var(--asc-bg-1))",
        clipPath: panelClip,
      }}
    >
      <CornerMark />

      <div className="grid gap-5 md:grid-cols-[110px_minmax(0,1fr)] md:items-start">
        <p
          className="text-6xl font-black leading-none tabular-nums"
          style={{
            color: "var(--asc-accent)",
            fontFamily: "var(--font-display)",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </p>

        <p className="text-base leading-8" style={{ color: "var(--asc-fg-1)" }}>
          {text}
        </p>
      </div>
    </article>
  );
}

export default async function RulesPage() {
  const [rules, locale] = await Promise.all([getRules(), getLocale()]);
  const messages = rulesMessages[locale];

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="asc-image-hero relative min-h-[460px] overflow-hidden">
          <div
            className="asc-hero-media absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div
            className="asc-hero-overlay absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, rgb(12 11 9 / 0.28) 0%, rgb(12 11 9 / 0.65) 54%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(12 11 9 / 0.45) 42%, transparent 74%)",
              ].join(", "),
            }}
          />

          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />

          <div className="asc-image-hero-content relative z-10 mx-auto max-w-[1680px] px-6 pb-32 pt-24 lg:px-10 2xl:px-14">
            <p
              className="asc-section-label mb-4"
            >
              ▲ {messages.hero.label}
            </p>

            <h1
              className="max-w-5xl text-5xl md:text-7xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {messages.hero.title}
            </h1>

            <p
              className="mt-5 max-w-2xl text-base leading-7"
              style={{ color: "var(--asc-fg-2)" }}
            >
              {messages.hero.description}
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-20 lg:px-10 2xl:px-14">
          <SectionReveal>
            <SummaryCard
              label={messages.summary.label}
              title={messages.summary.title}
              totalLabel={messages.summary.total}
              total={rules.length}
            />
          </SectionReveal>

          {rules.length === 0 ? (
            <EmptyState
              title={messages.empty.title}
              description={messages.empty.description}
            />
          ) : (
            <SectionReveal delay={0.08}>
              <section className="grid gap-4">
                {rules.map((rule, index) => (
                  <RuleCard key={rule.id} text={rule.text} index={index} />
                ))}
              </section>
            </SectionReveal>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}
