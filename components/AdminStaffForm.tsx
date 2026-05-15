import { createStaffMember } from "@/actions/staffActions";

export default function AdminStaffForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-6">
        <div className="mb-8">
          <h2 className="mb-3 text-3xl font-black">Create Staff Member</h2>

        </div>

        <form action={createStaffMember} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Name</span>

              <input
                name="name"
                required
                placeholder="Example: Mohamad"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-green-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Role</span>

              <input
                name="role"
                required
                placeholder="Example: Developer"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-green-400"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">Status</span>

            <input
              name="status"
              required
              placeholder="Example: Website, bot, XP system, and technical features"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-green-400"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">
              Avatar URL optional
            </span>

            <input
              name="avatarUrl"
              placeholder="Optional image URL"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-green-400"
            />
          </label>

          <button
            type="submit"
            className="w-fit rounded-xl bg-green-500 px-7 py-4 font-bold text-black transition hover:-translate-y-1 hover:bg-green-400"
          >
            Create Staff Member
          </button>
        </form>
      </div>
    </section>
  );
}