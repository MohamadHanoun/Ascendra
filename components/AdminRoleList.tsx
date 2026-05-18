import {
  activateRoleInline,
  deactivateRoleInline,
  deleteRoleInline,
  updateRoleInline,
} from "@/actions/adminRoleInlineActions";
import InlineAdminRoleForm from "@/components/InlineAdminRoleForm";
import { prisma } from "@/lib/prisma";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex w-fit rounded border px-3 py-1 text-xs font-bold ${
        active
          ? "border-green-500/20 bg-green-500/10 text-green-300"
          : "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

function SmallAction({
  action,
  roleId,
  label,
  pendingLabel,
  variant = "secondary",
}: {
  action: (formData: FormData) => Promise<{
    ok: boolean;
    message: string;
    redirectTo?: string;
  }>;
  roleId: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "success" | "danger" | "secondary";
}) {
  return (
    <InlineAdminRoleForm
      action={action}
      buttonLabel={label}
      pendingLabel={pendingLabel}
      variant={variant}
      className="grid gap-2"
    >
      <input type="hidden" name="roleId" value={roleId} />
    </InlineAdminRoleForm>
  );
}

export default async function AdminRoleList() {
  const roles = await prisma.role.findMany({
    orderBy: {
      order: "asc",
    },
  });

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
          Manage Roles
        </p>

        <h2 className="mt-2 text-4xl font-black text-white">Roles list</h2>

        <p className="mt-3 max-w-3xl text-gray-400">
          Edit role names, colors, descriptions, order, visibility, or delete
          roles with confirmation.
        </p>
      </div>

      {roles.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          No roles found.
        </div>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <article
              key={role.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
            >
              <div className="grid gap-6 p-6 xl:grid-cols-[1fr_260px] xl:items-start">
                <InlineAdminRoleForm
                  action={updateRoleInline}
                  buttonLabel="Save changes"
                  pendingLabel="Saving..."
                >
                  <input type="hidden" name="roleId" value={role.id} />

                  <div className="grid gap-5 md:grid-cols-[100px_1fr_180px]">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Order
                      </span>

                      <input
                        name="order"
                        type="number"
                        min="1"
                        required
                        defaultValue={role.order}
                        className={inputClass()}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Role name
                      </span>

                      <input
                        name="name"
                        required
                        defaultValue={role.name}
                        className={inputClass()}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Color
                      </span>

                      <input
                        name="color"
                        required
                        defaultValue={role.color}
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
                      defaultValue={role.description}
                      className={`${inputClass()} min-h-28 resize-y`}
                    />
                  </label>
                </InlineAdminRoleForm>

                <aside className="grid content-start gap-4">
                  <section className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      Status
                    </p>

                    <div className="mt-4">
                      <StatusBadge active={role.isActive} />
                    </div>

                    <div className="mt-4 grid gap-3">
                      {role.isActive ? (
                        <SmallAction
                          action={deactivateRoleInline}
                          roleId={role.id}
                          label="Deactivate"
                          pendingLabel="Deactivating..."
                          variant="danger"
                        />
                      ) : (
                        <SmallAction
                          action={activateRoleInline}
                          roleId={role.id}
                          label="Activate"
                          pendingLabel="Activating..."
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
                      Delete this role permanently.
                    </p>

                    <div className="mt-4">
                      <InlineAdminRoleForm
                        action={deleteRoleInline}
                        buttonLabel="Delete role"
                        pendingLabel="Deleting..."
                        variant="danger"
                        className="grid gap-2"
                        confirmTitle="Delete role?"
                        confirmDescription={`Are you sure you want to delete ${role.name}? This cannot be undone.`}
                        confirmLabel="Delete permanently"
                      >
                        <input type="hidden" name="roleId" value={role.id} />
                      </InlineAdminRoleForm>
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
