import { createRule } from "@/actions/ruleActions";

export default function AdminRuleForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="rounded-3xl border border-purple-500/20 bg-purple-500/10 p-6">
        <div className="mb-8">
          <h2 className="mb-3 text-3xl font-black">Create Rule</h2>

        </div>

        <form action={createRule} className="grid gap-5">
          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">Rule Text</span>

            <textarea
              name="text"
              required
              rows={4}
              placeholder="Example: Respect all members and avoid toxic behavior."
              className="resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-purple-400"
            />
          </label>

          <button
            type="submit"
            className="w-fit rounded-xl bg-purple-500 px-7 py-4 font-bold text-white transition hover:-translate-y-1 hover:bg-purple-400"
          >
            Create Rule
          </button>
        </form>
      </div>
    </section>
  );
}