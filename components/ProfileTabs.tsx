"use client";

import { useState } from "react";

import { AchievementsPanel } from "@/components/profile/AchievementsPanel";
import { HistoryPanel } from "@/components/profile/HistoryPanel";
import { OverviewPanel } from "@/components/profile/OverviewPanel";
import { TeamsPanel } from "@/components/profile/TeamsPanel";
import type { ProfileTabId, ProfileTabsProps } from "@/components/profile/types";

export function CopyLinkButton({
  label,
  copiedLabel,
  path,
}: {
  label: string;
  copiedLabel: string;
  path?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = path ? `${window.location.origin}${path}` : window.location.href;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="border px-4 py-2 text-xs font-black uppercase tracking-[0.10em] transition hover:opacity-80"
      style={{
        borderColor: copied ? "var(--asc-green-border)" : "var(--asc-line-soft)",
        color: copied ? "var(--asc-green)" : "var(--asc-fg-2)",
        background: "transparent",
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

export default function ProfileTabs(props: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");

  const tabs: { id: ProfileTabId; label: string; badge?: number }[] = [
    { id: "overview", label: props.tabLabels.overview },
    { id: "teams", label: props.tabLabels.teams, badge: props.invitations.length || undefined },
    { id: "history", label: props.tabLabels.history },
    { id: "matches", label: props.tabLabels.matches, badge: props.activeMatchesCount || undefined },
    { id: "achievements", label: props.tabLabels.achievements },
    { id: "account", label: props.tabLabels.account },
  ];

  return (
    <div className="relative z-20">
      <nav
        className="relative z-20 mb-6 flex flex-wrap"
        style={{ pointerEvents: "auto", background: "var(--asc-bg-1)" }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex w-1/3 cursor-pointer items-center justify-center gap-2 whitespace-nowrap px-2 text-[10px] tracking-[0.06em] font-black uppercase transition-colors sm:w-auto sm:justify-start sm:px-5 sm:text-xs sm:tracking-[0.12em]"
              style={{
                height: 48,
                pointerEvents: "auto",
                color: isActive ? "var(--asc-fg-0)" : "var(--asc-fg-3)",
                background: isActive ? "var(--asc-accent-dim)" : "transparent",
                borderBottom: "1px solid var(--asc-line-soft)",
                boxShadow: isActive ? "inset 0 -3px 0 var(--asc-accent)" : "none",
              }}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className="inline-flex h-[18px] min-w-[18px] items-center justify-center px-1 text-[9px] font-black"
                  style={{ background: "var(--asc-accent)", color: "#000" }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {activeTab === "overview" && (
        <OverviewPanel
          tournamentResults={props.tournamentResults}
          teams={props.teams}
          invitations={props.invitations}
          pointEvents={props.pointEvents}
          rankingPoints={props.rankingPoints}
          bestPlacement={props.bestPlacement}
          labels={props.labels}
          sectionLabels={props.sectionLabels}
          heroLabels={props.heroLabels}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === "teams" && (
        <TeamsPanel
          teams={props.teams}
          invitations={props.invitations}
          userId={props.userId}
          isGuildMember={props.isGuildMember}
          dbGames={props.dbGames}
          labels={props.labels}
          sectionLabels={props.sectionLabels}
          statuses={props.statuses}
          heroLabels={props.heroLabels}
        />
      )}
      {activeTab === "history" && (
        <HistoryPanel
          tournamentResults={props.tournamentResults}
          pointEvents={props.pointEvents}
          labels={props.labels}
          sectionLabels={props.sectionLabels}
        />
      )}
      {activeTab === "matches" && <div>{props.matchesNode}</div>}
      {activeTab === "achievements" && <AchievementsPanel sectionLabels={props.sectionLabels} />}
      {activeTab === "account" && <div>{props.accountNode}</div>}
    </div>
  );
}
