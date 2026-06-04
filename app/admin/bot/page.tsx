import type { Metadata } from "next";
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
import AdminShell from "@/components/AdminShell";
import AdminToast from "@/components/AdminToast";

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
    <AdminShell
      userName={session.user.name}
      eyebrow="Bot operations"
      title="Bot Dashboard"
      description="Manage Discord bot settings, runtime controls, and queue activity."
    >
      <AdminBotAutoRefresh />

      {params.message && (
        <AdminToast message={params.message} type={toastType} />
      )}

      <section className="relative z-[999] mx-auto grid max-w-[1440px] gap-6 px-6 pb-16 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:px-10">
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
    </AdminShell>
  );
}
