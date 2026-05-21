import { createRuleInline } from "@/actions/adminRuleInlineActions";
import InlineAdminRuleForm from "@/components/InlineAdminRuleForm";

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

export default function AdminRuleForm() {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Rules
        </p>

        <h2 className="mt-1 text-xl font-black text-white">Create rule</h2>
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
            <span className="text-sm font-bold text-gray-200">Rule text</span>

            <textarea
              name="text"
              required
              placeholder="Write the rule text..."
              className={`${inputClass()} min-h-24 resize-y text-sm leading-6`}
            />
          </label>
        </InlineAdminRuleForm>
      </div>
    </section>
  );
}
