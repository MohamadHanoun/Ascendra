"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  cancelRegistrationInline,
  registerRegistrationInline,
} from "@/actions/tournamentRegistrationInlineActions";
import type { TournamentRegistrationActionResult } from "@/actions/tournamentRegistrationInlineActions";
import CustomSelect from "@/components/CustomSelect";

type AvailableTeam = {
  id: string;
  name: string;
  game: string;
  memberCount: number;
};

type UnavailableTeam = {
  id: string;
  name: string;
  game: string;
  memberCount: number;
  reason: string;
};

type ActiveRegistration = {
  id: string;
  status: string;
  teamName: string;
  rejectionReason?: string | null;
};

type TournamentRegistrationPanelProps = {
  tournamentId: string;
  tournamentStatus: string;
  registrationStatus: string;
  slotsRemaining: number;
  teamSize: number;
  isLoggedIn: boolean;
  isGuildMember: boolean;
  availableTeams: AvailableTeam[];
  unavailableTeams: UnavailableTeam[];
  activeRegistrations: ActiveRegistration[];
};

const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "";

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    registered: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    approved: "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-300/85",
    rejected: "border-red-400/25 bg-red-500/10 text-red-300",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
  };

  const labels: Record<string, string> = {
    registered: "Waiting review",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {labels[normalizedStatus] || status}
    </span>
  );
}

function getRegistrationCardStyle(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "rejected") {
    return "border-red-400/25 bg-red-500/10";
  }

  if (normalizedStatus === "approved") {
    return "border-emerald-400/20 bg-emerald-500/[0.06]";
  }

  if (normalizedStatus === "cancelled") {
    return "border-white/10 bg-black/20";
  }

  return "border-violet-400/25 bg-violet-500/10";
}

function getRegistrationTitle(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "rejected") {
    return "Registration rejected";
  }

  if (normalizedStatus === "approved") {
    return "Registration approved";
  }

  if (normalizedStatus === "cancelled") {
    return "Registration cancelled";
  }

  return "Registration submitted";
}

function ActionNotice({
  result,
}: {
  result: TournamentRegistrationActionResult | null;
}) {
  if (!result) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
        result.ok
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-red-400/25 bg-red-500/10 text-red-300"
      }`}
    >
      {result.message}
    </div>
  );
}

function RegisterForm({
  tournamentId,
  availableTeams,
}: {
  tournamentId: string;
  availableTeams: AvailableTeam[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] =
    useState<TournamentRegistrationActionResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    startTransition(async () => {
      const result = await registerRegistrationInline(formData);

      setNotice(result);

      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      if (result.ok) {
        window.setTimeout(() => {
          router.refresh();
        }, 300);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />

      <label className="grid gap-2">
        <span className="text-sm font-bold text-gray-200">Choose team</span>

        <CustomSelect
          name="teamId"
          required
          placeholder="Select team"
          options={availableTeams.map((team) => ({
            value: team.id,
            label: team.name,
            description: `${team.game} · ${team.memberCount} player${
              team.memberCount === 1 ? "" : "s"
            }`,
          }))}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Registering..." : "Register team"}
      </button>

      <ActionNotice result={notice} />
    </form>
  );
}

function CancelRegistrationForm({
  registrationId,
  teamName,
}: {
  registrationId: string;
  teamName: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] =
    useState<TournamentRegistrationActionResult | null>(null);

  function runAction() {
    if (pending) {
      return;
    }

    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    startTransition(async () => {
      const result = await cancelRegistrationInline(formData);

      setNotice(result);
      setConfirmOpen(false);

      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      if (result.ok) {
        window.setTimeout(() => {
          router.refresh();
        }, 300);
      }
    });
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          setConfirmOpen(true);
        }}
        className="grid gap-3"
      >
        <input type="hidden" name="registrationId" value={registrationId} />

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-xl border border-red-500/25 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Cancelling..." : "Cancel registration"}
        </button>

        <ActionNotice result={notice} />
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#11121d] shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-300">
                Confirmation
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Cancel registration?
              </h2>

              <p className="mt-2 leading-7 text-gray-300">
                Cancel {teamName}&apos;s registration?
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 p-6">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Keep registration
              </button>

              <button
                type="button"
                onClick={runAction}
                disabled={pending}
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Cancelling..." : "Cancel registration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PanelNotice({
  title,
  description,
  variant = "warning",
  children,
}: {
  title: string;
  description: string;
  variant?: "warning" | "danger" | "neutral" | "success";
  children?: React.ReactNode;
}) {
  const styles = {
    warning: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    danger: "border-red-400/25 bg-red-500/10 text-red-300",
    neutral: "border-white/10 bg-black/20 text-white",
    success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[variant]}`}>
      <p className="font-black">{title}</p>

      <p className="mt-2 text-sm leading-6 text-gray-300">{description}</p>

      {children && <div className="mt-4 flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

function NoticeLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-500"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-500"
    >
      {children}
    </Link>
  );
}

