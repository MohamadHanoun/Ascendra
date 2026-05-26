import {
  cancelTeamInvite,
  deleteTeam,
  invitePlayerToTeam,
  removeTeamMember,
  submitTeamForReview,
  updateTeam,
} from "@/actions/teamActions";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";
import PlayerInviteSearch from "@/components/PlayerInviteSearch";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

type TeamManagementCardProps = {
  team: {
    id: string;
    name: string;
    game: string;
    status: string;
    rejectionReason: string | null;
    members: {
      id: string;
      role: string;
      user: {
        id: string;
        username: string;
        avatar: string | null;
      };
    }[];
    invites: {
      id: string;
      status: string;
      invitedUser: {
        username: string;
      };
    }[];
  };
};

// ─── i18n ─────────────────────────────────────────────────────────────────────

type TeamCardMessages = {
  statuses: { approved: string; pendingReview: string; rejected: string; draft: string };
  statusDescs: { approved: string; pending: string; rejected: string; draft: string };
  stats: { members: string; invites: string };
  settings: { title: string; desc: string; teamName: string; game: string; saveChanges: string; approvedLock: string };
  invite: { title: string; desc: string; pendingInvitation: string; cancel: string; invitationsLocked: string };
  members: { title: string; desc: string; leader: string; noMembers: string; remove: string };
  actions: { title: string; desc: string; submitReview: string; pendingReviewMsg: string; teamRejected: string; reasonPrefix: string; approvedCannotDelete: string };
  deleteConfirm: string;
};

