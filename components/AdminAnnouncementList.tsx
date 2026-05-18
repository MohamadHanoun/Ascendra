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

const categories = [
  "Tournament",
  "Community",
  "Update",
  "Maintenance",
  "Event",
];

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

function StatusBadge({
  published,
  important,
}: {
  published: boolean;
  important: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`inline-flex w-fit rounded border px-3 py-1 text-xs font-bold ${
          published
            ? "border-green-500/20 bg-green-500/10 text-green-300"
            : "border-white/10 bg-white/5 text-gray-300"
        }`}
      >
        {published ? "Published" : "Hidden"}
      </span>

      {important && (
        <span className="inline-flex w-fit rounded border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
          Important
        </span>
      )}
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
  action: (formData: FormData) => Promise<{
    ok: boolean;
    message: string;
    redirectTo?: string;
  }>;
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
  return date.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminAnnouncementList() {
  const announcements = await prisma.announcement.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
          Manage Announcements
        </p>

        <h2 className="mt-2 text-4xl font-black text-white">
          Announcements list
        </h2>

        <p className="mt-3 max-w-3xl text-gray-400">
          Edit announcements, publish or hide them, mark important items, and
          delete announcements with confirmation.
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          No announcements found.
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
            >
              <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-black text-white">
                        {announcement.title}
                      </h3>

                      <StatusBadge
                        published={announcement.published}
                        important={announcement.important}
                      />
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                      {announcement.category} · Created{" "}
                      {formatDate(announcement.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-8 p-6 xl:grid-cols-[1fr_280px] xl:items-start">
                <InlineAdminAnnouncementForm
                  action={updateAnnouncementInline}
                  buttonLabel="Save changes"
                  pendingLabel="Saving..."
                >
                  <input
                    type="hidden"
                    name="announcementId"
                    value={announcement.id}
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Title
                      </span>

                      <input
                        name="title"
                        required
                        defaultValue={announcement.title}
                        className={inputClass()}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Category
                      </span>

                      <select
                        name="category"
                        required
                        defaultValue={announcement.category}
                        className={inputClass()}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-gray-200">
                      Description
                    </span>

                    <textarea
                      name="description"
                      required
                      defaultValue={announcement.description}
                      className={`${inputClass()} min-h-32 resize-y`}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                      <input
                        type="checkbox"
                        name="published"
                        defaultChecked={announcement.published}
                        className="h-4 w-4 accent-indigo-500"
                      />

                      <span className="text-sm font-bold text-gray-200">
                        Published
                      </span>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                      <input
                        type="checkbox"
                        name="important"
                        defaultChecked={announcement.important}
                        className="h-4 w-4 accent-indigo-500"
                      />

                      <span className="text-sm font-bold text-gray-200">
                        Important
                      </span>
                    </label>
                  </div>
                </InlineAdminAnnouncementForm>

                <aside className="grid content-start gap-4">
                  <section className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      Publish
                    </p>

                    <div className="mt-4 grid gap-3">
                      {announcement.published ? (
                        <SmallAction
                          action={unpublishAnnouncementInline}
                          announcementId={announcement.id}
                          label="Unpublish"
                          pendingLabel="Unpublishing..."
                          variant="danger"
                        />
                      ) : (
                        <SmallAction
                          action={publishAnnouncementInline}
                          announcementId={announcement.id}
                          label="Publish"
                          pendingLabel="Publishing..."
                          variant="success"
                        />
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      Importance
                    </p>

                    <div className="mt-4 grid gap-3">
                      {announcement.important ? (
                        <SmallAction
                          action={unmarkAnnouncementImportantInline}
                          announcementId={announcement.id}
                          label="Remove important"
                          pendingLabel="Updating..."
                          variant="secondary"
                        />
                      ) : (
                        <SmallAction
                          action={markAnnouncementImportantInline}
                          announcementId={announcement.id}
                          label="Mark important"
                          pendingLabel="Updating..."
                          variant="success"
                        />
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
                      Danger Zone
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      Delete this announcement permanently.
                    </p>

                    <div className="mt-4">
                      <InlineAdminAnnouncementForm
                        action={deleteAnnouncementInline}
                        buttonLabel="Delete announcement"
                        pendingLabel="Deleting..."
                        variant="danger"
                        className="grid gap-2"
                        confirmTitle="Delete announcement?"
                        confirmDescription={`Are you sure you want to delete ${announcement.title}? This cannot be undone.`}
                        confirmLabel="Delete permanently"
                      >
                        <input
                          type="hidden"
                          name="announcementId"
                          value={announcement.id}
                        />
                      </InlineAdminAnnouncementForm>
                    </div>
                  </section>
                </aside>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
