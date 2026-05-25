"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { createTeam, respondToTeamInvite } from "@/actions/teamActions";
import CustomSelect from "@/components/CustomSelect";
import ConfirmDialogPortal from "@/components/ConfirmDialogPortal";

type TabId = "stats" | "teams" | "history" | "achievements";

type TournamentResult = {
  id: string;
  placement: number;
  points: number;
  note: string | null;
  awardedAt: string;
  snapshotTeamName: string | null;
  snapshotTeamGame: string | null;
  team: { name: string; game: { name: string } | null };
  tournament: { id: string; title: string; game: { name: string } | null };
};

type Team = {
  id: string;
  name: string;
  status: string;
  leaderId: string;
  rejectionReason: string | null;
  game: { name: string } | null;
  members: Array<{ userId: string; role: string | null }>;
};

type Invitation = {
  id: string;
  team: {
    name: string;
    game: { name: string } | null;
    members: Array<{ userId: string }>;
  };
  invitedBy: { username: string };
};

type Game = { slug: string; name: string };

type ProfileTabsProps = {
  tournamentResults: TournamentResult[];
  teams: Team[];
  invitations: Invitation[];
  userId: string;
  isGuildMember: boolean;
  dbGames: Game[];
  labels: {
    by: string;
    members: string;
    member: string;
    leader: string;
    open: string;
    accept: string;
    decline: string;
    teamName: string;
    teamNamePlaceholder: string;
    game: string;
    selectGame: string;
    teamGame: string;
    createTeam: string;
    ascendraDiscordRequired: string;
    discordRequiredDescription: string;
    results: string;
    result: string;
    best: string;
    pts: string;
  };
  sectionLabels: {
    invitations: string;
    teamInvitations: string;
    noPendingInvitations: string;
    myTeams: string;
    noTeamsTitle: string;
    noTeamsDescription: string;
    createTeam: string;
    startNewTeam: string;
    createTeamMeta: string;
    discordRequiredMeta: string;
    tournamentHistory: string;
    noTournamentResults: string;
  };
  statuses: {
    active: string;
    pending: string;
    rejected: string;
    member: string;
    notMember: string;
  };
  heroLabels: { team: string; teams: string };
};

const TABS: { id: TabId; label: string }[] = [
  { id: "stats", label: "Stats" },
  { id: "teams", label: "Teams" },
  { id: "history", label: "History" },
  { id: "achievements", label: "Achievements" },
];

function getCount(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

function Pill({
  label,
  tone = "violet",
}: {
  label: string;
  tone?: "green" | "blue" | "red" | "gray" | "violet";
}) {
  const styleMap: Record<string, React.CSSProperties> = {
    green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
    blue: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
    red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
  };
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={styleMap[tone]}>
      {label}
    </span>
  );
}

function StatusBadge({ status, statuses }: { status: string; statuses: ProfileTabsProps["statuses"] }) {
  const s = status.toLowerCase();
  const tone = s === "approved" || s === "member" ? "green"
    : s === "pending" ? "blue"
    : s === "rejected" || s === "not member" ? "red"
    : "gray";
  const map: Record<string, string> = {
    approved: statuses.active, pending: statuses.pending,
    rejected: statuses.rejected, member: statuses.member, "not member": statuses.notMember,
  };
  return <Pill label={map[s] ?? status} tone={tone} />;
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>{eyebrow}</p>
        <h3 className="mt-1 text-xl font-black uppercase" style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}>{title}</h3>
      </div>
      {action}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="relative overflow-hidden border"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", ...style }}
    >
      <div aria-hidden="true" style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTop: "1px solid var(--asc-accent)", borderLeft: "1px solid var(--asc-accent)", opacity: 0.6, zIndex: 1 }} />
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border px-3 py-2 text-xs font-black" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-0)" }}>
      <p style={{ color: "var(--asc-fg-3)", marginBottom: 2 }}>{label}</p>
      <p style={{ color: "var(--asc-accent)" }}>{payload[0].value.toLocaleString()} PTS</p>
    </div>
  );
}

