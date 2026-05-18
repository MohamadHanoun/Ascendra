import {
  activateRuleInline,
  deactivateRuleInline,
  deleteRuleInline,
  updateRuleInline,
} from "@/actions/adminRuleInlineActions";
import InlineAdminRuleForm from "@/components/InlineAdminRuleForm";
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
  ruleId,
  label,
  pendingLabel,
  variant = "secondary",
}: {
  action: (formData: FormData) => Promise<{
    ok: boolean;
    message: string;
    redirectTo?: string;
  }>;
  ruleId: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "success" | "danger" | "secondary";
}) {
  return (
    <InlineAdminRuleForm
      action={action}
      buttonLabel={label}
      pendingLabel={pendingLabel}
      variant={variant}
      className="grid gap-2"
    >
      <input type="hidden" name="ruleId" value={ruleId} />
    </InlineAdminRuleForm>
  );
}

export default async function AdminRuleList() {
  const rules = await prisma.rule.findMany({
    orderBy: {
      order: "asc",
    },
  });

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
          Manage Rules
        </p>

        <h2 className="mt-2 text-4xl font-black text-white">Rules list</h2>

        <p className="mt-3 max-w-3xl text-gray-400">
          Edit rule text, change order, activate or deactivate rules, and delete
          rules with confirmation.
        </p>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          No rules found.
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <article
              key={rule.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
            >
              <div className="grid gap-6 p-6 xl:grid-cols-[1fr_260px] xl:items-start">
                <InlineAdminRuleForm
                  action={updateRuleInline}
                  buttonLabel="Save changes"
                  pendingLabel="Saving..."
                >
                  <input type="hidden" name="ruleId" value={rule.id} />

                  <div className="grid gap-5 md:grid-cols-[120px_1fr]">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Order
                      </span>

                      <input
                        name="order"
                        type="number"
                        min="1"
                        required
                        defaultValue={rule.order}
                        className={inputClass()}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Rule text
                      </span>

                      <textarea
                        name="text"
                        required
                        defaultValue={rule.text}
                        className={`${inputClass()} min-h-28 resize-y`}
                      />
                    </label>
                  </div>
                </InlineAdminRuleForm>

                <aside className="grid content-start gap-4">
                  <section className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      Status
                    </p>

                    <div className="mt-4">
                      <StatusBadge active={rule.isActive} />
                    </div>

                    <div className="mt-4 grid gap-3">
                      {rule.isActive ? (
                        <SmallAction
                          action={deactivateRuleInline}
                          ruleId={rule.id}
                          label="Deactivate"
                          pendingLabel="Deactivating..."
                          variant="danger"
                        />
                      ) : (
                        <SmallAction
                          action={activateRuleInline}
                          ruleId={rule.id}
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
                      Delete this rule permanently.
                    </p>

                    <div className="mt-4">
                      <InlineAdminRuleForm
                        action={deleteRuleInline}
                        buttonLabel="Delete rule"
                        pendingLabel="Deleting..."
                        variant="danger"
                        className="grid gap-2"
                        confirmTitle="Delete rule?"
                        confirmDescription={`Are you sure you want to delete rule #${rule.order}? This cannot be undone.`}
                        confirmLabel="Delete permanently"
                      >
                        <input type="hidden" name="ruleId" value={rule.id} />
                      </InlineAdminRuleForm>
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
