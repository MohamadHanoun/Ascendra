import type { ReactNode } from "react";

import {
  deleteAnnouncementInline,
  markAnnouncementImportantInline,
  publishAnnouncementInline,
  unmarkAnnouncementImportantInline,
  unpublishAnnouncementInline,
  updateAnnouncementInline,
} from "@/actions/adminAnnouncementInlineActions";
import InlineAdminAnnouncementForm from "@/components/InlineAdminAnnouncementForm";
import { prisma } from "@/lib/prisma";

const categories = ["Tournament", "Community", "Update", "Maintenance", "Event"];

type AnnouncementAction = (formData: FormData) => Promise<{
  ok: boolean;
  message: string;
  redirectTo?: string;
}>;

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

const pillStyleMap: Record<string, React.CSSProperties> = {
  green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
  yellow: { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" },
  red: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
  gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
};

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
      {children}
    </span>
  );
}

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "green" | "yellow" | "red" | "gray" | "violet";
}) {
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={pillStyleMap[tone]}>
      {children}
    </span>
  );
}

function StatusBadges({ published, important }: { published: boolean; important: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Pill tone={published ? "green" : "gray"}>{published ? "Published" : "Hidden"}</Pill>
      {important && <Pill tone="yellow">Important</Pill>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function SmallAction({
  action,
  announcementId,
  label,
  pendingLabel,
  variant = "secondary",
}: {
  action: AnnouncementAction;
  announcementId: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "success" | "danger" | "secondary";
}) {
  return (
    <InlineAdminAnnouncementForm
      action={action}
      buttonLabel={label}
      pendingLabel={pendingLabel}
      variant={variant}
      className="grid gap-2"
    >
      <input type="hidden" name="announcementId" value={announcementId} />
    </InlineAdminAnnouncementForm>
  );
}

function formatDate(date: Date) {
  return date.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminAnnouncementList() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ published: "desc" }, { important: "desc" }, { createdAt: "desc" }],
  });

  const publishedCount = announcements.filter((a) => a.published).length;
  const hiddenCount = announcements.length - publishedCount;
  const importantCount = announcements.filter((a) => a.important).length;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            Manage announcements
          </p>
          <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Announcements list</h2>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <Stat label="Total" value={announcements.length} />
          <Stat label="Published" value={publishedCount} />
          <Stat label="Hidden" value={hiddenCount} />
          <Stat label="Important" value={importantCount} />
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-3)" }}>
          No announcements found.
        </div>
      ) : (
        <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] xl:grid xl:grid-cols-[minmax(0,1fr)_150px_150px_160px] xl:gap-5"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "oklch(0.08 0.02 287)", color: "var(--asc-fg-3)" }}
          >
            <span>Announcement</span>
            <span>Category</span>
            <span>Status</span>
            <span>Created</span>
          </div>

          <div>
            {announcements.map((announcement, idx) => (
              <article
                key={announcement.id}
                className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.035]"
                style={idx < announcements.length - 1 ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_150px_150px_160px] xl:items-center xl:gap-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{announcement.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{announcement.description}</p>
                  </div>

                  <Pill tone="violet">{announcement.category}</Pill>
                  <StatusBadges published={announcement.published} important={announcement.important} />
                  <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>{formatDate(announcement.createdAt)}</p>
                </div>

                <details className="border" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}>
                  <summary
                    className="cursor-pointer px-4 py-3 text-sm font-black transition"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    Edit and actions
                  </summary>

                  <div
                    className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start"
                    style={{ borderTop: "1px solid var(--asc-line-soft)" }}
                  >
                    <InlineAdminAnnouncementForm
                      action={updateAnnouncementInline}
                      buttonLabel="Save changes"
                      pendingLabel="Saving..."
                      className="grid gap-4"
                    >
                      <input type="hidden" name="announcementId" value={announcement.id} />
                      <input type="hidden" name="published" value={announcement.published ? "true" : "false"} />
                      <input type="hidden" name="important" value={announcement.important ? "true" : "false"} />

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <label className="grid gap-2">
                          <FieldLabel>Title</FieldLabel>
                          <input name="title" required defaultValue={announcement.title} className="border px-4 py-3 text-white outline-none transition" style={inputStyle} />
                        </label>

                        <label className="grid gap-2">
                          <FieldLabel>Category</FieldLabel>
                          <select name="category" required defaultValue={announcement.category} className="border px-4 py-3 text-white outline-none transition" style={inputStyle}>
                            {categories.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="grid gap-2">
                        <FieldLabel>Description</FieldLabel>
                        <textarea
                          name="description"
                          required
                          defaultValue={announcement.description}
                          className="min-h-24 resize-y border px-4 py-3 text-sm leading-6 text-white outline-none transition"
                          style={inputStyle}
                        />
                      </label>
                    </InlineAdminAnnouncementForm>

                    <aside className="grid content-start gap-3">
                      {announcement.published ? (
                        <SmallAction action={unpublishAnnouncementInline} announcementId={announcement.id} label="Unpublish" pendingLabel="Unpublishing..." variant="danger" />
                      ) : (
                        <SmallAction action={publishAnnouncementInline} announcementId={announcement.id} label="Publish" pendingLabel="Publishing..." variant="success" />
                      )}

                      {announcement.important ? (
                        <SmallAction action={unmarkAnnouncementImportantInline} announcementId={announcement.id} label="Remove important" pendingLabel="Updating..." />
                      ) : (
                        <SmallAction action={markAnnouncementImportantInline} announcementId={announcement.id} label="Mark important" pendingLabel="Updating..." variant="success" />
                      )}

                      <InlineAdminAnnouncementForm
                        action={deleteAnnouncementInline}
                        buttonLabel="Delete"
                        pendingLabel="Deleting..."
                        variant="danger"
                        className="grid gap-2"
                        confirmTitle="Delete announcement?"
                        confirmDescription={`Delete ${announcement.title}? This cannot be undone.`}
                        confirmLabel="Delete permanently"
                      >
                        <input type="hidden" name="announcementId" value={announcement.id} />
                      </InlineAdminAnnouncementForm>
                    </aside>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
