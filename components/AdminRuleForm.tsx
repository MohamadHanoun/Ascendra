import { createRuleInline } from "@/actions/adminRuleInlineActions";
import InlineAdminRuleForm from "@/components/InlineAdminRuleForm";

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

export default function AdminRuleForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-10">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
            Rules
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">Create rule</h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Add a new community rule. The rule will be added at the end of the
            current rules list.
          </p>
        </div>

        <div className="p-6">
          <InlineAdminRuleForm
            action={createRuleInline}
            buttonLabel="Create rule"
            pendingLabel="Creating..."
            resetOnSuccess
          >
            <label className="grid gap-2">
              <span className="text-sm font-bold text-gray-200">Rule text</span>

              <textarea
                name="text"
                required
                placeholder="Write the rule text..."
                className={`${inputClass()} min-h-28 resize-y`}
              />
            </label>
          </InlineAdminRuleForm>
        </div>
      </div>
    </section>
  );
}