const teamCardMessages: Record<Locale, TeamCardMessages> = {
  en: {
    statuses: { approved: "Approved", pendingReview: "Pending Review", rejected: "Rejected", draft: "Draft" },
    statusDescs: {
      approved: "This team is approved and ready for future Ascendra tournaments.",
      pending: "This team is waiting for admin review. You can still update it before approval.",
      rejected: "This team was rejected. You can edit it and submit it again.",
      draft: "This team is still a draft. Invite players, then submit it for review.",
    },
    stats: { members: "Members", invites: "Invites" },
    settings: {
      title: "Team Settings",
      desc: "Update the team name or game before approval.",
      teamName: "Team Name",
      game: "Game",
      saveChanges: "Save Changes",
      approvedLock: "Approved teams are locked for players. Contact Ascendra staff if this team needs changes.",
    },
    invite: {
      title: "Invite Player",
      desc: "Search for registered Ascendra players and send them a team invitation.",
      pendingInvitation: "Pending invitation",
      cancel: "Cancel",
      invitationsLocked: "Invitations are locked after team approval.",
    },
    members: {
      title: "Members",
      desc: "Players currently connected to this team.",
      leader: "Leader",
      noMembers: "No members yet. Invite players to build your team.",
      remove: "Remove",
    },
    actions: {
      title: "Actions",
      desc: "Submit the team when it is ready, or delete it if you no longer need it.",
      submitReview: "Submit for Review",
      pendingReviewMsg: "This team is already waiting for admin review.",
      teamRejected: "Team rejected",
      reasonPrefix: "Reason: ",
      approvedCannotDelete: "This team is approved and cannot be deleted by players.",
    },
    deleteConfirm: "Are you sure you want to delete this team?",
  },
  ar: {
    statuses: { approved: "معتمد", pendingReview: "قيد المراجعة", rejected: "مرفوض", draft: "مسودة" },
    statusDescs: {
      approved: "هذا الفريق معتمد وجاهز للمشاركة في بطولات Ascendra القادمة.",
      pending: "هذا الفريق بانتظار مراجعة المشرفين. يمكنك تحديثه قبل الاعتماد.",
      rejected: "تم رفض هذا الفريق. يمكنك تعديله وإعادة تقديمه.",
      draft: "هذا الفريق لا يزال مسودة. ادعُ لاعبين ثم قدّمه للمراجعة.",
    },
    stats: { members: "الأعضاء", invites: "الدعوات" },
    settings: {
      title: "إعدادات الفريق",
      desc: "عدّل اسم الفريق أو اللعبة قبل الاعتماد.",
      teamName: "اسم الفريق",
      game: "اللعبة",
      saveChanges: "حفظ التغييرات",
      approvedLock: "الفرق المعتمدة مقفلة للاعبين. تواصل مع فريق Ascendra إذا احتاج هذا الفريق إلى تغييرات.",
    },
    invite: {
      title: "دعوة لاعب",
      desc: "ابحث عن لاعبي Ascendra المسجلين وأرسل لهم دعوة للانضمام إلى الفريق.",
      pendingInvitation: "دعوة معلقة",
      cancel: "إلغاء",
      invitationsLocked: "الدعوات مقفلة بعد اعتماد الفريق.",
    },
    members: {
      title: "الأعضاء",
      desc: "اللاعبون المرتبطون حاليًا بهذا الفريق.",
      leader: "القائد",
      noMembers: "لا أعضاء بعد. ادعُ لاعبين لبناء فريقك.",
      remove: "إزالة",
    },
    actions: {
      title: "الإجراءات",
      desc: "قدّم الفريق عندما يكون جاهزًا، أو احذفه إذا لم تعد بحاجة إليه.",
      submitReview: "تقديم للمراجعة",
      pendingReviewMsg: "هذا الفريق بانتظار مراجعة المشرف.",
      teamRejected: "تم رفض الفريق",
      reasonPrefix: "السبب: ",
      approvedCannotDelete: "هذا الفريق معتمد ولا يمكن للاعبين حذفه.",
    },
    deleteConfirm: "هل أنت متأكد من حذف هذا الفريق؟",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusStyleMap: Record<string, React.CSSProperties> = {
  approved: { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" },
  pending: { borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)", color: "var(--asc-amber)" },
  rejected: { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" },
  default: { borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" },
};

function getStatusStyle(status: string): React.CSSProperties {
  return statusStyleMap[status] ?? statusStyleMap.default;
}

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default async function TeamManagementCard({ team }: TeamManagementCardProps) {
  const locale = await getLocale();
  const msgs = teamCardMessages[locale];

  const canEdit = team.status === "draft" || team.status === "pending" || team.status === "rejected";
  const canSubmit = team.status === "draft" || team.status === "rejected";
  const canDelete = team.status !== "approved";

  const pendingInvites = team.invites.filter((invite) => invite.status === "pending");
  const leader = team.members.find((member) => member.role === "leader");
  const regularMembers = team.members.filter((member) => member.role !== "leader");

  const statusLabel =
    team.status === "approved" ? msgs.statuses.approved
    : team.status === "pending" ? msgs.statuses.pendingReview
    : team.status === "rejected" ? msgs.statuses.rejected
    : msgs.statuses.draft;

  const statusDescription =
    team.status === "approved" ? msgs.statusDescs.approved
    : team.status === "pending" ? msgs.statusDescs.pending
    : team.status === "rejected" ? msgs.statusDescs.rejected
    : msgs.statusDescs.draft;

  return (
    <article className="asc-card overflow-hidden border" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="p-6" style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-table-head-bg)" }}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex border px-4 py-1 text-sm font-bold" style={getStatusStyle(team.status)}>
                {statusLabel}
              </span>
              <span
                className="inline-flex border px-4 py-1 text-sm font-bold"
                style={{ borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)", color: "var(--asc-blue)" }}
              >
                {team.game}
              </span>
            </div>
            <h3 className="text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>{team.name}</h3>
            <p className="mt-3 max-w-2xl leading-7" style={{ color: "var(--asc-fg-2)" }}>
              {statusDescription}
            </p>
          </div>

          <div className="grid min-w-[160px] grid-cols-2 gap-3 text-center">
            <div className="border p-4" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
              <p className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{team.members.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>{msgs.stats.members}</p>
            </div>
            <div className="border p-4" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
              <p className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{pendingInvites.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>{msgs.stats.invites}</p>
            </div>
          </div>
        </div>
      </div>

      {team.status === "rejected" && team.rejectionReason && (
        <div
          className="p-6"
          style={{ borderBottom: "1px solid oklch(0.50 0.20 25 / 0.3)", background: "oklch(0.25 0.18 25 / 0.10)" }}
        >
          <p className="mb-2 font-bold" style={{ color: "var(--asc-live)" }}>{msgs.actions.teamRejected}</p>
          <p className="leading-7" style={{ color: "var(--asc-fg-2)" }}>{msgs.actions.reasonPrefix}{team.rejectionReason}</p>
        </div>
      )}

      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="grid gap-6">
          {/* Team Settings */}
          <div className="border p-5" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{msgs.settings.title}</h4>
                <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>{msgs.settings.desc}</p>
              </div>
            </div>

            <form action={updateTeam} className="grid gap-4">
              <input type="hidden" name="teamId" value={team.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
                    {msgs.settings.teamName}
                  </span>
                  <input
                    name="name"
                    defaultValue={team.name}
                    disabled={!canEdit}
                    required
                    className="border px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={inputStyle}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
                    {msgs.settings.game}
                  </span>
                  <select
                    name="game"
                    defaultValue={team.game}
                    disabled={!canEdit}
                    className="border px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={inputStyle}
                  >
                    {games.map((game) => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                </label>
              </div>

              {canEdit ? (
                <button
                  type="submit"
                  className="w-fit border px-4 py-3 font-bold transition hover:opacity-90 sm:w-fit"
                  style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", color: "var(--asc-accent)", background: "var(--asc-accent-dim)" }}
                >
                  {msgs.settings.saveChanges}
                </button>
              ) : (
                <p
                  className="p-4 text-sm leading-6"
                  style={{ borderLeft: "2px solid oklch(0.55 0.14 150 / 0.6)", background: "oklch(0.25 0.12 150 / 0.12)", color: "var(--asc-green)" }}
                >
                  {msgs.settings.approvedLock}
                </p>
              )}
            </form>
          </div>

          {/* Invite Player */}
          <div className="border p-5" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
            <div className="mb-5">
              <h4 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{msgs.invite.title}</h4>
              <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>{msgs.invite.desc}</p>
            </div>

            {canEdit ? (
              <PlayerInviteSearch teamId={team.id} />
            ) : (
              <p
                className="p-4 text-sm leading-6"
                style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-2)" }}
              >
                {msgs.invite.invitationsLocked}
              </p>
            )}

            {pendingInvites.length > 0 && (
              <div className="mt-5 grid gap-3">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                    style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
                  >
                    <div>
                      <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>{invite.invitedUser.username}</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--asc-amber)" }}>{msgs.invite.pendingInvitation}</p>
                    </div>
                    {canEdit && (
                      <form action={cancelTeamInvite}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <button
                          type="submit"
                          className="border px-4 py-2 text-sm font-bold transition hover:opacity-90"
                          style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", color: "var(--asc-live)", background: "transparent" }}
                        >
                          {msgs.invite.cancel}
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid content-start gap-6">
          {/* Members */}
          <div className="border p-5" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
            <div className="mb-5">
              <h4 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{msgs.members.title}</h4>
              <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>{msgs.members.desc}</p>
            </div>

            <div className="grid gap-3">
              {leader && (
                <div className="p-4" style={{ border: "1px solid oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="grid h-10 w-10 shrink-0 place-items-center text-sm font-black"
                        style={{ background: "oklch(0.30 0.10 285 / 0.4)", color: "var(--asc-accent)" }}
                      >
                        {getInitials(leader.user.username)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold" style={{ color: "var(--asc-fg-0)" }}>{leader.user.username}</p>
                        <p className="text-sm" style={{ color: "var(--asc-accent)" }}>{msgs.members.leader}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {regularMembers.length === 0 ? (
                <p
                  className="p-4 text-sm leading-6"
                  style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-2)" }}
                >
                  {msgs.members.noMembers}
                </p>
              ) : (
                regularMembers.map((member) => (
                  <div key={member.id} className="p-4" style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="grid h-10 w-10 shrink-0 place-items-center text-sm font-black"
                          style={{ background: "var(--asc-bg-2)", color: "var(--asc-fg-2)" }}
                        >
                          {getInitials(member.user.username)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold" style={{ color: "var(--asc-fg-0)" }}>{member.user.username}</p>
                          <p className="text-sm capitalize" style={{ color: "var(--asc-fg-3)" }}>{member.role}</p>
                        </div>
                      </div>
                      {canEdit && (
                        <form action={removeTeamMember}>
                          <input type="hidden" name="teamId" value={team.id} />
                          <input type="hidden" name="memberId" value={member.id} />
                          <button
                            type="submit"
                            className="border px-4 py-2 text-sm font-bold transition hover:opacity-90"
                            style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", color: "var(--asc-live)", background: "transparent" }}
                          >
                            {msgs.members.remove}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border p-5" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
            <h4 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{msgs.actions.title}</h4>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{msgs.actions.desc}</p>

            <div className="mt-5 grid gap-3">
              {canSubmit && (
                <form action={submitTeamForReview}>
                  <input type="hidden" name="teamId" value={team.id} />
                  <button
                    type="submit"
                    className="w-full px-5 py-3 font-bold text-white transition hover:opacity-90"
                    style={{ background: "oklch(0.55 0.14 150)" }}
                  >
                    {msgs.actions.submitReview}
                  </button>
                </form>
              )}

              {team.status === "pending" && (
                <p
                  className="p-4 text-sm leading-6"
                  style={{ border: "1px solid oklch(0.65 0.16 75 / 0.4)", background: "oklch(0.25 0.14 75 / 0.12)", color: "var(--asc-amber)" }}
                >
                  {msgs.actions.pendingReviewMsg}
                </p>
              )}

              {canDelete && (
                <ConfirmDeleteForm
                  id={team.id}
                  action={deleteTeam}
                  message={msgs.deleteConfirm}
                />
              )}

              {team.status === "approved" && (
                <p
                  className="p-4 text-sm leading-6"
                  style={{ border: "1px solid oklch(0.55 0.14 150 / 0.4)", background: "oklch(0.25 0.12 150 / 0.12)", color: "var(--asc-green)" }}
                >
                  {msgs.actions.approvedCannotDelete}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
