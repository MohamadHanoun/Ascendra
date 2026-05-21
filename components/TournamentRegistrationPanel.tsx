"use client";

import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useRef,
  useState,
  useTransition,
} from "react";
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

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "green" | "yellow" | "red" | "gray" | "violet";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    yellow: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const tone =
    normalizedStatus === "approved"
      ? "green"
      : normalizedStatus === "registered"
        ? "violet"
        : normalizedStatus === "rejected"
          ? "red"
          : "gray";

  const labels: Record<string, string> = {
    registered: "Waiting review",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return <Pill tone={tone}>{labels[normalizedStatus] || status}</Pill>;
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
      className={`rounded-xl border px-4 py-3 text-sm font-bold ${
        result.ok
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-red-400/25 bg-red-500/10 text-red-300"
      }`}
    >
      {result.message}
    </div>
  );
}

function PanelNotice({
  title,
  description,
  tone = "yellow",
  children,
}: {
  title: string;
  description: string;
  tone?: "yellow" | "red" | "gray" | "green";
  children?: ReactNode;
}) {
  const styles = {
    yellow: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    gray: "border-white/10 bg-black/20 text-white",
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[tone]}`}>
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
  children: ReactNode;
  external?: boolean;
}) {
  const className =
    "rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-500";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
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

function ActiveRegistrationCard({
  registration,
}: {
  registration: ActiveRegistration;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black text-white">{registration.teamName}</p>
          <p className="mt-1 text-sm text-gray-400">
            Current registration status
          </p>
        </div>

        <StatusBadge status={registration.status} />
      </div>

      {registration.rejectionReason && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
          {registration.rejectionReason}
        </p>
      )}

      {registration.status === "registered" && (
        <CancelRegistrationForm
          registrationId={registration.id}
          teamName={registration.teamName}
        />
      )}

      {registration.status === "approved" && (
        <p className="text-sm leading-6 text-emerald-300">
          Approved by admin. Contact an admin if changes are needed.
        </p>
      )}
    </div>
  );
}

function UnavailableTeamsList({ teams }: { teams: UnavailableTeam[] }) {
  if (teams.length === 0) {
    return null;
  }

  return (
    <details className="rounded-2xl border border-white/10 bg-black/20">
      <summary className="cursor-pointer px-4 py-3 text-sm font-black text-gray-300 transition hover:text-white">
        Unavailable teams ({teams.length})
      </summary>

      <div className="divide-y divide-white/10 border-t border-white/10">
        {teams.map((team) => (
          <div
            key={team.id}
            className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div>
              <p className="font-black text-white">{team.name}</p>
              <p className="mt-1 text-sm text-gray-400">
                {team.game} · {team.memberCount} player
                {team.memberCount === 1 ? "" : "s"}
              </p>
            </div>

            <Pill tone="yellow">{team.reason}</Pill>
          </div>
        ))}
      </div>
    </details>
  );
}

function RequirementsList({ teamSize }: { teamSize: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        Requirements
      </p>

      <div className="mt-3 grid gap-2 text-sm leading-6 text-gray-300">
        <p>Same game as the tournament.</p>
        <p>
          At least {teamSize} player{teamSize === 1 ? "" : "s"}.
        </p>
        <p>No pending team invites.</p>
      </div>
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
      <PanelNotice
        title="Tournament ended"
        description="Registration is closed for this tournament."
        tone="gray"
      />
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
            <ActiveRegistrationCard
              key={registration.id}
              registration={registration}
            />
          ))}
        </section>
      )}

      {registrationStatus !== "open" && (
        <PanelNotice
          title="Registration closed"
          description="This tournament is not accepting registrations."
          tone="red"
        />
      )}

      {registrationStatus === "open" && slotsRemaining <= 0 && (
        <PanelNotice
          title="Tournament full"
          description="Approved slots are full."
          tone="red"
        />
      )}

      {registrationStatus === "open" &&
        slotsRemaining > 0 &&
        !hasOpenRegistration && (
          <section className="grid gap-4">
            {availableTeams.length > 0 ? (
              <RegisterForm
                tournamentId={tournamentId}
                availableTeams={availableTeams}
              />
            ) : (
              <PanelNotice
                title="No eligible teams"
                description="No team is ready for this tournament."
                tone="gray"
              >
                <NoticeLink href="/profile">Manage teams</NoticeLink>
              </PanelNotice>
            )}

            <UnavailableTeamsList teams={unavailableTeams} />
            <RequirementsList teamSize={teamSize} />
          </section>
        )}

      <p className="text-sm text-gray-500">
        Tournament status:{" "}
        <span className="font-black text-white">{tournamentStatus}</span>
      </p>
    </div>
  );
}

export { TournamentRegistrationPanel };
export default TournamentRegistrationPanel;
