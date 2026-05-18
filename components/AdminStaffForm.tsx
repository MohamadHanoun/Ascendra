import { createStaffInline } from "@/actions/adminStaffInlineActions";
import InlineAdminStaffForm from "@/components/InlineAdminStaffForm";

const staffStatuses = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "available",
    label: "Available",
  },
  {
    value: "busy",
    label: "Busy",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
];

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

export default function AdminStaffForm() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-10">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
            Staff
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Add staff member
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Add a new staff member to the public staff section.
          </p>
        </div>

        <div className="p-6">
          <InlineAdminStaffForm
            action={createStaffInline}
            buttonLabel="Add staff member"
            pendingLabel="Adding..."
            resetOnSuccess
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-200">Name</span>

                <input
                  name="name"
                  required
                  placeholder="Example: Abu 3Day"
                  className={inputClass()}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-200">Role</span>

                <input
                  name="role"
                  required
                  placeholder="Example: Tournament Manager"
                  className={inputClass()}
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-gray-200">Status</span>

              <select
                name="status"
                required
                defaultValue="active"
                className={inputClass()}
              >
                {staffStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </InlineAdminStaffForm>
        </div>
      </div>
    </section>
  );
}
