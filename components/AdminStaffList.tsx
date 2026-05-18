import {
  activateStaffInline,
  deactivateStaffInline,
  deleteStaffInline,
  updateStaffInline,
} from "@/actions/adminStaffInlineActions";
import InlineAdminStaffForm from "@/components/InlineAdminStaffForm";
import { prisma } from "@/lib/prisma";

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

function StatusBadge({ active, status }: { active: boolean; status: string }) {
  if (!active) {
    return (
      <span className="inline-flex w-fit rounded border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-gray-300">
        Hidden
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit rounded border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold capitalize text-green-300">
      {status}
    </span>
  );
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

function SmallAction({
  action,
  staffId,
  label,
  pendingLabel,
  variant = "secondary",
}: {
  action: (formData: FormData) => Promise<{
    ok: boolean;
    message: string;
    redirectTo?: string;
  }>;
  staffId: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "success" | "danger" | "secondary";
}) {
  return (
    <InlineAdminStaffForm
      action={action}
      buttonLabel={label}
      pendingLabel={pendingLabel}
      variant={variant}
      className="grid gap-2"
    >
      <input type="hidden" name="staffId" value={staffId} />
    </InlineAdminStaffForm>
  );
}

export default async function AdminStaffList() {
  const staffMembers = await prisma.staffMember.findMany({
    orderBy: {
      order: "asc",
    },
  });

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
          Manage Staff
        </p>

        <h2 className="mt-2 text-4xl font-black text-white">Staff list</h2>

        <p className="mt-3 max-w-3xl text-gray-400">
          Edit staff members, change order, update status, show or hide members,
          and delete staff records with confirmation.
        </p>
      </div>

      {staffMembers.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          No staff members found.
        </div>
      ) : (
        <div className="grid gap-4">
          {staffMembers.map((member) => (
            <article
              key={member.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
            >
              <div className="grid gap-6 p-6 xl:grid-cols-[1fr_260px] xl:items-start">
                <InlineAdminStaffForm
                  action={updateStaffInline}
                  buttonLabel="Save changes"
                  pendingLabel="Saving..."
                >
                  <input type="hidden" name="staffId" value={member.id} />

                  <div className="grid gap-5 md:grid-cols-[100px_1fr_1fr]">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Order
                      </span>

                      <input
                        name="order"
                        type="number"
                        min="1"
                        required
                        defaultValue={member.order}
                        className={inputClass()}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Name
                      </span>

                      <input
                        name="name"
                        required
                        defaultValue={member.name}
                        className={inputClass()}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Role
                      </span>

                      <input
                        name="role"
                        required
                        defaultValue={member.role}
                        className={inputClass()}
                      />
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-gray-200">
                      Status
                    </span>

                    <select
                      name="status"
                      required
                      defaultValue={member.status}
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

                <aside className="grid content-start gap-4">
                  <section className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      Visibility
                    </p>

                    <div className="mt-4">
                      <StatusBadge
                        active={member.isActive}
                        status={member.status}
                      />
                    </div>

                    <div className="mt-4 grid gap-3">
                      {member.isActive ? (
                        <SmallAction
                          action={deactivateStaffInline}
                          staffId={member.id}
                          label="Hide"
                          pendingLabel="Hiding..."
                          variant="danger"
                        />
                      ) : (
                        <SmallAction
                          action={activateStaffInline}
                          staffId={member.id}
                          label="Show"
                          pendingLabel="Showing..."
                          variant="success"
                        />
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
                      Danger Zone
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      Delete this staff member permanently.
                    </p>

                    <div className="mt-4">
                      <InlineAdminStaffForm
                        action={deleteStaffInline}
                        buttonLabel="Delete staff"
                        pendingLabel="Deleting..."
                        variant="danger"
                        className="grid gap-2"
                        confirmTitle="Delete staff member?"
                        confirmDescription={`Are you sure you want to delete ${member.name}? This cannot be undone.`}
                        confirmLabel="Delete permanently"
                      >
                        <input type="hidden" name="staffId" value={member.id} />
                      </InlineAdminStaffForm>
                    </div>
                  </section>
                </aside>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
