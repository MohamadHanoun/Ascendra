import { createRuleInline } from "@/actions/adminRuleInlineActions";
import InlineAdminRuleForm from "@/components/InlineAdminRuleForm";

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

export default function AdminRuleForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
              Rules
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">Create rule</h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              Add a new community rule. It will be placed at the end of the
              rules list automatically.
            </p>
          </div>
        </div>

        <InlineAdminRuleForm
          action={createRuleInline}
          buttonLabel="Create rule"
          pendingLabel="Creating..."
          resetOnSuccess
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-start"
        >
          <label className="grid gap-2">
            <span className="text-sm font-bold text-gray-200">Rule text</span>

            <textarea
              name="text"
              required
              placeholder="Write the rule text..."
              className={`${inputClass()} min-h-24 resize-y`}
            />
          </label>
        </InlineAdminRuleForm>
      </div>
    </section>
  );
}
