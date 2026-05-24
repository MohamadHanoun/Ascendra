import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import LoginWithDiscordButton from "@/components/LoginWithDiscordButton";
import Navbar from "@/components/Navbar";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

type LoginMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    title: string;
    description: string;
    pills: string[];
  };
  card: {
    label: string;
    title: string;
    description: string;
    button: string;
    note: string;
  };
};

const loginMessages: Record<Locale, LoginMessages> = {
  en: {
    metadata: {
      title: "Login | Ascendra",
      description: "Login to Ascendra with Discord.",
    },
    hero: {
      label: "Ascendra login",
      title: "Login with Discord.",
      description:
        "Access your profile, teams, invitations, registrations, and tournament progress with one Discord login.",
      pills: ["Profile", "Teams", "Tournaments", "Leaderboard"],
    },
    card: {
      label: "Secure access",
      title: "Continue to Ascendra",
      description:
        "Discord connects your account to team management and tournament registration.",
      button: "Login with Discord",
      note: "After login, Ascendra checks your Discord identity and sends you to your profile.",
    },
  },

  ar: {
    metadata: {
      title: "تسجيل الدخول | Ascendra",
      description: "سجّل الدخول إلى Ascendra عبر Discord.",
    },
    hero: {
      label: "تسجيل الدخول إلى Ascendra",
      title: "سجّل الدخول عبر Discord.",
      description:
        "ادخل إلى ملفك الشخصي، فرقك، الدعوات، التسجيلات، وتقدمك في البطولات من خلال تسجيل دخول واحد عبر Discord.",
      pills: ["الملف الشخصي", "الفرق", "البطولات", "لوحة المتصدرين"],
    },
    card: {
      label: "وصول آمن",
      title: "المتابعة إلى Ascendra",
      description: "يربط Discord حسابك بإدارة الفرق والتسجيل في البطولات.",
      button: "تسجيل الدخول عبر Discord",
      note: "بعد تسجيل الدخول، تتحقق Ascendra من هويتك في Discord ثم تنقلك إلى ملفك الشخصي.",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = loginMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="border px-3 py-1 text-xs font-black"
      style={{
        border: "1px solid var(--asc-line)",
        background: "var(--asc-accent-dim)",
        color: "var(--asc-fg-1)",
      }}
    >
      {children}
    </span>
  );
}

export default async function LoginPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const messages = loginMessages[locale];

  if (session?.user?.databaseId) {
    redirect("/profile");
  }

  return (
    <main className="asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[650px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,oklch(0.06 0.03 287 / 0.92) 0%,oklch(0.06 0.03 287 / 0.66) 44%,oklch(0.06 0.03 287 / 0.82) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-48" style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }} />

          <div className="relative z-10 mx-auto grid min-h-[650px] max-w-[1440px] gap-10 px-6 pb-28 pt-20 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-10">
            <section>
              <p className="mb-5 text-sm font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>
                {messages.hero.label}
              </p>

              <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
                {messages.hero.title}
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7" style={{ color: "var(--asc-fg-1)" }}>
                {messages.hero.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {messages.hero.pills.map((pill) => (
                  <Pill key={pill}>{pill}</Pill>
                ))}
              </div>
            </section>

            <section
              className="p-6 shadow-2xl shadow-black/30 backdrop-blur"
              style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                {messages.card.label}
              </p>

              <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                {messages.card.title}
              </h2>

              <p className="mt-3 text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
                {messages.card.description}
              </p>

              <div className="mt-6">
                <LoginWithDiscordButton label={messages.card.button} />
              </div>

              <p className="mt-5 text-xs leading-5" style={{ color: "var(--asc-fg-3)" }}>
                {messages.card.note}
              </p>
            </section>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
