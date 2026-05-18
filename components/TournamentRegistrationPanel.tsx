"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelRegistrationInline,
  registerRegistrationInline,
} from "@/actions/tournamentRegistrationInlineActions";
import type { TournamentRegistrationActionResult } from "@/actions/tournamentRegistrationInlineActions";

type AvailableTeam = {
  id: string;
  name: string;
  game: string;
  memberCount: number;
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
  activeRegistrations: ActiveRegistration[];
};

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    registered: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
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
      className={`inline-flex w-fit rounded border px-3 py-1 text-xs font-bold ${
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
    return "border-red-500/20 bg-red-500/10";
  }

  if (normalizedStatus === "approved") {
    return "border-green-500/20 bg-green-500/10";
  }

  if (normalizedStatus === "cancelled") {
    return "border-white/10 bg-black/20";
  }

  return "border-cyan-500/20 bg-cyan-500/10";
}

function getRegistrationTitle(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "rejected") {
    return "Your registration was rejected";
  }

  if (normalizedStatus === "approved") {
    return "Your team is approved";
  }

  if (normalizedStatus === "cancelled") {
    return "Your registration was cancelled";
  }

  return "Your team is registered";
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
      className={`rounded-xl border p-4 text-sm font-bold ${
        result.ok
          ? "border-green-500/20 bg-green-500/10 text-green-300"
          : "border-red-500/20 bg-red-500/10 text-red-300"
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
        }, 450);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />

      <label className="grid gap-2">
        <span className="font-bold text-gray-200">Choose team</span>

        <select
          name="teamId"
          required
          defaultValue=""
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        >
          <option value="" disabled>
            Select team
          </option>

          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} · {team.memberCount} players
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-indigo-500 px-5 py-3 font-black text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
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
        }, 450);
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
          className="w-fit rounded border border-red-500/25 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Cancelling..." : "Cancel registration"}
        </button>

        <ActionNotice result={notice} />
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
                Confirmation
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Cancel registration?
              </h2>

              <p className="mt-2 leading-7 text-gray-300">
                Are you sure you want to cancel {teamName}&apos;s registration?
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 p-6">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded border border-white/10 px-5 py-3 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Keep registration
              </button>

              <button
                type="button"
                onClick={runAction}
                disabled={pending}
                className="rounded bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
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

function TournamentRegistrationPanel({
  tournamentId,
  tournamentStatus,
  registrationStatus,
  slotsRemaining,
  teamSize,
  isLoggedIn,
  isGuildMember,
  availableTeams,
  activeRegistrations,
}: TournamentRegistrationPanelProps) {
  const hasOpenRegistration = activeRegistrations.some((registration) =>
    ["registered", "approved"].includes(registration.status),
  );

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-5">
        <p className="font-black text-yellow-300">Login required</p>

        <p className="mt-2 leading-7 text-gray-300">
          Login with Discord to register a team for this tournament.
        </p>
      </div>
    );
  }

  if (!isGuildMember) {
    return (
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-5">
        <p className="font-black text-yellow-300">RTN Discord required</p>

        <p className="mt-2 leading-7 text-gray-300">
          You must be an RTN Discord member to register for tournaments.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {activeRegistrations.length > 0 && (
        <section className="grid gap-3">
          {activeRegistrations.map((registration) => (
            <div
              key={registration.id}
              className={`rounded-xl border p-4 ${getRegistrationCardStyle(
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

                  <p className="mt-1 text-sm text-gray-300">
                    Current registration status
                  </p>
                </div>

                <StatusBadge status={registration.status} />
              </div>

              {registration.rejectionReason && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-black/20 px-4 py-3">
                  <p className="font-black text-red-300">Rejection reason</p>

                  <p className="mt-1 text-sm leading-6 text-gray-300">
                    {registration.rejectionReason}
                  </p>
                </div>
              )}

              {["registered", "approved"].includes(registration.status) && (
                <div className="mt-4">
                  <CancelRegistrationForm
                    registrationId={registration.id}
                    teamName={registration.teamName}
                  />
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {registrationStatus !== "open" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="font-black text-red-300">Registration closed</p>

          <p className="mt-2 leading-7 text-gray-300">
            This tournament is not accepting registrations right now.
          </p>
        </div>
      )}

      {registrationStatus === "open" && slotsRemaining <= 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="font-black text-red-300">Tournament full</p>

          <p className="mt-2 leading-7 text-gray-300">
            There are no slots remaining for this tournament.
          </p>
        </div>
      )}

      {registrationStatus === "open" &&
        slotsRemaining > 0 &&
        !hasOpenRegistration && (
          <>
            {availableTeams.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="font-black text-white">No eligible teams</p>

                <p className="mt-2 leading-7 text-gray-300">
                  You need a team that matches this game and has at least{" "}
                  {teamSize} player{teamSize === 1 ? "" : "s"}.
                </p>
              </div>
            ) : (
              <RegisterForm
                tournamentId={tournamentId}
                availableTeams={availableTeams}
              />
            )}
          </>
        )}

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-gray-400">
        Tournament status:{" "}
        <span className="font-bold text-white">{tournamentStatus}</span>
      </div>
    </div>
  );
}

export { TournamentRegistrationPanel };
export default TournamentRegistrationPanel;
