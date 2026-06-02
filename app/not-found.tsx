import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

type NotFoundMessages = {
  label: string;
  title: string;
  description: string;
  actions: {
    home: string;
    tournaments: string;
    community: string;
  };
};

const notFoundMessages: Record<Locale, NotFoundMessages> = {
  en: {
    label: "404 error",
    title: "Page not found.",
    description:
      "The page you are trying to open does not exist, was moved, or is no longer available.",
    actions: {
      home: "Back home",
      tournaments: "Tournaments",
      community: "Community",
    },
  },

  ar: {
    label: "خطأ 404",
    title: "الصفحة غير موجودة.",
    description:
      "تعذر العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو لم تعد متاحة.",
    actions: {
      home: "العودة إلى الرئيسية",
      tournaments: "عرض البطولات",
      community: "فتح المجتمع",
    },
  },
};

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
      className="inline-flex justify-center px-6 py-3 text-sm font-black text-white shadow-lg transition hover:opacity-90"
      style={{
        background: "var(--asc-accent-2)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
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
      className="inline-flex justify-center px-6 py-3 text-sm font-black transition hover:opacity-80"
      style={{
        border: "1px solid var(--asc-line)",
        color: "var(--asc-fg-2)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      {children}
    </Link>
  );
}

export default async function NotFound() {
  const locale = await getLocale();
  const messages = notFoundMessages[locale];

  return (
    <main className="asc-public-page asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        <section className="asc-image-card relative min-h-[620px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgb(12 11 9 / 0.94) 0%,rgb(12 11 9 / 0.72) 48%,rgb(12 11 9 / 0.88) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-52" style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }} />

          <div className="relative z-10 mx-auto flex min-h-[620px] max-w-[900px] flex-col items-center justify-center px-6 pb-28 pt-20 text-center lg:px-10">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.24em]" style={{ color: "var(--asc-accent)" }}>
              {messages.label}
            </p>

            <h1 className="text-5xl font-black uppercase leading-[1.04] tracking-tight md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
              {messages.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: "var(--asc-fg-1)" }}>
              {messages.description}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryLink href="/">{messages.actions.home}</PrimaryLink>
              <SecondaryLink href="/tournaments">
                {messages.actions.tournaments}
              </SecondaryLink>
              <SecondaryLink href="/community">
                {messages.actions.community}
              </SecondaryLink>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
