import { createRoleInline } from "@/actions/adminRoleInlineActions";
import InlineAdminRoleForm from "@/components/InlineAdminRoleForm";

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

export default function AdminRoleForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-10">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
            Roles
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">Create role</h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Add a new community role. It will be added at the end of the public
            roles list.
          </p>
        </div>

        <div className="p-6">
          <InlineAdminRoleForm
            action={createRoleInline}
            buttonLabel="Create role"
            pendingLabel="Creating..."
            resetOnSuccess
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-200">
                  Role name
                </span>

                <input
                  name="name"
                  required
                  placeholder="Example: Tournament Admin"
                  className={inputClass()}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-200">Color</span>

                <input
                  name="color"
                  required
                  placeholder="Example: #22d3ee"
                  className={inputClass()}
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-gray-200">
                Description
              </span>

              <textarea
                name="description"
                required
                placeholder="Describe what this role means..."
                className={`${inputClass()} min-h-28 resize-y`}
              />
            </label>
          </InlineAdminRoleForm>
        </div>
      </div>
    </section>
  );
}
