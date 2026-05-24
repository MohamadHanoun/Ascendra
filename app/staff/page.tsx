import type { Metadata } from "next";

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

function StaffRow({
  name,
  role,
  status,
  staffMemberLabel,
}: {
  name: string;
  role: string;
  status: string;
  staffMemberLabel: string;
}) {
  return (
    <article
      className="grid gap-3 px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_220px_120px] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <div>
        <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>{name}</p>
        <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>{staffMemberLabel}</p>
      </div>

      <p className="text-sm font-bold" style={{ color: "var(--asc-fg-1)" }}>{role}</p>

      <span
        className="w-fit border px-3 py-1 text-xs font-black"
        style={{ borderColor: "oklch(0.74 0.16 150 / 0.25)", background: "oklch(0.74 0.16 150 / 0.10)", color: "oklch(0.74 0.16 150)" }}
      >
        {status}
      </span>
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
    <main className="asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
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
            className="p-5 shadow-2xl shadow-black/20"
            style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_160px] md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                  {messages.summary.label}
                </p>

                <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                  {messages.summary.title}
                </h2>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                  {messages.summary.total}
                </p>

                <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                  {staffMembers.length}
                </p>
              </div>
            </div>
          </section>

          {staffMembers.length === 0 ? (
            <EmptyState
              title={messages.empty.title}
              description={messages.empty.description}
            />
          ) : (
            <section
              className="overflow-hidden shadow-2xl shadow-black/20 backdrop-blur"
              style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
            >
              <div>
                {staffMembers.map((member) => (
                  <StaffRow
                    key={member.id}
                    name={member.name}
                    role={member.role}
                    status={member.status}
                    staffMemberLabel={messages.labels.staffMember}
                  />
                ))}
              </div>
            </section>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}
