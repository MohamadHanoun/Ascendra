import Link from "next/link";

import { Card, Pill } from "@/components/profile/shared";
import type { ProfileMessages } from "@/lib/profile/profileMessages";

export type ProfileTournamentRegistrationTask = {
  id: string;
  status: string;
  tournamentId: string;
  tournamentTitle: string;
  tournamentStatus: string;
  teamName: string;
  rejectionReason: string | null;
  tournamentHref: string;
  matchHref: string | null;
};

type TaskTone = "green" | "bronze" | "red" | "gray" | "accent";

function getRegistrationTone(task: ProfileTournamentRegistrationTask): TaskTone {
  if (task.status === "rejected") return "red";
  if (task.status === "cancelled") return "gray";
  if (task.status === "registered") return "bronze";
  if (task.matchHref) return "accent";
  return "bronze";
}

function getRegistrationLabel(
  task: ProfileTournamentRegistrationTask,
  messages: ProfileMessages["tournamentTasks"],
) {
  if (task.status === "approved" && task.matchHref) return messages.viewUpdate;
  if (task.status === "approved") return messages.approvedWaitingForBracket;
  if (task.status === "registered") return messages.registrationPending;
  if (task.status === "rejected") return messages.rejected;
  if (task.status === "cancelled") return messages.cancelled;
  return task.status;
}

// Registration follow-ups only. Active matches live in their own section, so
// this panel never duplicates them or shows zero-value counters.
export function TournamentTasksPanel({
  registrations,
  messages,
}: {
  registrations: ProfileTournamentRegistrationTask[];
  messages: ProfileMessages["tournamentTasks"];
}) {
  return (
    <Card>
      <div className="asc-profile-card-header">
        <p className="asc-profile-eyebrow">{messages.heading}</p>
        <h3 className="asc-profile-section-title">{messages.followUps}</h3>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {registrations.map((task) => (
          <article
            key={task.id}
            className="asc-profile-match-card flex flex-col gap-3 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-black"
                  style={{
                    color: "var(--asc-fg-0)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {task.tournamentTitle}
                </p>
                <p
                  className="mt-1 truncate text-xs"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {messages.team}: {task.teamName}
                </p>
              </div>
              <Pill
                label={getRegistrationLabel(task, messages)}
                tone={getRegistrationTone(task)}
              />
            </div>

            {task.rejectionReason && (
              <p
                className="text-xs leading-5"
                style={{ color: "var(--asc-live)" }}
              >
                {task.rejectionReason}
              </p>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              <Link
                href={task.matchHref ?? task.tournamentHref}
                className="asc-profile-action px-4 py-2 text-xs tracking-[0.08em]"
              >
                {task.matchHref ? messages.viewMatch : messages.viewTournament}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
