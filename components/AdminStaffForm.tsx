import { createStaffInline } from "@/actions/adminStaffInlineActions";
import InlineAdminStaffForm from "@/components/InlineAdminStaffForm";

const staffStatuses = [
  { value: "active", label: "Active" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "inactive", label: "Inactive" },
];

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

export default function AdminStaffForm() {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Staff
        </p>

        <h2 className="mt-1 text-xl font-black text-white">Add staff member</h2>
      </div>

      <div className="p-5">
        <InlineAdminStaffForm
          action={createStaffInline}
          buttonLabel="Add staff"
          pendingLabel="Adding..."
          resetOnSuccess
          className="grid gap-5"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
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
          </div>
        </InlineAdminStaffForm>
      </div>
    </section>
  );
}
