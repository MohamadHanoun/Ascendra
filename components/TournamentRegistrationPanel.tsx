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
import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";
import type { TournamentDetailsMessages } from "@/lib/i18n";
import type { Cs2Readiness } from "@/lib/cs2AccountReadiness";
import type { RiotAccountReadiness } from "@/lib/riotAccountReadiness";

type AvailableTeam = {
  id: string;
  name: string;
  game: string | null;
  memberCount: number;
};

type UnavailableTeam = {
  id: string;
  name: string;
  game: string | null;
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
  tournamentStatusLabel: string;
  registrationStatus: string;
  slotsRemaining: number;
  teamSize: number;
  isLoggedIn: boolean;
  isGuildMember: boolean;
  availableTeams: AvailableTeam[];
  unavailableTeams: UnavailableTeam[];
  activeRegistrations: ActiveRegistration[];
  messages: TournamentDetailsMessages["panel"];
  statusLabels: TournamentDetailsMessages["statuses"];
  playerLabel: string;
  playersLabel: string;
  isCs2?: boolean;
  cs2Readiness?: Cs2Readiness;
  isRiot?: boolean;
  riotReadiness?: RiotAccountReadiness;
};

const discordInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "";

function formatTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function getPlayerLabel(
  count: number,
  playerLabel: string,
  playersLabel: string,
) {
  return count === 1 ? playerLabel : playersLabel;
}

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "green" | "blue" | "red" | "gray" | "violet";
}) {
  const styleMap: Record<string, React.CSSProperties> = {
    green: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
    blue: { color: "var(--asc-blue)", borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)" },
    red: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    violet: { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" },
  };

  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={styleMap[tone]}>
      {children}
    </span>
  );
}

function StatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: TournamentDetailsMessages["statuses"];
}) {
  const normalizedStatus = status.toLowerCase();

  const tone =
    normalizedStatus === "approved"
      ? "green"
      : normalizedStatus === "registered"
        ? "violet"
        : normalizedStatus === "rejected"
          ? "red"
          : "gray";

  const statusLabels: Record<string, string> = {
    registered: labels.registered,
    approved: labels.approved,
    rejected: labels.rejected,
    cancelled: labels.cancelled,
  };

  return <Pill tone={tone}>{statusLabels[normalizedStatus] || status}</Pill>;
}

