import { createAnnouncementInline } from "@/actions/adminAnnouncementInlineActions";
import InlineAdminAnnouncementForm from "@/components/InlineAdminAnnouncementForm";

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

export default function AdminAnnouncementForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-10">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
            Announcements
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Create announcement
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Add a new public announcement. You can publish it immediately or
            keep it hidden until later.
          </p>
        </div>

        <div className="p-6">
          <InlineAdminAnnouncementForm
            action={createAnnouncementInline}
            buttonLabel="Create announcement"
            pendingLabel="Creating..."
            resetOnSuccess
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-200">Title</span>

                <input
                  name="title"
                  required
                  placeholder="Example: Valorant Cup registration is open"
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
                  defaultValue=""
                  className={inputClass()}
                >
                  <option value="" disabled>
                    Select category
                  </option>

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
                placeholder="Write the announcement details..."
                className={`${inputClass()} min-h-32 resize-y`}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <input
                  type="checkbox"
                  name="published"
                  className="h-4 w-4 accent-indigo-500"
                />

                <span className="text-sm font-bold text-gray-200">
                  Publish immediately
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <input
                  type="checkbox"
                  name="important"
                  className="h-4 w-4 accent-indigo-500"
                />

                <span className="text-sm font-bold text-gray-200">
                  Mark as important
                </span>
              </label>
            </div>
          </InlineAdminAnnouncementForm>
        </div>
      </div>
    </section>
  );
}
