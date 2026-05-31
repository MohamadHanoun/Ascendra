import { createAnnouncementInline } from "@/actions/adminAnnouncementInlineActions";
import InlineAdminAnnouncementForm from "@/components/InlineAdminAnnouncementForm";

const categories = ["Tournament", "Community", "Update", "Maintenance", "Event"];

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
      {children}
    </span>
  );
}

export default function AdminAnnouncementForm() {
  return (
    <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
          Announcements
        </p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Create announcement</h2>
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
              <input name="title" required placeholder="Example: Tournament registration is open" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Category</FieldLabel>
              <select name="category" required defaultValue="" className="border px-4 py-3 outline-none transition" style={inputStyle}>
                <option value="" disabled>Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <FieldLabel>Description</FieldLabel>
            <textarea name="description" required placeholder="Write the announcement details..." className="min-h-24 resize-y border px-4 py-3 text-sm leading-6 outline-none transition" style={inputStyle} />
          </label>
        </InlineAdminAnnouncementForm>
      </div>
    </section>
  );
}
