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

function toneClass(tone: Tone) {
  const styles: Record<Tone, string> = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    yellow: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return styles[tone];
}

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${toneClass(
        tone,
      )}`}
    >
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
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
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
  teamGame,
  tournamentGame,
  teamMembersCount,
  teamSize,
  pendingInvitesCount,
  tournamentStatus,
  isApproved,
  approvedCount,
  maxSlots,
}: {
  teamGame: string;
  tournamentGame: string;
  teamMembersCount: number;
  teamSize: number;
  pendingInvitesCount: number;
  tournamentStatus: string;
  isApproved: boolean;
  approvedCount: number;
  maxSlots: number;
}) {
  const issues: string[] = [];

  if (["ended", "cancelled"].includes(tournamentStatus)) {
    issues.push("Tournament not active");
  }

  if (teamGame !== tournamentGame) {
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

  if (!isApproved && approvedCount >= maxSlots) {
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
        <p className="truncate font-black text-white">{username}</p>
        <p className="break-all text-xs text-gray-500">{discordId}</p>
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
        <p className="font-black text-white">Discord automation</p>
        <DiscordRoleBadge status={status} />
      </div>

      <div className="grid gap-2 text-gray-400">
        <p>
          Role:{" "}
          <span className="font-bold text-white">
            {roleName || "Not prepared"}
          </span>
        </p>
        <p>
          Role ID:{" "}
          <span className="font-bold text-white">{roleId || "Pending"}</span>
        </p>
        <p>
          Channel:{" "}
          <span className="font-bold text-white">
            {channelName || "Not prepared"}
          </span>
        </p>
        <p>
          Channel ID:{" "}
          <span className="font-bold text-white">{channelId || "Pending"}</span>
        </p>
        <p>
          Requested:{" "}
          <span className="font-bold text-white">
            {formatDate(requestedAt)}
          </span>
        </p>
        <p>
          Synced:{" "}
          <span className="font-bold text-white">{formatDate(syncedAt)}</span>
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
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
            date: true,
            game: true,
            status: true,
            teamSize: true,
            maxSlots: true,
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
            game: true,
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
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Registrations
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            Tournament registrations
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
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
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-gray-300 shadow-2xl shadow-black/20">
          No tournament registrations found.
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="hidden border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px_120px_170px] xl:gap-5">
            <span>Team</span>
            <span>Tournament</span>
            <span>Status</span>
            <span>Ready</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-white/10">
            {sortedRegistrations.map((registration) => {
              const approvedTournamentCount =
                approvedCountByTournament.get(registration.tournamentId) || 0;

              const snapshotMembers = parseSnapshotMembers(
                registration.snapshotMembers,
              );

              const displayedTeamName =
                registration.snapshotTeamName || registration.team.name;

              const displayedTeamGame =
                registration.snapshotTeamGame || registration.team.game;

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
                teamGame: registration.team.game,
                tournamentGame: registration.tournament.game,
                teamMembersCount: registration.team.members.length,
                teamSize: registration.tournament.teamSize,
                pendingInvitesCount: registration.team.invites.length,
                tournamentStatus: registration.tournament.status,
                isApproved: registration.status === "approved",
                approvedCount: approvedTournamentCount,
                maxSlots: registration.tournament.maxSlots,
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
                  className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035]"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px_120px_170px] xl:items-center xl:gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-black text-white">
                          {displayedTeamName}
                        </h2>

                        <Pill tone="violet">{displayedTeamGame}</Pill>
                      </div>

                      <p className="mt-1 text-sm text-gray-400">
                        {displayedMembers.length} player
                        {displayedMembers.length === 1 ? "" : "s"} · leader{" "}
                        {registration.team.leader.username}
                      </p>

                      {registration.team.invites.length > 0 &&
                        registration.status === "registered" && (
                          <p className="mt-1 text-sm font-bold text-yellow-300">
                            {registration.team.invites.length} pending invite
                            {registration.team.invites.length === 1 ? "" : "s"}
                          </p>
                        )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-black text-white">
                        {registration.tournament.title}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {registration.tournament.date} ·{" "}
                        {approvedTournamentCount}/
                        {registration.tournament.maxSlots} approved
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
                          <div className="rounded-xl border border-yellow-400/25 bg-yellow-500/10 px-4 py-2 text-sm font-black text-yellow-300">
                            {readinessIssues[0] || "Not ready"}
                          </div>
                        )}

                      {registration.status === "approved" && (
                        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-2 text-center text-sm font-black text-emerald-300">
                          Approved
                        </div>
                      )}

                      {registration.status === "cancelled" && (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-black text-gray-400">
                          Closed
                        </div>
                      )}
                    </div>
                  </div>

                  {registration.rejectionReason && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                      {registration.rejectionReason}
                    </div>
                  )}

                  <details className="rounded-2xl border border-white/10 bg-black/20">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-black text-gray-300 transition hover:text-white">
                      More details
                    </summary>

                    <div className="grid gap-5 border-t border-white/10 p-4 lg:grid-cols-[1fr_1fr_220px]">
                      <section>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                          Players
                        </p>

                        <div className="mt-3 divide-y divide-white/10">
                          {displayedMembers.length === 0 ? (
                            <p className="py-2 text-sm text-gray-400">
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
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                          Review info
                        </p>

                        <div className="mt-3 grid gap-2 text-sm text-gray-400">
                          <p>
                            Registered by:{" "}
                            <span className="font-bold text-white">
                              {registration.registeredBy.username}
                            </span>
                          </p>
                          <p>
                            Registered:{" "}
                            <span className="font-bold text-white">
                              {formatDate(registration.createdAt)}
                            </span>
                          </p>
                          <p>
                            Reviewed:{" "}
                            <span className="font-bold text-white">
                              {formatDate(registration.reviewedAt)}
                            </span>
                          </p>
                          <p>
                            Required players:{" "}
                            <span className="font-bold text-white">
                              {registration.tournament.teamSize}
                            </span>
                          </p>
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
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
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