function ActionNotice({
  result,
}: {
  result: TournamentRegistrationActionResult | null;
}) {
  if (!result) {
    return null;
  }

  const style: React.CSSProperties = result.ok
    ? { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }
    : { borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" };

  return (
    <div className="border px-4 py-3 text-sm font-bold" style={style}>
      {result.message}
    </div>
  );
}

function PanelNotice({
  title,
  description,
  tone = "violet",
  children,
}: {
  title: string;
  description: string;
  tone?: "violet" | "red" | "gray" | "green";
  children?: ReactNode;
}) {
  const styleMap: Record<string, React.CSSProperties> = {
    violet: { borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" },
    red: { borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" },
    gray: { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" },
    green: { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" },
  };

  return (
    <div className="border p-4" style={styleMap[tone]}>
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>{description}</p>
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
  const style: React.CSSProperties = { background: "var(--asc-accent-2)", color: "var(--asc-fg-0)" };
  const className = "px-4 py-2 text-sm font-black transition hover:opacity-90";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} style={style}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}

function RegisterForm({
  tournamentId,
  availableTeams,
  messages,
  playerLabel,
  playersLabel,
}: {
  tournamentId: string;
  availableTeams: AvailableTeam[];
  messages: TournamentDetailsMessages["panel"];
  playerLabel: string;
  playersLabel: string;
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
      const result = await registerRegistrationInline(formData);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmOpen(true);
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
        <input type="hidden" name="tournamentId" value={tournamentId} />

        <label className="grid gap-2">
          <span
            className="text-sm font-bold"
            style={{ color: "var(--asc-fg-1)" }}
          >
            {messages.chooseTeam}
          </span>

          <CustomSelect
            name="teamId"
            required
            placeholder={messages.selectTeam}
            options={availableTeams.map((team) => ({
              value: team.id,
              label: team.name,
              description: `${team.game} · ${team.memberCount} ${getPlayerLabel(
                team.memberCount,
                playerLabel,
                playersLabel,
              )}`,
            }))}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-fit px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--asc-accent-2)",
            boxShadow: "0 0 20px var(--asc-accent-glow)",
            clipPath:
              "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
          }}
        >
          {pending ? messages.registering : messages.registerTeam}
        </button>

        <ActionNotice result={notice} />
      </form>

      <ConfirmDialogPortal
        open={confirmOpen}
        eyebrow={messages.confirmation}
        title={messages.registerConfirmationTitle}
        description={messages.registerConfirmationDescription}
        confirmLabel={messages.registerTeam}
        cancelLabel={messages.cancel}
        pendingLabel={messages.registering}
        pending={pending}
        variant="primary"
        onConfirm={runAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function CancelRegistrationForm({
  registrationId,
  teamName,
  messages,
}: {
  registrationId: string;
  teamName: string;
  messages: TournamentDetailsMessages["panel"];
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
          className="w-fit border px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderColor: "var(--asc-live-border)",
            color: "var(--asc-live)",
            background: "transparent",
            clipPath:
              "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
          }}
        >
          {pending ? messages.cancelling : messages.cancelRegistration}
        </button>

        <ActionNotice result={notice} />
      </form>

      <ConfirmDialogPortal
        open={confirmOpen}
        eyebrow={messages.confirmation}
        title={messages.cancelRegistrationTitle}
        description={formatTemplate(messages.cancelRegistrationDescription, {
          teamName,
        })}
        confirmLabel={messages.cancelRegistration}
        cancelLabel={messages.keepRegistration}
        pendingLabel={messages.cancelling}
        pending={pending}
        variant="danger"
        onConfirm={runAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function ActiveRegistrationCard({
  registration,
  messages,
  statusLabels,
}: {
  registration: ActiveRegistration;
  messages: TournamentDetailsMessages["panel"];
  statusLabels: TournamentDetailsMessages["statuses"];
}) {
  return (
    <div
      className="grid gap-3 border p-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>{registration.teamName}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {messages.currentRegistrationStatus}
          </p>
        </div>

        <StatusBadge status={registration.status} labels={statusLabels} />
      </div>

      {registration.rejectionReason && (
        <p
          className="border px-4 py-3 text-sm leading-6"
          style={{ borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" }}
        >
          {registration.rejectionReason}
        </p>
      )}

      {registration.status === "registered" && (
        <CancelRegistrationForm
          registrationId={registration.id}
          teamName={registration.teamName}
          messages={messages}
        />
      )}

      {registration.status === "approved" && (
        <p className="text-sm leading-6" style={{ color: "var(--asc-green)" }}>
          {messages.approvedByAdmin}
        </p>
      )}
    </div>
  );
}

function UnavailableTeamsList({
  teams,
  messages,
  playerLabel,
  playersLabel,
}: {
  teams: UnavailableTeam[];
  messages: TournamentDetailsMessages["panel"];
  playerLabel: string;
  playersLabel: string;
}) {
  if (teams.length === 0) {
    return null;
  }

  return (
    <details
      className="border"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <summary
        className="cursor-pointer px-4 py-3 text-sm font-black transition hover:opacity-90"
        style={{ color: "var(--asc-fg-2)" }}
      >
        {messages.unavailableTeams} ({teams.length})
      </summary>

      <div style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
        {teams.map((team) => (
          <div
            key={team.id}
            className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
          >
            <div>
              <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>{team.name}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                {team.game} · {team.memberCount}{" "}
                {getPlayerLabel(team.memberCount, playerLabel, playersLabel)}
              </p>
            </div>

            <Pill tone="blue">{team.reason}</Pill>
          </div>
        ))}
      </div>
    </details>
  );
}

function RequirementsList({
  teamSize,
  messages,
}: {
  teamSize: number;
  messages: TournamentDetailsMessages["panel"];
}) {
  return (
    <div
      className="border p-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {messages.requirements}
      </p>

      <div className="mt-3 grid gap-2 text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>
        <p>{messages.requirementSameGame}</p>
        <p>
          {formatTemplate(messages.requirementAtLeast, {
            count: String(teamSize),
          })}
        </p>
        <p>{messages.requirementNoPending}</p>
      </div>
    </div>
  );
}

function Cs2RequirementsBlock({
  readiness,
  messages,
}: {
  readiness: Cs2Readiness;
  messages: TournamentDetailsMessages["panel"];
}) {
  function Row({
    done,
    label,
    linkLabel,
  }: {
    done: boolean;
    label: string;
    linkLabel?: string;
  }) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-black"
            style={{ color: done ? "var(--asc-green)" : "var(--asc-live)" }}
          >
            {done ? "✓" : "✗"}
          </span>
          <span className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
            {label}
          </span>
        </div>
        {!done && linkLabel && (
          <NoticeLink href="/profile">{linkLabel}</NoticeLink>
        )}
      </div>
    );
  }

  return (
    <div
      className="border p-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
        {messages.cs2Requirements}
      </p>
      <p className="mt-1 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
        {messages.cs2RequirementsDescription}
      </p>
      <div className="mt-4 grid gap-3">
        <Row
          done={readiness.steamConnected}
          label={messages.cs2SteamConnected}
          linkLabel={messages.cs2ConnectSteam}
        />
        <Row
          done={readiness.faceitConnected}
          label={messages.cs2FaceitConnected}
          linkLabel={messages.cs2ConnectFaceit}
        />
        <Row
          done={readiness.faceitMatchesSteam}
          label={messages.cs2FaceitMatchesSteam}
        />
      </div>
      <div
        className="mt-4 border px-3 py-2 text-sm font-black"
        style={
          readiness.isReady
            ? {
                borderColor: "var(--asc-green-border)",
                background: "var(--asc-green-bg)",
                color: "var(--asc-green)",
              }
            : {
                borderColor: "var(--asc-live-border)",
                background: "var(--asc-live-bg)",
                color: "var(--asc-live)",
              }
        }
      >
        {readiness.isReady ? messages.cs2Ready : messages.cs2NotReady}
      </div>
    </div>
  );
}

function RiotRequirementsBlock({
  readiness,
  messages,
}: {
  readiness: RiotAccountReadiness;
  messages: TournamentDetailsMessages["panel"];
}) {
  return (
    <div
      className="border p-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
        {messages.riotRequirements}
      </p>
      <div className="mt-4 grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black"
              style={{ color: readiness.riotConnected ? "var(--asc-green)" : "var(--asc-live)" }}
            >
              {readiness.riotConnected ? "✓" : "✗"}
            </span>
            <span className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
              {messages.riotAccountConnected}
            </span>
          </div>
          {!readiness.riotConnected && (
            <NoticeLink href="/profile">{messages.riotConnectFromProfile}</NoticeLink>
          )}
        </div>
      </div>
      <div
        className="mt-4 border px-3 py-2 text-sm font-black"
        style={
          readiness.ready
            ? {
                borderColor: "var(--asc-green-border)",
                background: "var(--asc-green-bg)",
                color: "var(--asc-green)",
              }
            : {
                borderColor: "var(--asc-live-border)",
                background: "var(--asc-live-bg)",
                color: "var(--asc-live)",
              }
        }
      >
        {readiness.ready ? messages.riotReady : messages.riotNotReady}
      </div>
    </div>
  );
}

function TournamentRegistrationPanel({
  tournamentId,
  tournamentStatus,
  tournamentStatusLabel,
  registrationStatus,
  slotsRemaining,
  teamSize,
  isLoggedIn,
  isGuildMember,
  availableTeams,
  unavailableTeams,
  activeRegistrations,
  messages,
  statusLabels,
  playerLabel,
  playersLabel,
  isCs2 = false,
  cs2Readiness,
  isRiot = false,
  riotReadiness,
}: TournamentRegistrationPanelProps) {
  const hasOpenRegistration = activeRegistrations.some((registration) =>
    ["registered", "approved"].includes(registration.status),
  );

  if (tournamentStatus === "ended") {
    return (
      <PanelNotice
        title={messages.tournamentEnded}
        description={messages.tournamentEndedDescription}
        tone="gray"
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <PanelNotice
        title={messages.loginRequired}
        description={messages.loginRequiredDescription}
      >
        <NoticeLink href="/login">{messages.loginWithDiscord}</NoticeLink>
      </PanelNotice>
    );
  }

  if (!isGuildMember) {
    return (
      <PanelNotice
        title={messages.discordRequired}
        description={messages.discordRequiredDescription}
      >
        {discordInvite ? (
          <NoticeLink href={discordInvite} external>
            {messages.joinDiscord}
          </NoticeLink>
        ) : (
          <span
            className="border px-4 py-2 text-sm font-black"
            style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)" }}
          >
            {messages.discordInviteNotConfigured}
          </span>
        )}

        <NoticeLink href="/login">{messages.refreshLogin}</NoticeLink>
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
              messages={messages}
              statusLabels={statusLabels}
            />
          ))}
        </section>
      )}

      {registrationStatus !== "open" && (
        <PanelNotice
          title={messages.registrationClosed}
          description={messages.registrationClosedDescription}
          tone="red"
        />
      )}

      {registrationStatus === "open" && slotsRemaining <= 0 && (
        <PanelNotice
          title={messages.tournamentFull}
          description={messages.tournamentFullDescription}
          tone="red"
        />
      )}

      {registrationStatus === "open" &&
        slotsRemaining > 0 &&
        !hasOpenRegistration && (
          <section className="grid gap-4">
            {isCs2 && cs2Readiness && (
              <Cs2RequirementsBlock readiness={cs2Readiness} messages={messages} />
            )}

            {isRiot && riotReadiness && (
              <RiotRequirementsBlock readiness={riotReadiness} messages={messages} />
            )}

            {(isCs2 && cs2Readiness && !cs2Readiness.isReady) ||
            (isRiot && riotReadiness && !riotReadiness.ready) ? null : availableTeams.length > 0 ? (
              <RegisterForm
                tournamentId={tournamentId}
                availableTeams={availableTeams}
                messages={messages}
                playerLabel={playerLabel}
                playersLabel={playersLabel}
              />
            ) : (
              <PanelNotice
                title={messages.noEligibleTeams}
                description={messages.noEligibleTeamsDescription}
                tone="gray"
              >
                <NoticeLink href="/profile">{messages.manageTeams}</NoticeLink>
              </PanelNotice>
            )}

            <UnavailableTeamsList
              teams={unavailableTeams}
              messages={messages}
              playerLabel={playerLabel}
              playersLabel={playersLabel}
            />
            <RequirementsList teamSize={teamSize} messages={messages} />
          </section>
        )}

      <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
        {messages.tournamentStatus}:{" "}
        <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>{tournamentStatusLabel}</span>
      </p>
    </div>
  );
}

export { TournamentRegistrationPanel };
export default TournamentRegistrationPanel;
