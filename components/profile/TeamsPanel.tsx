import Link from "next/link";

import { CreateTeamForm } from "@/components/profile/CreateTeamForm";
import { InviteResponseButton } from "@/components/profile/InviteResponseButton";
import { Card, StatusBadge, getCount } from "@/components/profile/shared";
import type {
  Game,
  Invitation,
  ProfileLabels,
  ProfileSectionLabels,
  ProfileStatuses,
  Team,
} from "@/components/profile/types";

export function TeamsPanel({
  teams,
  invitations,
  userId,
  isGuildMember,
  dbGames,
  labels,
  sectionLabels,
  statuses,
}: {
  teams: Team[];
  invitations: Invitation[];
  userId: string;
  isGuildMember: boolean;
  dbGames: Game[];
  labels: ProfileLabels;
  sectionLabels: ProfileSectionLabels;
  statuses: ProfileStatuses;
}) {
  return (
    <div className="grid gap-6">
      {/* Page header — title, short description, single create action */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="asc-profile-section-title" style={{ marginTop: 0 }}>
            {sectionLabels.myTeams}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {sectionLabels.teamsLead}
          </p>
        </div>
        {isGuildMember && (
          <Link
            href="#create-team"
            className="asc-profile-action shrink-0 px-5 py-2.5 text-xs tracking-[0.10em]"
          >
            {labels.createTeam} +
          </Link>
        )}
      </header>

      {/* Invitations — only when there are pending ones; accept/decline preserved */}
      {invitations.length > 0 && (
        <Card>
          <div className="asc-profile-card-header">
            <p className="asc-profile-eyebrow">{sectionLabels.invitations}</p>
            <h3 className="asc-profile-section-title">{sectionLabels.teamInvitations}</h3>
          </div>
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="asc-profile-row flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
            >
              <div className="min-w-0">
                <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>{inv.team.name}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                  {inv.team.game?.name ?? "—"} · {inv.team.members.length}{" "}
                  {getCount(inv.team.members.length, labels.member, labels.members)}{" "}
                  · {labels.by} {inv.invitedBy.displayName?.trim() || inv.invitedBy.username}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <InviteResponseButton inviteId={inv.id} response="accepted" teamName={inv.team.name} labels={labels} />
                <InviteResponseButton inviteId={inv.id} response="rejected" teamName={inv.team.name} labels={labels} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Team list as compact rows, or a polished empty state */}
      {teams.length === 0 ? (
        <div className="asc-profile-empty">
          <span className="asc-profile-empty__mark" aria-hidden="true">
            ▲
          </span>
          <p className="asc-profile-empty__title">{sectionLabels.noTeamsTitle}</p>
          <p className="asc-profile-empty__text">{sectionLabels.noTeamsDescription}</p>
        </div>
      ) : (
        <Card>
          {teams.map((team) => {
            const membership = team.members.find((m) => m.userId === userId);
            const isLeader = team.leaderId === userId;
            const memberCount = team.members.length;
            return (
              <div
                key={team.id}
                className="asc-profile-row flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-base font-black leading-tight"
                    style={{ color: "var(--asc-fg-0)", fontFamily: "var(--font-display)" }}
                  >
                    {team.name}
                  </p>
                  <div
                    className="mt-1.5 flex flex-wrap items-center gap-2 text-xs"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    <span
                      className="asc-profile-pill inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]"
                      style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)" }}
                    >
                      {team.game?.name ?? "—"}
                    </span>
                    <span>
                      {memberCount} {getCount(memberCount, labels.member, labels.members)} ·{" "}
                      <span style={{ color: isLeader ? "var(--asc-accent)" : "var(--asc-fg-3)" }}>
                        {isLeader ? labels.leader : (membership?.role ?? statuses.member)}
                      </span>
                    </span>
                  </div>
                  {team.rejectionReason && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--asc-live)" }}>{team.rejectionReason}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={team.status} statuses={statuses} />
                  <Link
                    href={`/profile/teams/${team.id}`}
                    className="asc-profile-action px-4 py-2 text-xs tracking-[0.08em]"
                  >
                    {labels.open}
                  </Link>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* Create team — separated section, does not dominate the page */}
      <div id="create-team" className="scroll-mt-24">
        <Card>
          <div className="asc-profile-card-header">
            <p className="asc-profile-eyebrow">{sectionLabels.createTeam}</p>
            <h3 className="asc-profile-section-title">{sectionLabels.startNewTeam}</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
              {isGuildMember ? sectionLabels.createTeamMeta : sectionLabels.discordRequiredMeta}
            </p>
          </div>
          {isGuildMember ? (
            <CreateTeamForm dbGames={dbGames} labels={labels} />
          ) : (
            <div className="p-5">
              <div className="asc-profile-alert p-4">
                <p className="font-black" style={{ color: "var(--asc-accent)" }}>{labels.ascendraDiscordRequired}</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>{labels.discordRequiredDescription}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