function UnavailableTeamsList({ teams }: { teams: UnavailableTeam[] }) {
  if (teams.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        Unavailable teams
      </p>

      <div className="mt-3 grid gap-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div>
              <p className="font-black text-white">{team.name}</p>

              <p className="mt-1 text-sm text-gray-400">
                {team.game} · {team.memberCount} player
                {team.memberCount === 1 ? "" : "s"}
              </p>
            </div>

            <p className="text-sm font-bold text-yellow-300">{team.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequirementsList({ teamSize }: { teamSize: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        Team requirements
      </p>

      <ul className="mt-3 grid gap-2 text-sm leading-6 text-gray-300">
        <li>• Same tournament game.</li>
        <li>
          • At least {teamSize} player{teamSize === 1 ? "" : "s"}.
        </li>
        <li>• No pending team invites.</li>
        <li>• Only the team leader can register.</li>
      </ul>
    </div>
  );
}

function ApprovedRegistrationInfo() {
  return (
    <div className="mt-4 rounded-xl border border-emerald-400/20 bg-black/20 px-4 py-3">
      <p className="font-black text-emerald-300">Approved by admin</p>

      <p className="mt-1 text-sm leading-6 text-gray-300">
        Contact an admin if changes are needed.
      </p>
    </div>
  );
}

function TournamentRegistrationPanel({
  tournamentId,
  tournamentStatus,
  registrationStatus,
  slotsRemaining,
  teamSize,
  isLoggedIn,
  isGuildMember,
  availableTeams,
  unavailableTeams,
  activeRegistrations,
}: TournamentRegistrationPanelProps) {
  const hasOpenRegistration = activeRegistrations.some((registration) =>
    ["registered", "approved"].includes(registration.status),
  );

  if (tournamentStatus === "ended") {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-gray-300">
        Tournament ended.
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <PanelNotice
        title="Login required"
        description="Login with Discord to register a team."
      >
        <NoticeLink href="/login">Login with Discord</NoticeLink>
      </PanelNotice>
    );
  }

  if (!isGuildMember) {
    return (
      <PanelNotice
        title="Discord membership required"
        description="Join Ascendra Discord and refresh your login."
      >
        {discordInvite ? (
          <NoticeLink href={discordInvite} external>
            Join Discord
          </NoticeLink>
        ) : (
          <span className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-gray-400">
            Discord invite not configured
          </span>
        )}
        <NoticeLink href="/login">Refresh login</NoticeLink>
      </PanelNotice>
    );
  }

  return (
    <div className="grid gap-5">
      {activeRegistrations.length > 0 && (
        <section className="grid gap-3">
          {activeRegistrations.map((registration) => (
            <div
              key={registration.id}
              className={`rounded-2xl border p-4 ${getRegistrationCardStyle(
                registration.status,
              )}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-white">
                    {getRegistrationTitle(registration.status)}
                  </p>

                  <p className="mt-2 font-black text-white">
                    {registration.teamName}
                  </p>
                </div>

                <StatusBadge status={registration.status} />
              </div>

              {registration.rejectionReason && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-black/20 px-4 py-3">
                  <p className="font-black text-red-300">Rejection reason</p>

                  <p className="mt-1 text-sm leading-6 text-gray-300">
                    {registration.rejectionReason}
                  </p>
                </div>
              )}

              {registration.status === "registered" && (
                <div className="mt-4">
                  <CancelRegistrationForm
                    registrationId={registration.id}
                    teamName={registration.teamName}
                  />
                </div>
              )}

              {registration.status === "approved" && (
                <ApprovedRegistrationInfo />
              )}
            </div>
          ))}
        </section>
      )}

      {registrationStatus !== "open" && (
        <PanelNotice
          title="Registration closed"
          description="This tournament is not accepting registrations."
          variant="danger"
        />
      )}

      {registrationStatus === "open" && slotsRemaining <= 0 && (
        <PanelNotice
          title="Tournament full"
          description="Approved slots are full."
          variant="danger"
        />
      )}

      {registrationStatus === "open" &&
        slotsRemaining > 0 &&
        !hasOpenRegistration && (
          <>
            {availableTeams.length === 0 ? (
              <div className="grid gap-4">
                <PanelNotice
                  title="No eligible teams"
                  description="No team is ready for this tournament."
                  variant="neutral"
                >
                  <NoticeLink href="/profile">Manage teams</NoticeLink>
                </PanelNotice>

                <UnavailableTeamsList teams={unavailableTeams} />
                <RequirementsList teamSize={teamSize} />
              </div>
            ) : (
              <div className="grid gap-4">
                <RegisterForm
                  tournamentId={tournamentId}
                  availableTeams={availableTeams}
                />

                <UnavailableTeamsList teams={unavailableTeams} />
              </div>
            )}
          </>
        )}

      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-gray-400">
        Tournament status:{" "}
        <span className="font-bold text-white">{tournamentStatus}</span>
      </div>
    </div>
  );
}

export { TournamentRegistrationPanel };
export default TournamentRegistrationPanel;
