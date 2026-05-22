import type { Metadata } from "next";

import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RolesMessages = {
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

const rolesMessages: Record<Locale, RolesMessages> = {
  en: {
    metadata: {
      title: "Roles | Ascendra",
      description: "Ascendra community roles.",
    },
    hero: {
      label: "Community",
      title: "Roles",
      description: "Public roles and responsibilities inside the community.",
    },
    summary: {
      label: "Community roles",
      title: "Active roles",
      total: "Total",
    },
    empty: {
      title: "No active roles yet",
      description: "Roles will appear here when they are published.",
    },
  },

  ar: {
    metadata: {
      title: "الأدوار | Ascendra",
      description: "أدوار مجتمع Ascendra.",
    },
    hero: {
      label: "المجتمع",
      title: "الأدوار",
      description: "الأدوار العامة والمسؤوليات داخل المجتمع.",
    },
    summary: {
      label: "أدوار المجتمع",
      title: "الأدوار النشطة",
      total: "الإجمالي",
    },
    empty: {
      title: "لا توجد أدوار نشطة حاليًا",
      description: "ستظهر الأدوار هنا عند نشرها.",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = rolesMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

async function getRoles() {
  return prisma.role.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: "asc",
    },
  });
}

function RoleRow({
  name,
  color,
  description,
}: {
  name: string;
  color: string;
  description: string;
}) {
  return (
    <article className="grid gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{
            backgroundColor: color,
          }}
        />

        <p className="truncate font-black text-white">{name}</p>
      </div>

      <p className="text-sm leading-6 text-gray-400">{description}</p>
    </article>
  );
}

export default async function RolesPage() {
  const [roles, locale] = await Promise.all([getRoles(), getLocale()]);
  const messages = rolesMessages[locale];

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_44%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              {messages.hero.label}
            </p>

            <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
              {messages.hero.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              {messages.hero.description}
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_160px] md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  {messages.summary.label}
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  {messages.summary.title}
                </h2>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
                  {messages.summary.total}
                </p>

                <p className="mt-1 text-2xl font-black text-white">
                  {roles.length}
                </p>
              </div>
            </div>
          </section>

          {roles.length === 0 ? (
            <EmptyState
              title={messages.empty.title}
              description={messages.empty.description}
            />
          ) : (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
              <div>
                {roles.map((role) => (
                  <RoleRow
                    key={role.id}
                    name={role.name}
                    color={role.color}
                    description={role.description}
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