function StatsTab({ tournamentResults, labels }: Pick<ProfileTabsProps, "tournamentResults" | "labels">) {
  const recent = tournamentResults.slice(0, 10);
  const chronological = recent.slice().reverse();
  const chartData = chronological.map((r, i) => {
    const cumPoints = chronological.slice(0, i + 1).reduce((s, x) => s + x.points, 0);
    return {
      name: new Date(r.awardedAt).toLocaleDateString("en-GB", { month: "short", day: "2-digit" }),
      points: cumPoints,
    };
  });

  return (
    <div className="grid gap-6">
      <Card>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>▲ PERFORMANCE</p>
          <h3 className="mt-1 text-xl font-black uppercase" style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}>POINT HISTORY</h3>
        </div>
        <div className="p-5">
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--asc-fg-3)" }}>No tournament data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--asc-line-soft)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--asc-fg-3)", fontFamily: "Barlow, sans-serif", fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--asc-fg-3)", fontFamily: "Barlow, sans-serif", fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="var(--asc-accent)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--asc-accent)", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>▲ RECENT MATCHES</p>
          <h3 className="mt-1 text-xl font-black uppercase" style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}>MATCH HISTORY</h3>
        </div>
        {tournamentResults.length === 0 ? (
          <p className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>No results yet.</p>
        ) : (
          <>
            <div
              className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] md:grid md:grid-cols-[minmax(0,1fr)_120px_80px_80px_100px]"
              style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
            >
              <span>Tournament</span>
              <span>Team</span>
              <span>Place</span>
              <span>PTS</span>
              <span>Date</span>
            </div>
            {tournamentResults.slice(0, 6).map((r) => {
              const teamName = r.snapshotTeamName ?? r.team.name;
              const gameName = r.snapshotTeamGame ?? r.team.game?.name ?? "—";
              const date = new Date(r.awardedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
              return (
                <Link
                  key={r.id}
                  href={`/tournaments/${r.tournament.id}`}
                  className="grid gap-2 px-5 py-4 transition hover:bg-white/[0.02] md:grid-cols-[minmax(0,1fr)_120px_80px_80px_100px] md:items-center"
                  style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-sm" style={{ color: "var(--asc-fg-0)" }}>{r.tournament.title}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--asc-fg-3)" }}>{gameName}</p>
                  </div>
                  <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>{teamName}</p>
                  <Pill label={`#${r.placement}`} tone="blue" />
                  <Pill label={`${r.points} ${labels.pts}`} tone="green" />
                  <p className="text-xs tabular-nums" style={{ color: "var(--asc-fg-3)" }}>{date}</p>
                </Link>
              );
            })}
          </>
        )}
      </Card>
    </div>
  );
}

