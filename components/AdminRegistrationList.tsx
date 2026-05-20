import {
  approveRegistrationInline,
  cancelRegistrationInline,
  rejectRegistrationInline,
} from "@/actions/adminRegistrationInlineActions";
import InlineAdminRegistrationForm from "@/components/InlineAdminRegistrationForm";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";

type AdminRegistrationListProps = {
  message?: string;
  error?: string;
};

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    registered: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    approved: "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-300/80",
    rejected: "border-red-400/25 bg-red-500/10 text-red-300",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function DiscordRoleBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    not_needed: "border-white/10 bg-white/5 text-gray-400",
    pending_create: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    active: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    pending_remove: "border-orange-400/25 bg-orange-500/10 text-orange-300",
    removed: "border-white/10 bg-white/5 text-gray-400",
    failed: "border-red-400/25 bg-red-500/10 text-red-300",
  };

  const labels: Record<string, string> = {
    not_needed: "No role needed",
    pending_create: "Role queued",
    active: "Role active",
    pending_remove: "Removal queued",
    removed: "Role removed",
    failed: "Bot failed",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-400"
      }`}
    >
      {labels[normalizedStatus] || status}
    </span>
  );
}

function RoleBadge({ leader }: { leader: boolean }) {
  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${
        leader
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-violet-400/25 bg-violet-500/10 text-violet-200"
      }`}
    >
      {leader ? "Leader" : "Member"}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string | number }) {
  return (
    <p className="text-sm text-gray-400">
      {label}: <span className="font-black text-white">{value}</span>
    </p>
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

function getDiscordRoleDescription(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "pending_create") {
    return "The registration is approved. A future Discord bot can create the role and assign it to the team members.";
  }

  if (normalizedStatus === "active") {
    return "The Discord role is marked as active.";
  }

  if (normalizedStatus === "pending_remove") {
    return "The registration is no longer active. A future Discord bot can remove the role or remove it from the team members.";
  }

  if (normalizedStatus === "failed") {
    return "The last bot operation failed. The bot can retry or update this status later.";
  }

  if (normalizedStatus === "removed") {
    return "The Discord role was removed or no longer needs action.";
  }

  return "No Discord role action is needed for this registration.";
}

export default async function AdminRegistrationList({
  message,
  error,
}: AdminRegistrationListProps) {
  const registrations = await prisma.tournamentRegistration.findMany({
    select: {
      id: true,
      status: true,
      rejectionReason: true,
      createdAt: true,
      reviewedAt: true,
      discordRoleStatus: true,
      discordRoleName: true,
      discordRoleId: true,
      discordRoleError: true,
      discordRoleRequestedAt: true,
      discordRoleSyncedAt: true,
      tournament: {
        select: {
          title: true,
          date: true,
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
    take: 100,
  });

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

  const cancelledCount = registrations.filter(
    (registration) => registration.status === "cancelled",
  ).length;

  const queuedDiscordRolesCount = registrations.filter((registration) =>
    ["pending_create", "pending_remove", "failed"].includes(
      registration.discordRoleStatus,
    ),
  ).length;

  return (
    <section className="grid gap-6">
      <ProfileNotice message={message} error={error} />

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Registrations
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            Tournament registrations
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Review team entries, confirm approved registrations, and prepare
            Discord role automation for future bot integration.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard label="Total" value={registrations.length} />
          <StatCard label="Pending" value={pendingCount} />
          <StatCard label="Approved" value={approvedCount} />
          <StatCard label="Rejected" value={rejectedCount} />
          <StatCard label="Cancelled" value={cancelledCount} />
          <StatCard label="Bot queue" value={queuedDiscordRolesCount} />
        </div>
      </div>

      {sortedRegistrations.length === 0 ? (
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-gray-300 shadow-2xl shadow-black/20">
          No tournament registrations found.
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="hidden border-b border-white/10 bg-black/25 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[minmax(0,1.1fr)_220px_150px_150px_130px] xl:gap-5">
            <span>Team</span>
            <span>Tournament</span>
            <span>Status</span>
            <span>Players</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-white/10">
            {sortedRegistrations.map((registration) => {
              const canApprove = registration.status !== "approved";
              const canReject = registration.status !== "rejected";
              const canCancel = registration.status !== "cancelled";

              return (
                <article
                  key={registration.id}
                  className="grid gap-4 p-5 transition hover:bg-white/[0.035]"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_220px_150px_150px_130px] xl:items-center xl:gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-black text-white">
                          {registration.team.name}
                        </h2>

                        <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200">
                          {registration.team.game}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-400">
                        Registered by {registration.registeredBy.username}
                      </p>

                      {registration.rejectionReason && (
                        <p className="mt-2 text-sm text-red-300">
                          Rejected: {registration.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-black text-white">
                        {registration.tournament.title}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {registration.tournament.date}
                      </p>
                    </div>

                    <StatusBadge status={registration.status} />

                    <MiniStat
                      label="Players"
                      value={registration.team.members.length}
                    />

                    <div className="grid gap-2">
                      {canApprove ? (
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
                      ) : (
                        <div className="inline-flex cursor-default items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3 text-center text-sm font-black text-emerald-300/80">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/15 text-xs text-emerald-300">
                            ✓
                          </span>
                          Already approved
                        </div>
                      )}
                    </div>
                  </div>

                  <details className="rounded-2xl border border-white/10 bg-black/25">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-black text-gray-300 transition hover:text-white">
                      Review details and actions
                    </summary>

                    <div className="grid gap-5 border-t border-white/10 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_230px] lg:items-start">
                      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                          Registration info
                        </p>

                        <div className="mt-4 grid gap-2">
                          <InfoLine
                            label="Registered at"
                            value={formatDate(registration.createdAt)}
                          />
                          <InfoLine
                            label="Reviewed at"
                            value={formatDate(registration.reviewedAt)}
                          />
                          <InfoLine
                            label="Tournament date"
                            value={registration.tournament.date}
                          />
                          <InfoLine
                            label="Team leader"
                            value={registration.team.leader.username}
                          />
                        </div>
                      </section>

                      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                          Team players
                        </p>

                        <div className="mt-4 grid gap-2">
                          {registration.team.members.length === 0 ? (
                            <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-gray-400">
                              No players in this team.
                            </div>
                          ) : (
                            registration.team.members.map((member) => {
                              const isLeader =
                                member.userId === registration.team.leaderId;

                              return (
                                <div
                                  key={member.id}
                                  className="grid gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                                >
                                  <div>
                                    <p className="font-black text-white">
                                      {member.user.username}
                                    </p>

                                    <p className="mt-1 break-all text-xs text-gray-500">
                                      {member.user.discordId}
                                    </p>
                                  </div>

                                  <RoleBadge leader={isLeader} />
                                </div>
                              );
                            })
                          )}
                        </div>
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
                            confirmDescription={`Write a clear reason for rejecting ${registration.team.name} from ${registration.tournament.title}. The player will see this reason.`}
                            confirmLabel="Reject registration"
                            textareaName="rejectionReason"
                            textareaLabel="Rejection reason"
                            textareaPlaceholder="Example: Team does not meet requirements, wrong roster, missing players..."
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
                            buttonLabel="Cancel registration"
                            pendingLabel="Cancelling..."
                            variant="secondary"
                            confirmTitle="Cancel registration?"
                            confirmDescription={`Cancel ${registration.team.name}'s registration for ${registration.tournament.title}?`}
                            confirmLabel="Cancel registration"
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

                    <div className="border-t border-white/10 p-4">
                      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                              Discord role automation
                            </p>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
                              {getDiscordRoleDescription(
                                registration.discordRoleStatus,
                              )}
                            </p>
                          </div>

                          <DiscordRoleBadge
                            status={registration.discordRoleStatus}
                          />
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <MiniStat
                            label="Role name"
                            value={
                              registration.discordRoleName || "Not prepared"
                            }
                          />

                          <MiniStat
                            label="Role ID"
                            value={registration.discordRoleId || "Pending bot"}
                          />

                          <MiniStat
                            label="Requested"
                            value={formatDate(
                              registration.discordRoleRequestedAt,
                            )}
                          />

                          <MiniStat
                            label="Synced"
                            value={formatDate(registration.discordRoleSyncedAt)}
                          />
                        </div>

                        {registration.discordRoleError && (
                          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                            {registration.discordRoleError}
                          </div>
                        )}
                      </section>
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
