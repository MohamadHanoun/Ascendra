import { createRoleInline } from "@/actions/adminRoleInlineActions";
import InlineAdminRoleForm from "@/components/InlineAdminRoleForm";

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

export default function AdminRoleForm() {
  return (
    <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Roles</p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Create role</h2>
      </div>

      <div className="p-5">
        <InlineAdminRoleForm
          action={createRoleInline}
          buttonLabel="Create role"
          pendingLabel="Creating..."
          resetOnSuccess
          className="grid gap-5"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Role name</span>
              <input name="name" required placeholder="Example: Tournament Admin" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Color</span>
              <input name="color" type="color" required defaultValue="#8b5cf6" className="h-[50px] w-full cursor-pointer border p-2 outline-none transition" style={inputStyle} />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Description</span>
            <textarea name="description" required placeholder="Describe what this role means..." className="min-h-24 resize-y border px-4 py-3 text-sm leading-6 outline-none transition" style={inputStyle} />
          </label>
        </InlineAdminRoleForm>
      </div>
    </section>
  );
}
