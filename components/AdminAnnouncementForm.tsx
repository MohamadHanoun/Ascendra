import { createAnnouncement } from "@/actions/announcementActions";

export default function AdminAnnouncementForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-6">
        <div className="mb-8">
          <h2 className="mb-3 text-3xl font-black">Create Announcement</h2>
        </div>

        <form action={createAnnouncement} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Title</span>
              <input
                name="title"
                required
                placeholder="Example: RTN Tournament Update"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-indigo-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-semibold text-gray-200">Category</span>
              <select
                name="category"
                required
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-indigo-400"
              >
                <option value="Update">Update</option>
                <option value="Tournaments">Tournaments</option>
                <option value="Bot">Bot</option>
                <option value="Community">Community</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="font-semibold text-gray-200">Description</span>
            <textarea
              name="description"
              required
              rows={5}
              placeholder="Write the announcement details here..."
              className="resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-indigo-400"
            />
          </label>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-gray-300">
              <input name="important" type="checkbox" />
              Mark as important
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-gray-300">
              <input name="published" type="checkbox" defaultChecked />
              Publish immediately
            </label>
          </div>

          <button
            type="submit"
            className="w-fit rounded-xl bg-indigo-500 px-7 py-4 font-bold text-white transition hover:-translate-y-1 hover:bg-indigo-400"
          >
            Create Announcement
          </button>
        </form>
      </div>
    </section>
  );
}