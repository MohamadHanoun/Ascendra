import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StaffMessages = {
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
  labels: {
    staffMember: string;
  };
  empty: {
    title: string;
    description: string;
  };
};

const staffMessages: Record<Locale, StaffMessages> = {
  en: {
    metadata: {
      title: "Staff | Ascendra",
      description: "Ascendra staff members.",
    },
    hero: {
      label: "Community",
      title: "Staff",
      description: "People helping manage Ascendra and keep events organized.",
    },
    summary: {
      label: "Staff team",
      title: "Active staff",
      total: "Total",
    },
    labels: {
      staffMember: "Ascendra staff",
    },
    empty: {
      title: "No active staff yet",
      description: "Staff members will appear here when they are published.",
    },
  },

  ar: {
    metadata: {
      title: "الفريق | Ascendra",
      description: "أعضاء فريق Ascendra.",
    },
    hero: {
      label: "المجتمع",
      title: "الفريق",
      description:
        "الأشخاص الذين يساعدون في إدارة Ascendra والحفاظ على تنظيم الفعاليات.",
    },
    summary: {
      label: "فريق الإدارة",
      title: "الأعضاء النشطون",
      total: "الإجمالي",
    },
    labels: {
      staffMember: "فريق Ascendra",
    },
    empty: {
      title: "لا يوجد أعضاء فريق نشطون حاليًا",
      description: "سيظهر أعضاء الفريق هنا عند نشرهم.",
    },
  },
};

const panelClip =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = staffMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

async function getStaffMembers() {
  return prisma.staffMember.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: "asc",
    },
  });
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarHue(name: string) {
  let hue = 0;

  for (const character of name) {
    hue = (hue << 5) - hue + character.charCodeAt(0);
  }

  return Math.abs(hue) % 360;
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

function StaffAvatar({ name }: { name: string }) {
  const hue = getAvatarHue(name);

  return (
    <div
      className="grid h-16 w-16 shrink-0 place-items-center"
      style={{
        background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.30 0.16 ${
          hue + 40
        }))`,
        clipPath:
          "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
        boxShadow: `inset 0 0 0 1px oklch(0.75 0.20 ${hue} / 0.35)`,
      }}
    >
      <span
        className="text-xl font-black uppercase"
        style={{ color: "white", fontFamily: "var(--font-display)" }}
      >
        {getInitials(name)}
      </span>
    </div>
  );
}

function StaffCard({
  name,
  role,
  status,
  staffMemberLabel,
  index,
}: {
  name: string;
  role: string;
  status: string;
  staffMemberLabel: string;
  index: number;
}) {
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

      <div
        aria-hidden="true"
        className="absolute -right-5 -top-6 text-[120px] font-black leading-none"
        style={{
          color: "oklch(1 0 0 / 0.035)",
          fontFamily: "var(--font-display)",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="relative z-10 flex items-start gap-5">
        <StaffAvatar name={name} />

        <div className="min-w-0">
          <p
            className="text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            {staffMemberLabel}
          </p>

          <h2
            className="mt-2 truncate text-2xl md:text-3xl"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {name}
          </h2>

          <p
            className="mt-2 text-sm font-black uppercase tracking-[0.1em]"
            style={{ color: "var(--asc-fg-2)" }}
          >
            {role}
          </p>

          <span
            className="mt-5 inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
            style={{
              borderColor: "var(--asc-green-border)",
              background: "var(--asc-green-bg)",
              color: "var(--asc-green)",
            }}
          >
            {status}
          </span>
        </div>
      </div>
    </article>
  );
}

export default async function StaffPage() {
  const [staffMembers, locale] = await Promise.all([
    getStaffMembers(),
    getLocale(),
  ]);

  const messages = staffMessages[locale];

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
          <SummaryCard
            label={messages.summary.label}
            title={messages.summary.title}
            totalLabel={messages.summary.total}
            total={staffMembers.length}
          />

          {staffMembers.length === 0 ? (
            <EmptyState
              title={messages.empty.title}
              description={messages.empty.description}
            />
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {staffMembers.map((member, index) => (
                <StaffCard
                  key={member.id}
                  name={member.name}
                  role={member.role}
                  status={member.status}
                  staffMemberLabel={messages.labels.staffMember}
                  index={index}
                />
              ))}
            </section>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}
