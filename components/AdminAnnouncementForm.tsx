import { createAnnouncementInline } from "@/actions/adminAnnouncementInlineActions";
import InlineAdminAnnouncementForm from "@/components/InlineAdminAnnouncementForm";

const categories = [
  "Tournament",
  "Community",
  "Update",
  "Maintenance",
  "Event",
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

export default function AdminAnnouncementForm() {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Announcements
        </p>

        <h2 className="mt-1 text-xl font-black text-white">
          Create announcement
        </h2>
      </div>

      <div className="p-5">
        <InlineAdminAnnouncementForm
          action={createAnnouncementInline}
          buttonLabel="Create announcement"
          pendingLabel="Creating..."
          resetOnSuccess
          className="grid gap-5"
        >
          <input type="hidden" name="published" value="false" />
          <input type="hidden" name="important" value="false" />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <label className="grid gap-2">
              <FieldLabel>Title</FieldLabel>

              <input
                name="title"
                required
                placeholder="Example: Tournament registration is open"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Category</FieldLabel>

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
            <FieldLabel>Description</FieldLabel>

            <textarea
              name="description"
              required
              placeholder="Write the announcement details..."
              className={`${inputClass()} min-h-24 resize-y text-sm leading-6`}
            />
          </label>
        </InlineAdminAnnouncementForm>
      </div>
    </section>
  );
}
