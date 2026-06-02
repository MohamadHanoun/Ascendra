import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import LoginWithDiscordButton from "@/components/LoginWithDiscordButton";
import Navbar from "@/components/Navbar";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

export const dynamic = "force-dynamic";

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

const panelClip =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

const buttonClip =
  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = loginMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
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
      className={`relative overflow-hidden border shadow-2xl shadow-black/25 ${className}`}
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

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
      style={{
        borderColor: "var(--asc-accent-border)",
        background: "var(--asc-accent-dim)",
        color: "var(--asc-fg-1)",
        clipPath: buttonClip,
      }}
    >
      {children}
    </span>
  );
}

function FeatureCard({ number, title }: { number: string; title: string }) {
  return (
    <div
      className="relative overflow-hidden border p-4"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-card-muted)",
        clipPath: panelClip,
      }}
    >
      <CornerMark />

      <p
        className="text-3xl font-black tabular-nums"
        style={{
          color: "var(--asc-accent)",
          fontFamily: "var(--font-display)",
        }}
      >
        {number}
      </p>

      <p
        className="mt-2 text-xs font-black uppercase tracking-[0.12em]"
        style={{ color: "var(--asc-fg-2)" }}
      >
        {title}
      </p>
    </div>
  );
}

function DiscordGlyph() {
  return (
    <div
      className="grid h-14 w-14 shrink-0 place-items-center"
      style={{
        background: "linear-gradient(135deg, #b8893d, #8f642f)",
        clipPath:
          "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
        boxShadow: "0 0 24px rgba(184, 137, 61, 0.36)",
      }}
    >
      <svg
        width="28"
        height="22"
        viewBox="0 0 24 18"
        fill="#ffffff"
        aria-hidden="true"
      >
        <path d="M20.3 1.8a18 18 0 0 0-4.5-1.4l-.2.4c1.6.3 3 .9 4.3 1.7-1.6-.9-3.4-1.4-5.3-1.4S10.9.6 9.3 1.5c1.3-.8 2.7-1.4 4.3-1.7l-.2-.4A18 18 0 0 0 8.9 1.8C5.7 6.7 4.9 11.4 5.3 16c1.8 1.3 3.6 2 5.4 2.5l.4-.6a11 11 0 0 1-2.2-1.1c.2-.1.4-.2.5-.3 4.1 1.9 8.5 1.9 12.5 0 .2.1.4.2.5.3-.7.4-1.4.8-2.2 1.1l.4.6c1.8-.5 3.6-1.2 5.4-2.5.5-5.4-.8-10-2.7-14.2zM9.7 13.5c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2zm6.6 0c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2z" />
      </svg>
    </div>
  );
}

export default async function LoginPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const messages = loginMessages[locale];

  if (session?.user?.databaseId) {
    redirect("/profile");
  }

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="asc-image-hero relative min-h-[720px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, rgb(12 11 9 / 0.26) 0%, rgb(12 11 9 / 0.64) 54%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(12 11 9 / 0.42) 42%, transparent 74%)",
              ].join(", "),
            }}
          />

          <div
            className="absolute inset-x-0 bottom-0 h-52"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />

          <div className="relative z-10 mx-auto grid min-h-[720px] max-w-[1440px] gap-10 px-6 pb-32 pt-24 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:px-10">
            <section>
              <p
                className="mb-5 text-xs font-black uppercase tracking-[0.22em]"
                style={{ color: "var(--asc-accent)" }}
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
                className="mt-6 max-w-2xl text-base leading-7"
                style={{ color: "var(--asc-fg-2)" }}
              >
                {messages.hero.description}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {messages.hero.pills.map((pill) => (
                  <Pill key={pill}>{pill}</Pill>
                ))}
              </div>

              <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {messages.hero.pills.map((pill, index) => (
                  <FeatureCard
                    key={pill}
                    number={String(index + 1).padStart(2, "0")}
                    title={pill}
                  />
                ))}
              </div>
            </section>

            <Panel
              className="p-6 backdrop-blur md:p-7"
              style={{
                background:
                  "linear-gradient(135deg, var(--asc-card-muted), var(--asc-bg-1))",
              }}
            >
              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <DiscordGlyph />

                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.18em]"
                      style={{ color: "var(--asc-accent)" }}
                    >
                      ▲ {messages.card.label}
                    </p>

                    <h2
                      className="mt-2 text-3xl md:text-4xl"
                      style={{ color: "var(--asc-fg-0)" }}
                    >
                      {messages.card.title}
                    </h2>
                  </div>
                </div>

                <p
                  className="mt-6 text-sm leading-7"
                  style={{ color: "var(--asc-fg-2)" }}
                >
                  {messages.card.description}
                </p>

                <div className="mt-7">
                  <LoginWithDiscordButton label={messages.card.button} />
                </div>

                <div
                  className="mt-6 border p-4"
                  style={{
                    borderColor: "var(--asc-line-soft)",
                    background: "var(--asc-card-muted)",
                    clipPath: panelClip,
                  }}
                >
                  <p
                    className="text-xs leading-6"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    {messages.card.note}
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
