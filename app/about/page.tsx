import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

type AboutMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    title: string;
    description: string;
  };
  purpose: {
    label: string;
    title: string;
    description: string;
  };
  stats: {
    focus: string;
    focusValue: string;
    system: string;
    systemValue: string;
    tracking: string;
    trackingValue: string;
    motto: string;
    mottoValue: string;
  };
  core: {
    label: string;
    title: string;
    values: {
      title: string;
      description: string;
    }[];
  };
  cta: {
    label: string;
    title: string;
    action: string;
  };
};

const aboutMessages: Record<Locale, AboutMessages> = {
  en: {
    metadata: {
      title: "About | Ascendra",
      description: "Learn more about Ascendra.",
    },
    hero: {
      label: "Platform",
      title: "About",
      description:
        "Ascendra is built for teams, tournaments, rankings, and organized competitive play.",
    },
    purpose: {
      label: "Purpose",
      title: "Organized competitive play.",
      description:
        "The platform helps players manage teams, join tournaments, follow official results, and compete through a cleaner system.",
    },
    stats: {
      focus: "Focus",
      focusValue: "Teams",
      system: "System",
      systemValue: "Tournaments",
      tracking: "Tracking",
      trackingValue: "Results",
      motto: "Motto",
      mottoValue: "Rise",
    },
    core: {
      label: "What Ascendra does",
      title: "Core areas",
      values: [
        {
          title: "Teams",
          description:
            "Create teams, invite players, and prepare for tournaments.",
        },
        {
          title: "Tournaments",
          description:
            "Register for events, follow applications, and track results.",
        },
        {
          title: "Leaderboard",
          description: "Official points and rankings based on saved results.",
        },
        {
          title: "Community",
          description: "A cleaner place for organized competitive play.",
        },
      ],
    },
    cta: {
      label: "Start",
      title: "Join the next tournament.",
      action: "View tournaments",
    },
  },

  ar: {
    metadata: {
      title: "حول Ascendra | Ascendra",
      description: "تعرّف أكثر على Ascendra.",
    },
    hero: {
      label: "المنصة",
      title: "حول Ascendra",
      description:
        "Ascendra مبنية للفرق والبطولات ولوحة المتصدرين وتنظيم المنافسات التنافسية.",
    },
    purpose: {
      label: "مهمتنا",
      title: "منافسات منظّمة واحترافية.",
      description:
        "تساعد المنصة اللاعبين على إدارة الفرق، والانضمام إلى البطولات، ومتابعة النتائج الرسمية، والمنافسة من خلال نظام أوضح وأكثر تنظيمًا.",
    },
    stats: {
      focus: "التركيز",
      focusValue: "الفرق",
      system: "النظام",
      systemValue: "البطولات",
      tracking: "المتابعة",
      trackingValue: "النتائج",
      motto: "الشعار",
      mottoValue: "الارتقاء",
    },
    core: {
      label: "ما الذي تبنيه Ascendra",
      title: "المجالات الأساسية",
      values: [
        {
          title: "الفرق",
          description: "أنشئ الفرق، وادعُ اللاعبين، واستعد للبطولات.",
        },
        {
          title: "البطولات",
          description: "سجّل في الفعاليات، وتابع الطلبات، وراجع النتائج.",
        },
        {
          title: "لوحة المتصدرين",
          description: "نقاط وترتيبات رسمية بناءً على النتائج المحفوظة.",
        },
        {
          title: "المجتمع",
          description: "مساحة أوضح لتنظيم المنافسات واللعب التنافسي.",
        },
      ],
    },
    cta: {
      label: "ابدأ",
      title: "انضم إلى البطولة القادمة.",
      action: "عرض البطولات",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = aboutMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

function ValueRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article
      className="grid gap-2 px-5 py-4 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <h3 className="font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h3>

      <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{description}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>

      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

export default async function AboutPage() {
  const locale = await getLocale();
  const messages = aboutMessages[locale];

  return (
    <main className="asc-public-page asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,oklch(0.06 0.03 287 / 0.92) 0%,oklch(0.06 0.03 287 / 0.62) 44%,oklch(0.06 0.03 287 / 0.82) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }} />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>
              {messages.hero.label}
            </p>

            <h1 className="text-5xl font-black uppercase tracking-tight md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
              {messages.hero.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: "var(--asc-fg-1)" }}>
              {messages.hero.description}
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <section
            className="p-6 shadow-2xl shadow-black/20 backdrop-blur"
            style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                  {messages.purpose.label}
                </p>

                <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                  {messages.purpose.title}
                </h2>

                <p className="mt-4 max-w-3xl text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
                  {messages.purpose.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Stat
                  label={messages.stats.focus}
                  value={messages.stats.focusValue}
                />
                <Stat
                  label={messages.stats.system}
                  value={messages.stats.systemValue}
                />
                <Stat
                  label={messages.stats.tracking}
                  value={messages.stats.trackingValue}
                />
                <Stat
                  label={messages.stats.motto}
                  value={messages.stats.mottoValue}
                />
              </div>
            </div>
          </section>

          <section
            className="overflow-hidden shadow-2xl shadow-black/20 backdrop-blur"
            style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                {messages.core.label}
              </p>

              <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                {messages.core.title}
              </h2>
            </div>

            <div>
              {messages.core.values.map((item) => (
                <ValueRow
                  key={item.title}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </section>

          <section
            className="flex flex-col justify-between gap-4 p-6 shadow-2xl shadow-black/20 md:flex-row md:items-center"
            style={{ border: "1px solid var(--asc-line)", background: "var(--asc-accent-dim)" }}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                {messages.cta.label}
              </p>

              <h2 className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                {messages.cta.title}
              </h2>
            </div>

            <Link
              href="/tournaments"
              className="w-fit px-5 py-3 text-sm font-black text-white transition"
              style={{ background: "var(--asc-accent-2)" }}
            >
              {messages.cta.action}
            </Link>
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}
