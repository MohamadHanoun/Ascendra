import { createRoleInline } from "@/actions/adminRoleInlineActions";
import InlineAdminRoleForm from "@/components/InlineAdminRoleForm";

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

export default function AdminRoleForm() {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Roles
        </p>

        <h2 className="mt-1 text-xl font-black text-white">Create role</h2>
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
              <span className="text-sm font-bold text-gray-200">Role name</span>

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
                type="color"
                required
                defaultValue="#8b5cf6"
                className="h-[50px] w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 p-2 outline-none transition focus:border-violet-400"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-gray-200">Description</span>

            <textarea
              name="description"
              required
              placeholder="Describe what this role means..."
              className={`${inputClass()} min-h-24 resize-y text-sm leading-6`}
            />
          </label>
        </InlineAdminRoleForm>
      </div>
    </section>
  );
}
