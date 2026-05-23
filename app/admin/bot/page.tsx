import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import AdminBotAutoRefresh from "@/components/AdminBotAutoRefresh";
import AdminBotCommandLogsPanel from "@/components/AdminBotCommandLogsPanel";
import AdminBotCommandInsightsPanel from "@/components/AdminBotCommandInsightsPanel";
import AdminBotControlsPanel from "@/components/AdminBotControlsPanel";
import AdminBotDashboardTabs, {
  type AdminBotDashboardSection,
} from "@/components/AdminBotDashboardTabs";
import AdminBotEventsPanel from "@/components/AdminBotEventsPanel";
import AdminBotHealthPanel from "@/components/AdminBotHealthPanel";
import AdminBotInvitePanel from "@/components/AdminBotInvitePanel";
import AdminBotMaintenancePanel from "@/components/AdminBotMaintenancePanel";
import AdminBotMessagePanel from "@/components/AdminBotMessagePanel";
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
    botSection?: string;
    commandStatus?: string;
    commandName?: string;
    commandUser?: string;
  }>;
};

const sections: AdminBotDashboardSection[] = [
  "overview",
  "messages",
  "tournaments",
  "events",
  "commands",
  "maintenance",
  "settings",
  "invite",
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
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <AdminBotAutoRefresh />

        <section className="relative min-h-[360px] overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/admin-hero.webp")',
            }}
          />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.94)_0%,rgba(7,8,17,0.70)_48%,rgba(7,8,17,0.86)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
            <Link
              href="/admin"
              className="mb-6 inline-flex rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to Admin Panel
            </Link>

            <p className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
              Bot operations
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight text-white md:text-6xl">
              Bot Dashboard
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-300">
              Manage Discord bot settings, runtime controls, and queue activity.
            </p>
          </div>
        </section>

        {params.message && (
          <AdminToast message={params.message} type={toastType} />
        )}

        <section className="relative z-[999] mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 pt-8 lg:px-10">
          <AdminBotDashboardTabs activeSection={activeSection} />

          {activeSection === "overview" && (
            <>
              <AdminBotHealthPanel />
              <AdminBotControlsPanel />
            </>
          )}

          {activeSection === "messages" && <AdminBotMessagePanel />}

          {activeSection === "tournaments" && (
            <AdminBotTournamentMessagesPanel />
          )}

          {activeSection === "events" && (
            <AdminBotEventsPanel
              statusFilter={params.botStatus}
              eventTypeFilter={params.botType}
            />
          )}

          {activeSection === "commands" && (
            <>
              <AdminBotCommandInsightsPanel />

              <AdminBotCommandLogsPanel
                statusFilter={params.commandStatus}
                commandFilter={params.commandName}
                userFilter={params.commandUser}
              />
            </>
          )}

          {activeSection === "maintenance" && <AdminBotMaintenancePanel />}

          {activeSection === "settings" && <AdminBotSettingsPanel />}

          {activeSection === "invite" && <AdminBotInvitePanel />}
        </section>

        <Footer />
      </div>
    </main>
  );
}
