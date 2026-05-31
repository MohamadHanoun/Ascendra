import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import AdminBotAutoRefresh from "@/components/AdminBotAutoRefresh";
import AdminBotCommandLogsPanel from "@/components/AdminBotCommandLogsPanel";
import AdminBotDashboardTabs, {
  type AdminBotDashboardSection,
} from "@/components/AdminBotDashboardTabs";
import AdminBotEventsPanel from "@/components/AdminBotEventsPanel";
import AdminBotInvitePanel from "@/components/AdminBotInvitePanel";
import AdminBotMaintenancePanel from "@/components/AdminBotMaintenancePanel";
import AdminBotMessagePanel from "@/components/AdminBotMessagePanel";
import AdminBotOverviewPanel from "@/components/AdminBotOverviewPanel";
import AdminBotQueuePanel from "@/components/AdminBotQueuePanel";
import AdminBotSettingsPanel from "@/components/AdminBotSettingsPanel";
import AdminBotTournamentMessagesPanel from "@/components/AdminBotTournamentMessagesPanel";
import AdminToast from "@/components/AdminToast";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bot Dashboard | Ascendra",
  description: "Ascendra Discord bot operations dashboard.",
};

type AdminBotPageProps = {
  searchParams: Promise<{
    message?: string;
    type?: string;
    botStatus?: string;
    botType?: string;
    botEventSearch?: string;
    botSection?: string;
    botEventPage?: string;
    commandStatus?: string;
    commandName?: string;
    commandUser?: string;
    commandPage?: string;
  }>;
};

const sections: AdminBotDashboardSection[] = [
  "overview",
  "queue",
  "events",
  "commands",
  "messages",
  "tournaments",
  "settings",
  "maintenance",
];

function getActiveSection(value?: string): AdminBotDashboardSection {
  if (sections.includes(value as AdminBotDashboardSection)) {
    return value as AdminBotDashboardSection;
  }

  return "overview";
}

export default async function AdminBotPage({
  searchParams,
}: AdminBotPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const toastType = params.type === "error" ? "error" : "success";
  const activeSection = getActiveSection(params.botSection);

  return (
    <main
      className="asc-admin-page min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)" }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "var(--asc-admin-ambient)" }}
      />

      <div className="relative z-10">
        <Navbar />

        <AdminBotAutoRefresh />

        <section className="asc-admin-hero relative min-h-[360px] overflow-hidden">
          <div
            className="asc-admin-hero-image pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/admin-hero.webp")',
            }}
          />
          <div className="asc-admin-hero-overlay pointer-events-none absolute inset-0" />
          <div className="asc-admin-hero-bottom pointer-events-none absolute inset-x-0 bottom-0 h-32" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
            <Link
              href="/admin"
              className="mb-6 inline-flex border px-4 py-2 text-sm font-black transition hover:opacity-80"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-2)",
                color: "var(--asc-fg-2)",
              }}
            >
              ← Back to Admin Panel
            </Link>

            <p
              className="mb-4 text-sm font-black uppercase tracking-[0.22em]"
              style={{ color: "var(--asc-accent)" }}
            >
              Bot operations
            </p>

            <h1
              className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight md:text-6xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              Bot Dashboard
            </h1>

            <p
              className="mt-5 max-w-3xl text-base leading-7"
              style={{ color: "var(--asc-fg-2)" }}
            >
              Manage Discord bot settings, runtime controls, and queue activity.
            </p>
          </div>
        </section>

        {params.message && (
          <AdminToast message={params.message} type={toastType} />
        )}

        <section className="relative z-[999] mx-auto grid max-w-[1440px] gap-6 px-6 pb-16 pt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:px-10">
          <AdminBotDashboardTabs activeSection={activeSection} />

          <div className="grid min-w-0 gap-6">
            {activeSection === "overview" && <AdminBotOverviewPanel />}

            {activeSection === "queue" && <AdminBotQueuePanel />}

            {activeSection === "events" && (
              <AdminBotEventsPanel
                statusFilter={params.botStatus}
                eventTypeFilter={params.botType}
                searchFilter={params.botEventSearch}
                page={params.botEventPage}
              />
            )}

            {activeSection === "commands" && (
              <AdminBotCommandLogsPanel
                statusFilter={params.commandStatus}
                commandFilter={params.commandName}
                userFilter={params.commandUser}
                page={params.commandPage}
              />
            )}

            {activeSection === "messages" && <AdminBotMessagePanel />}

            {activeSection === "tournaments" && (
              <AdminBotTournamentMessagesPanel />
            )}

            {activeSection === "settings" && (
              <>
                <AdminBotSettingsPanel />
                <AdminBotInvitePanel />
              </>
            )}

            {activeSection === "maintenance" && <AdminBotMaintenancePanel />}
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