function InviteResponseButton({
  inviteId,
  response,
  teamName,
  labels,
}: {
  inviteId: string;
  response: "accepted" | "rejected";
  teamName: string;
  labels: ProfileTabsProps["labels"];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isAccept = response === "accepted";

  function runAction() {
    const formData = new FormData();

    formData.set("inviteId", inviteId);
    formData.set("response", response);

    startTransition(async () => {
      await respondToTeamInvite(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={`px-4 py-2 text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
          isAccept ? "" : "border"
        }`}
        style={{
          ...(isAccept
            ? {
                background: "oklch(0.55 0.14 150)",
                color: "#fff",
              }
            : {
                borderColor: "oklch(0.50 0.20 25 / 0.5)",
                color: "var(--asc-live)",
                background: "transparent",
              }),
          clipPath:
            "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        }}
      >
        {isAccept ? labels.accept : labels.decline}
      </button>

      <ConfirmDialogPortal
        open={open}
        eyebrow="Confirmation"
        title={
          isAccept ? "Accept team invitation?" : "Decline team invitation?"
        }
        description={
          isAccept
            ? `Join ${teamName}? You will become a member of this team.`
            : `Decline the invitation to join ${teamName}?`
        }
        confirmLabel={isAccept ? labels.accept : labels.decline}
        cancelLabel="Cancel"
        pendingLabel={isAccept ? "Accepting..." : "Declining..."}
        pending={pending}
        variant={isAccept ? "success" : "danger"}
        onConfirm={runAction}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

function CreateTeamForm({
  dbGames,
  labels,
}: {
  dbGames: Game[];
  labels: ProfileTabsProps["labels"];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(true);
  }

  function runAction() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    startTransition(async () => {
      await createTeam(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5 p-5">
        <div className="relative z-50 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span
              className="text-xs font-black uppercase tracking-[0.12em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {labels.teamName}
            </span>

            <input
              name="name"
              required
              placeholder={labels.teamNamePlaceholder}
              className="border px-4 py-3 outline-none transition"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-2)",
                color: "var(--asc-fg-0)",
              }}
            />
          </label>

          <label className="grid gap-2">
            <span
              className="text-xs font-black uppercase tracking-[0.12em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {labels.game}
            </span>

            <CustomSelect
              name="gameSlug"
              required
              placeholder={labels.selectGame}
              options={dbGames.map((game) => ({
                value: game.slug,
                label: game.name,
                description: labels.teamGame,
              }))}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-fit px-5 py-3 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--asc-accent-2)",
            boxShadow: "0 0 20px var(--asc-accent-glow)",
            clipPath:
              "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
          }}
        >
          {pending ? "Creating..." : labels.createTeam}
        </button>
      </form>

      <ConfirmDialogPortal
        open={open}
        eyebrow="Confirmation"
        title="Create team?"
        description="Create this team with the selected game. You will become the team leader."
        confirmLabel={labels.createTeam}
        cancelLabel="Cancel"
        pendingLabel="Creating..."
        pending={pending}
        variant="primary"
        onConfirm={runAction}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

function TeamsTab({
  teams, invitations, userId, isGuildMember, dbGames, labels, sectionLabels, statuses, heroLabels,
}: Pick<ProfileTabsProps, "teams" | "invitations" | "userId" | "isGuildMember" | "dbGames" | "labels" | "sectionLabels" | "statuses" | "heroLabels">) {
  return (
    <div className="grid gap-6">
      {invitations.length > 0 && (
        <Card>
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
          >
            <p
              className="text-xs font-black uppercase tracking-[0.16em]"
              style={{ color: "var(--asc-accent)" }}
            >
              ▲ {sectionLabels.invitations}
            </p>
            <h3
              className="mt-1 text-xl font-black uppercase"
              style={{
                color: "var(--asc-fg-0)",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
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
                <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                  {inv.team.name}
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {inv.team.game?.name ?? "—"} · {inv.team.members.length}{" "}
                  {getCount(
                    inv.team.members.length,
                    labels.member,
                    labels.members,
                  )}{" "}
                  · {labels.by} {inv.invitedBy.username}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <InviteResponseButton
                  inviteId={inv.id}
                  response="accepted"
                  teamName={inv.team.name}
                  labels={labels}
                />

                <InviteResponseButton
                  inviteId={inv.id}
                  response="rejected"
                  teamName={inv.team.name}
                  labels={labels}
                />
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
        >
          <p
            className="text-xs font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            ▲ {sectionLabels.myTeams}
          </p>
          <h3
            className="mt-1 text-xl font-black uppercase"
            style={{
              color: "var(--asc-fg-0)",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {sectionLabels.myTeams} · {teams.length}{" "}
            {getCount(teams.length, heroLabels.team, heroLabels.teams)}
          </h3>
        </div>
        {teams.length === 0 ? (
          <div className="p-5">
            <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
              {sectionLabels.noTeamsTitle}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
              {sectionLabels.noTeamsDescription}
            </p>
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
                      position: "absolute",
                      top: 9,
                      left: 9,
                      width: 8,
                      height: 8,
                      borderTop: "1px solid var(--asc-accent)",
                      borderLeft: "1px solid var(--asc-accent)",
                      opacity: 0.5,
                    }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate font-black"
                        style={{
                          color: "var(--asc-fg-0)",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 18,
                        }}
                      >
                        {team.name}
                      </p>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        {team.game?.name ?? "—"} · {team.members.length}{" "}
                        {getCount(
                          team.members.length,
                          labels.member,
                          labels.members,
                        )}
                      </p>
                    </div>
                    <StatusBadge status={team.status} statuses={statuses} />
                  </div>
                  {team.rejectionReason && (
                    <p
                      className="mt-2 text-xs"
                      style={{ color: "var(--asc-live)" }}
                    >
                      {team.rejectionReason}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <p
                      className="text-xs font-black uppercase tracking-[0.12em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {isLeader
                        ? labels.leader
                        : (membership?.role ?? statuses.member)}
                    </p>
                    <Link
                      href={`/profile/teams/${team.id}`}
                      className="px-4 py-2 text-xs font-black transition hover:opacity-90"
                      style={{
                        background: "var(--asc-accent-2)",
                        color: "#fff",
                      }}
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
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
        >
          <p
            className="text-xs font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            ▲ {sectionLabels.createTeam}
          </p>
          <h3
            className="mt-1 text-xl font-black uppercase"
            style={{
              color: "var(--asc-fg-0)",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {sectionLabels.startNewTeam}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {isGuildMember
              ? sectionLabels.createTeamMeta
              : sectionLabels.discordRequiredMeta}
          </p>
        </div>
        {isGuildMember ? (
          <CreateTeamForm dbGames={dbGames} labels={labels} />
        ) : (
          <div className="p-5">
            <div
              className="border p-4"
              style={{
                borderColor: "oklch(0.50 0.20 285 / 0.4)",
                background: "var(--asc-accent-dim)",
              }}
            >
              <p className="font-black" style={{ color: "var(--asc-accent)" }}>
                {labels.ascendraDiscordRequired}
              </p>
              <p
                className="mt-2 text-sm leading-6"
                style={{ color: "var(--asc-fg-2)" }}
              >
                {labels.discordRequiredDescription}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function HistoryTab({ tournamentResults, labels }: Pick<ProfileTabsProps, "tournamentResults" | "labels">) {
  return (
    <Card>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>▲ FULL RECORD</p>
        <h3 className="mt-1 text-xl font-black uppercase" style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}>
          TOURNAMENT HISTORY · {tournamentResults.length} {getCount(tournamentResults.length, labels.result, labels.results)}
        </h3>
      </div>
      {tournamentResults.length === 0 ? (
        <p className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>No tournament results yet.</p>
      ) : (
        <>
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] md:grid md:grid-cols-[minmax(0,1fr)_130px_80px_80px_110px]"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
          >
            <span>Tournament</span>
            <span>Team</span>
            <span>Place</span>
            <span>PTS</span>
            <span>Date</span>
          </div>
          {tournamentResults.map((r) => {
            const teamName = r.snapshotTeamName ?? r.team.name;
            const gameName = r.snapshotTeamGame ?? r.team.game?.name ?? "—";
            const date = new Date(r.awardedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
            return (
              <Link
                key={r.id}
                href={`/tournaments/${r.tournament.id}`}
                className="grid gap-2 px-5 py-4 transition hover:bg-white/[0.02] md:grid-cols-[minmax(0,1fr)_130px_80px_80px_110px] md:items-center"
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-sm" style={{ color: "var(--asc-fg-0)" }}>{r.tournament.title}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--asc-fg-3)" }}>{gameName}</p>
                </div>
                <p className="text-sm truncate" style={{ color: "var(--asc-fg-2)" }}>{teamName}</p>
                <Pill label={`#${r.placement}`} tone="blue" />
                <Pill label={`${r.points} ${labels.pts}`} tone="green" />
                <p className="text-xs tabular-nums" style={{ color: "var(--asc-fg-3)" }}>{date}</p>
              </Link>
            );
          })}
        </>
      )}
    </Card>
  );
}

function AchievementsTab() {
  return (
    <Card>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>▲ PLAYER ACHIEVEMENTS</p>
        <h3 className="mt-1 text-xl font-black uppercase" style={{ color: "var(--asc-fg-0)", fontFamily: "'Barlow Condensed', sans-serif" }}>ACHIEVEMENTS</h3>
      </div>
      <div className="p-10 text-center">
        <p className="text-4xl font-black uppercase" style={{ color: "var(--asc-fg-3)", fontFamily: "'Barlow Condensed', sans-serif", opacity: 0.4 }}>COMING SOON</p>
        <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>Achievements will be unlocked as you compete in tournaments.</p>
      </div>
    </Card>
  );
}

export default function ProfileTabs(props: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("stats");

  return (
    <div>
      {/* Tab navigation */}
      <div
        className="mb-6 flex"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-3 text-xs font-black uppercase tracking-[0.14em] transition"
              style={{
                color: isActive ? "var(--asc-fg-0)" : "var(--asc-fg-3)",
                borderBottom: isActive ? "2px solid var(--asc-accent)" : "2px solid transparent",
                marginBottom: -1,
                background: "transparent",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "stats" && (
        <StatsTab tournamentResults={props.tournamentResults} labels={props.labels} />
      )}
      {activeTab === "teams" && (
        <TeamsTab
          teams={props.teams}
          invitations={props.invitations}
          userId={props.userId}
          isGuildMember={props.isGuildMember}
          dbGames={props.dbGames}
          labels={props.labels}
          sectionLabels={props.sectionLabels}
          statuses={props.statuses}
          heroLabels={props.heroLabels}
        />
      )}
      {activeTab === "history" && (
        <HistoryTab tournamentResults={props.tournamentResults} labels={props.labels} />
      )}
      {activeTab === "achievements" && <AchievementsTab />}
    </div>
  );
}
