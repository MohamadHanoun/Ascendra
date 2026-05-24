import type { ReactNode } from "react";

import {
  approveRegistrationInline,
  cancelRegistrationInline,
  rejectRegistrationInline,
} from "@/actions/adminRegistrationInlineActions";
import {
  forceRemoveRegistrationDiscordAccess,
  forceSyncRegistrationDiscordAccess,
} from "@/actions/adminRegistrationDiscordSyncActions";
import AdminRegistrationsRealtime from "@/components/AdminRegistrationsRealtime";
import InlineAdminRegistrationForm from "@/components/InlineAdminRegistrationForm";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";

type AdminRegistrationListProps = {
  message?: string;
  error?: string;
};

type Tone = "green" | "yellow" | "red" | "gray" | "violet";

type SnapshotMember = {
  userId?: string;
  username?: string;
  discordId?: string;
};

const toneStyle: Record<Tone, React.CSSProperties> = {
  green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
  yellow: { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" },
  red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
  gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
};

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={toneStyle[tone]}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const tones: Record<string, Tone> = {
    registered: "violet",
    approved: "green",
    rejected: "red",
    cancelled: "gray",
  };

  const labels: Record<string, string> = {
    registered: "Waiting review",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return (
    <Pill tone={tones[normalizedStatus] || "gray"}>
      {labels[normalizedStatus] || status}
    </Pill>
  );
}

function DiscordRoleBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const tones: Record<string, Tone> = {
    not_needed: "gray",
    pending_create: "yellow",
    active: "green",
    pending_remove: "yellow",
    removed: "gray",
    failed: "red",
  };

  const labels: Record<string, string> = {
    not_needed: "No bot action",
    pending_create: "Queued",
    active: "Active",
    pending_remove: "Remove queued",
    removed: "Removed",
    failed: "Failed",
  };

  return (
    <Pill tone={tones[normalizedStatus] || "gray"}>
      {labels[normalizedStatus] || status}
    </Pill>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not reviewed";
  }

  return date.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function parseSnapshotMembers(snapshotMembers: unknown): SnapshotMember[] {
  if (!Array.isArray(snapshotMembers)) {
    return [];
  }

  return snapshotMembers
    .filter((member): member is Record<string, unknown> => {
      return Boolean(member) && typeof member === "object";
    })
    .map((member) => ({
      userId: typeof member.userId === "string" ? member.userId : undefined,
      username:
        typeof member.username === "string" ? member.username : undefined,
      discordId:
        typeof member.discordId === "string" ? member.discordId : undefined,
    }))
    .filter((member) => Boolean(member.username || member.userId));
}

function getReadinessIssues({
  teamGameId,
  tournamentGameId,
  teamMembersCount,
  teamSize,
  pendingInvitesCount,
  tournamentStatus,
  isApproved,
  approvedCount,
  maxTeams,
}: {
  teamGameId: string | null;
  tournamentGameId: string | null;
  teamMembersCount: number;
  teamSize: number;
  pendingInvitesCount: number;
  tournamentStatus: string;
  isApproved: boolean;
  approvedCount: number;
  maxTeams: number;
}) {
  const issues: string[] = [];

  if (["ended", "cancelled"].includes(tournamentStatus)) {
    issues.push("Tournament not active");
  }

  if (teamGameId !== tournamentGameId) {
    issues.push("Wrong game");
  }

  if (teamMembersCount < teamSize) {
    issues.push(
      `Needs ${teamSize - teamMembersCount} more player${
        teamSize - teamMembersCount === 1 ? "" : "s"
      }`,
    );
  }

  if (pendingInvitesCount > 0) {
    issues.push("Pending invites");
  }

  if (!isApproved && approvedCount >= maxTeams) {
    issues.push("No slots left");
  }

  return issues;
}

function ReadinessBadge({ issues }: { issues: string[] }) {
  if (issues.length === 0) {
    return <Pill tone="green">Ready</Pill>;
  }

  return <Pill tone="yellow">{issues[0]}</Pill>;
}

function PlayerLine({
  username,
  discordId,
  isLeader,
}: {
  username: string;
  discordId: string;
  isLeader: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>{username}</p>
        <p className="break-all text-xs" style={{ color: "var(--asc-fg-3)" }}>{discordId}</p>
      </div>

      <Pill tone={isLeader ? "green" : "violet"}>
        {isLeader ? "Leader" : "Member"}
      </Pill>
    </div>
  );
}

function DiscordInfo({
  status,
  roleName,
  roleId,
  channelName,
  channelId,
  error,
  requestedAt,
  syncedAt,
}: {
  status: string;
  roleName: string | null;
  roleId: string | null;
  channelName: string | null;
  channelId: string | null;
  error: string | null;
  requestedAt: Date | null;
  syncedAt: Date | null;
}) {
  return (
    <div className="grid gap-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>Discord automation</p>
        <DiscordRoleBadge status={status} />
      </div>

      <div className="grid gap-2" style={{ color: "var(--asc-fg-3)" }}>
        <p>Role: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{roleName || "Not prepared"}</span></p>
        <p>Role ID: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{roleId || "Pending"}</span></p>
        <p>Channel: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{channelName || "Not prepared"}</span></p>
        <p>Channel ID: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{channelId || "Pending"}</span></p>
        <p>Requested: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{formatDate(requestedAt)}</span></p>
        <p>Synced: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{formatDate(syncedAt)}</span></p>
      </div>

      {error && (
        <p
          className="border px-4 py-3"
          style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default async function AdminRegistrationList({
  message,
  error,
}: AdminRegistrationListProps) {
  const [registrations, approvedGroups] = await Promise.all([
    prisma.tournamentRegistration.findMany({
      select: {
        id: true,
        tournamentId: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        reviewedAt: true,
        snapshotTeamName: true,
        snapshotTeamGame: true,
        snapshotMembers: true,
        discordRoleStatus: true,
        discordRoleName: true,
        discordRoleId: true,
        discordRoleError: true,
        discordRoleRequestedAt: true,
        discordRoleSyncedAt: true,
        discordChannelName: true,
        discordChannelId: true,
        tournament: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            gameId: true,
            game: { select: { name: true } },
            status: true,
            teamSize: true,
            maxTeams: true,
          },
        },
        registeredBy: {
          select: {
            username: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            gameId: true,
            game: { select: { name: true } },
            leaderId: true,
            leader: {
              select: {
                username: true,
              },
            },
            invites: {
              where: {
                status: "pending",
              },
              select: {
                id: true,
              },
            },
            members: {
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    username: true,
                    discordId: true,
                  },
                },
              },
              orderBy: {
                joinedAt: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 150,
    }),

    prisma.tournamentRegistration.groupBy({
      by: ["tournamentId"],
      where: {
        status: "approved",
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const approvedCountByTournament = new Map(
    approvedGroups.map((group) => [group.tournamentId, group._count._all]),
  );

  const priority: Record<string, number> = {
    registered: 0,
    approved: 1,
    rejected: 2,
    cancelled: 3,
  };

  const sortedRegistrations = [...registrations].sort((a, b) => {
    const statusA = priority[a.status] ?? 10;
    const statusB = priority[b.status] ?? 10;

    if (statusA !== statusB) {
      return statusA - statusB;
    }

    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const pendingCount = registrations.filter(
    (registration) => registration.status === "registered",
  ).length;

  const approvedCount = registrations.filter(
    (registration) => registration.status === "approved",
  ).length;

  const rejectedCount = registrations.filter(
    (registration) => registration.status === "rejected",
  ).length;

  const botQueueCount = registrations.filter((registration) =>
    ["pending_create", "pending_remove", "failed"].includes(
      registration.discordRoleStatus,
    ),
  ).length;

  return (
    <section className="grid gap-6">
      <ProfileNotice message={message} error={error} />
      <AdminRegistrationsRealtime />

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            Registrations
          </p>

          <h1 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>
            Tournament registrations
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Review teams, approve valid entries, and manage Discord access.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
          <Stat label="Total" value={registrations.length} />
          <Stat label="Pending" value={pendingCount} />
          <Stat label="Approved" value={approvedCount} />
          <Stat label="Rejected" value={rejectedCount} />
          <Stat label="Bot queue" value={botQueueCount} />
        </div>
      </div>

      {sortedRegistrations.length === 0 ? (
        <section
          className="border p-6 shadow-2xl"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-2)" }}
        >
          No tournament registrations found.
        </section>
      ) : (
        <section
          className="overflow-hidden border shadow-2xl"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
        >
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] xl:grid xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px_120px_170px] xl:gap-5"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
          >
            <span>Team</span>
            <span>Tournament</span>
            <span>Status</span>
            <span>Ready</span>
            <span>Action</span>
          </div>

          <div>
            {sortedRegistrations.map((registration) => {
              const approvedTournamentCount =
                approvedCountByTournament.get(registration.tournamentId) || 0;

              const snapshotMembers = parseSnapshotMembers(
                registration.snapshotMembers,
              );

              const displayedTeamName =
                registration.snapshotTeamName || registration.team.name;

              const displayedTeamGame =
                registration.snapshotTeamGame || registration.team.game?.name || "—";

              const displayedMembers =
                snapshotMembers.length > 0
                  ? snapshotMembers.map((member) => ({
                      id:
                        member.userId ||
                        `${member.username}-${member.discordId}`,
                      userId: member.userId || "",
                      username: member.username || "Unknown player",
                      discordId: member.discordId || "Snapshot member",
                      isLeader: member.userId === registration.team.leaderId,
                    }))
                  : registration.team.members.map((member) => ({
                      id: member.id,
                      userId: member.userId,
                      username: member.user.username,
                      discordId: member.user.discordId,
                      isLeader: member.userId === registration.team.leaderId,
                    }));

              const readinessIssues = getReadinessIssues({
                teamGameId: registration.team.gameId,
                tournamentGameId: registration.tournament.gameId,
                teamMembersCount: registration.team.members.length,
                teamSize: registration.tournament.teamSize,
                pendingInvitesCount: registration.team.invites.length,
                tournamentStatus: registration.tournament.status,
                isApproved: registration.status === "approved",
                approvedCount: approvedTournamentCount,
                maxTeams: registration.tournament.maxTeams,
              });

              const isReady = readinessIssues.length === 0;
              const canApprove =
                ["registered", "rejected"].includes(registration.status) &&
                isReady;

              const canReject = ["registered", "approved"].includes(
                registration.status,
              );

              const canCancel = ["registered", "approved", "rejected"].includes(
                registration.status,
              );

              const shouldShowDiscordActions =
                registration.status === "approved" ||
                registration.discordRoleStatus !== "not_needed" ||
                Boolean(registration.discordRoleId) ||
                Boolean(registration.discordChannelId);

              return (
                <article
                  key={registration.id}
                  className="grid gap-4 px-5 py-4 transition"
                  style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px_120px_170px] xl:items-center xl:gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                          {displayedTeamName}
                        </h2>

                        <Pill tone="violet">{displayedTeamGame}</Pill>
                      </div>

                      <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                        {displayedMembers.length} player
                        {displayedMembers.length === 1 ? "" : "s"} · leader{" "}
                        {registration.team.leader.username}
                      </p>

                      {registration.team.invites.length > 0 &&
                        registration.status === "registered" && (
                          <p className="mt-1 text-sm font-bold" style={{ color: "var(--asc-amber)" }}>
                            {registration.team.invites.length} pending invite
                            {registration.team.invites.length === 1 ? "" : "s"}
                          </p>
                        )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>
                        {registration.tournament.title}
                      </p>

                      <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                        {registration.tournament.startsAt?.toLocaleDateString() ?? "—"} ·{" "}
                        {approvedTournamentCount}/
                        {registration.tournament.maxTeams} approved
                      </p>
                    </div>

                    <StatusBadge status={registration.status} />

                    <ReadinessBadge issues={readinessIssues} />

                    <div className="grid gap-2">
                      {canApprove && (
                        <InlineAdminRegistrationForm
                          action={approveRegistrationInline}
                          buttonLabel="Approve"
                          pendingLabel="Approving..."
                          variant="success"
                        >
                          <input
                            type="hidden"
                            name="registrationId"
                            value={registration.id}
                          />
                        </InlineAdminRegistrationForm>
                      )}

                      {!canApprove &&
                        ["registered", "rejected"].includes(
                          registration.status,
                        ) && (
                          <div
                            className="border px-4 py-2 text-sm font-black"
                            style={{ borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)", color: "var(--asc-amber)" }}
                          >
                            {readinessIssues[0] || "Not ready"}
                          </div>
                        )}

                      {registration.status === "approved" && (
                        <div
                          className="border px-4 py-2 text-center text-sm font-black"
                          style={{ borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.10)", color: "var(--asc-green)" }}
                        >
                          Approved
                        </div>
                      )}

                      {registration.status === "cancelled" && (
                        <div
                          className="border px-4 py-2 text-center text-sm font-black"
                          style={{ borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }}
                        >
                          Closed
                        </div>
                      )}
                    </div>
                  </div>

                  {registration.rejectionReason && (
                    <div
                      className="border px-4 py-3 text-sm leading-6"
                      style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }}
                    >
                      {registration.rejectionReason}
                    </div>
                  )}

                  <details
                    className="border"
                    style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                  >
                    <summary
                      className="cursor-pointer px-4 py-3 text-sm font-black transition hover:opacity-90"
                      style={{ color: "var(--asc-fg-2)" }}
                    >
                      More details
                    </summary>

                    <div className="grid gap-5 p-4 lg:grid-cols-[1fr_1fr_220px]" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
                      <section>
                        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                          Players
                        </p>

                        <div className="mt-3">
                          {displayedMembers.length === 0 ? (
                            <p className="py-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                              No players in this team.
                            </p>
                          ) : (
                            displayedMembers.map((member) => (
                              <PlayerLine
                                key={member.id}
                                username={member.username}
                                discordId={member.discordId}
                                isLeader={member.isLeader}
                              />
                            ))
                          )}
                        </div>
                      </section>

                      <section>
                        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                          Review info
                        </p>

                        <div className="mt-3 grid gap-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                          <p>Registered by: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{registration.registeredBy.username}</span></p>
                          <p>Registered: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{formatDate(registration.createdAt)}</span></p>
                          <p>Reviewed: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{formatDate(registration.reviewedAt)}</span></p>
                          <p>Required players: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{registration.tournament.teamSize}</span></p>
                        </div>

                        {shouldShowDiscordActions && (
                          <div className="mt-5">
                            <DiscordInfo
                              status={registration.discordRoleStatus}
                              roleName={registration.discordRoleName}
                              roleId={registration.discordRoleId}
                              channelName={registration.discordChannelName}
                              channelId={registration.discordChannelId}
                              error={registration.discordRoleError}
                              requestedAt={registration.discordRoleRequestedAt}
                              syncedAt={registration.discordRoleSyncedAt}
                            />
                          </div>
                        )}
                      </section>

                      <aside className="grid content-start gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                          Actions
                        </p>

                        {canReject && (
                          <InlineAdminRegistrationForm
                            action={rejectRegistrationInline}
                            buttonLabel="Reject"
                            pendingLabel="Rejecting..."
                            variant="danger"
                            confirmTitle="Reject registration?"
                            confirmDescription={`Write a clear reason for rejecting ${displayedTeamName}.`}
                            confirmLabel="Reject"
                            textareaName="rejectionReason"
                            textareaLabel="Reason"
                            textareaPlaceholder="Example: Missing players or wrong roster..."
                            textareaRequired
                          >
                            <input
                              type="hidden"
                              name="registrationId"
                              value={registration.id}
                            />
                          </InlineAdminRegistrationForm>
                        )}

                        {canCancel && (
                          <InlineAdminRegistrationForm
                            action={cancelRegistrationInline}
                            buttonLabel="Cancel"
                            pendingLabel="Cancelling..."
                            variant="secondary"
                            confirmTitle="Cancel registration?"
                            confirmDescription={`Cancel ${displayedTeamName}'s registration?`}
                            confirmLabel="Cancel registration"
                          >
                            <input
                              type="hidden"
                              name="registrationId"
                              value={registration.id}
                            />
                          </InlineAdminRegistrationForm>
                        )}

                        {registration.status === "approved" && (
                          <InlineAdminRegistrationForm
                            action={forceSyncRegistrationDiscordAccess}
                            buttonLabel="Sync Discord"
                            pendingLabel="Queueing..."
                            variant="success"
                            confirmTitle="Sync Discord access?"
                            confirmDescription={`Queue Discord role and voice room sync for ${displayedTeamName}.`}
                            confirmLabel="Queue sync"
                          >
                            <input
                              type="hidden"
                              name="registrationId"
                              value={registration.id}
                            />
                          </InlineAdminRegistrationForm>
                        )}

                        {(registration.discordRoleStatus === "active" ||
                          registration.discordRoleStatus === "pending_create" ||
                          registration.discordRoleStatus === "failed" ||
                          Boolean(registration.discordRoleId) ||
                          Boolean(registration.discordChannelId)) && (
                          <InlineAdminRegistrationForm
                            action={forceRemoveRegistrationDiscordAccess}
                            buttonLabel="Remove Discord"
                            pendingLabel="Queueing..."
                            variant="danger"
                            confirmTitle="Remove Discord access?"
                            confirmDescription={`Queue removal of Discord access for ${displayedTeamName}.`}
                            confirmLabel="Queue removal"
                          >
                            <input
                              type="hidden"
                              name="registrationId"
                              value={registration.id}
                            />
                          </InlineAdminRegistrationForm>
                        )}
                      </aside>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
