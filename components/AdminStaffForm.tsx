import { createStaffInline } from "@/actions/adminStaffInlineActions";
import InlineAdminStaffForm from "@/components/InlineAdminStaffForm";

const staffStatuses = [
  { value: "active", label: "Active" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "inactive", label: "Inactive" },
];

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

export default function AdminStaffForm() {
  return (
    <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Staff</p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Add staff member</h2>
      </div>

      <div className="p-5">
        <InlineAdminStaffForm
          action={createStaffInline}
          buttonLabel="Add staff"
          pendingLabel="Adding..."
          resetOnSuccess
          className="grid gap-5"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Name</span>
              <input name="name" required placeholder="Example: Abu 3Day" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Role</span>
              <input name="role" required placeholder="Example: Tournament Manager" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Status</span>
              <select name="status" required defaultValue="active" className="border px-4 py-3 outline-none transition" style={inputStyle}>
                {staffStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
          </div>
        </InlineAdminStaffForm>
      </div>
    </section>
  );
}
