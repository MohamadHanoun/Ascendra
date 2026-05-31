import { createRuleInline } from "@/actions/adminRuleInlineActions";
import InlineAdminRuleForm from "@/components/InlineAdminRuleForm";

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

export default function AdminRuleForm() {
  return (
    <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Rules</p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Create rule</h2>
      </div>

      <div className="p-5">
        <InlineAdminRuleForm
          action={createRuleInline}
          buttonLabel="Create rule"
          pendingLabel="Creating..."
          resetOnSuccess
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px] lg:items-start"
        >
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Rule text</span>
            <textarea name="text" required placeholder="Write the rule text..." className="min-h-24 resize-y border px-4 py-3 text-sm leading-6 outline-none transition" style={inputStyle} />
          </label>
        </InlineAdminRuleForm>
      </div>
    </section>
  );
}
