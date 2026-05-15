import { createRole } from "@/actions/roleActions";

export default function AdminRoleForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6">
        <div className="mb-8">
          <h2 className="mb-3 text-3xl font-black">Create Role</h2>
        </div>

        <form action={createRole} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Role Name</span>

              <input
                name="name"
                required
                placeholder="Example: Developer"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Color</span>

              <select
                name="color"
                defaultValue="text-green-300"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-400"
              >
                <option value="text-red-300">Red</option>
                <option value="text-purple-300">Purple</option>
                <option value="text-blue-300">Blue</option>
                <option value="text-cyan-300">Cyan</option>
                <option value="text-yellow-300">Yellow</option>
                <option value="text-green-300">Green</option>
                <option value="text-gray-300">Gray</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">Description</span>

            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe what this role does inside RTN..."
              className="resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-400"
            />
          </label>

          <button
            type="submit"
            className="w-fit rounded-xl bg-blue-500 px-7 py-4 font-bold text-white transition hover:-translate-y-1 hover:bg-blue-400"
          >
            Create Role
          </button>
        </form>
      </div>
    </section>
  );
}