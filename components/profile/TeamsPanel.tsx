import Link from "next/link";

import { CreateTeamForm } from "@/components/profile/CreateTeamForm";
import { InviteResponseButton } from "@/components/profile/InviteResponseButton";
import { Card, StatusBadge, getCount } from "@/components/profile/shared";
import type {
  Game,
  Invitation,
  ProfileHeroLabels,
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
  heroLabels,
}: {
  teams: Team[];
  invitations: Invitation[];
  userId: string;
  isGuildMember: boolean;
  dbGames: Game[];
  labels: ProfileLabels;
  sectionLabels: ProfileSectionLabels;
  statuses: ProfileStatuses;
  heroLabels: ProfileHeroLabels;
}) {
  return (
    <div className="grid gap-6">
      {invitations.length > 0 && (
        <Card>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
              ▲ {sectionLabels.invitations}
            </p>
            <h3
              className="mt-1 text-xl font-black uppercase"
              style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {sectionLabels.teamInvitations}
            </h3>
          </div>
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center"
              style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
            >
              <div>
                <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>{inv.team.name}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                  {inv.team.game?.name ?? "—"} · {inv.team.members.length}{" "}
                  {getCount(inv.team.members.length, labels.member, labels.members)}{" "}
                  · {labels.by} {inv.invitedBy.displayName?.trim() || inv.invitedBy.username}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <InviteResponseButton inviteId={inv.id} response="accepted" teamName={inv.team.name} labels={labels} />
                <InviteResponseButton inviteId={inv.id} response="rejected" teamName={inv.team.name} labels={labels} />
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
            ▲ {sectionLabels.myTeams}
          </p>
          <h3
            className="mt-1 text-xl font-black uppercase"
            style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {sectionLabels.myTeams} · {teams.length}{" "}
            {getCount(teams.length, heroLabels.team, heroLabels.teams)}
          </h3>
        </div>
        {teams.length === 0 ? (
          <div className="p-5">
            <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>{sectionLabels.noTeamsTitle}</p>
            <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>{sectionLabels.noTeamsDescription}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2">
            {teams.map((team) => {
              const membership = team.members.find((m) => m.userId === userId);
              const isLeader = team.leaderId === userId;
              return (
                <article
                  key={team.id}
                  className="relative border-b p-5 transition"
                  style={{ borderColor: "var(--asc-line-soft)" }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute", top: 9, left: 9,
                      width: 8, height: 8,
                      borderTop: "1px solid var(--asc-accent)",
                      borderLeft: "1px solid var(--asc-accent)",
                      opacity: 0.5,
                    }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate font-black"
                        style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18 }}
                      >
                        {team.name}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                        {team.game?.name ?? "—"} · {team.members.length}{" "}
                        {getCount(team.members.length, labels.member, labels.members)}
                      </p>
                    </div>
                    <StatusBadge status={team.status} statuses={statuses} />
                  </div>
                  {team.rejectionReason && (
                    <p className="mt-2 text-xs" style={{ color: "var(--asc-live)" }}>{team.rejectionReason}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
                      {isLeader ? labels.leader : (membership?.role ?? statuses.member)}
                    </p>
                    <Link
                      href={`/profile/teams/${team.id}`}
                      className="px-4 py-2 text-xs font-black transition hover:opacity-90"
                      style={{ background: "var(--asc-accent-2)", color: "#fff" }}
                    >
                      {labels.open}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
            ▲ {sectionLabels.createTeam}
          </p>
          <h3
            className="mt-1 text-xl font-black uppercase"
            style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {sectionLabels.startNewTeam}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {isGuildMember ? sectionLabels.createTeamMeta : sectionLabels.discordRequiredMeta}
          </p>
        </div>
        {isGuildMember ? (
          <CreateTeamForm dbGames={dbGames} labels={labels} />
        ) : (
          <div className="p-5">
            <div className="border p-4" style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" }}>
              <p className="font-black" style={{ color: "var(--asc-accent)" }}>{labels.ascendraDiscordRequired}</p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>{labels.discordRequiredDescription}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
