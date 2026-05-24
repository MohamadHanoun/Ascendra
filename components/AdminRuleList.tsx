import AdminRuleDragList from "@/components/AdminRuleDragList";
import { prisma } from "@/lib/prisma";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

export default async function AdminRuleList() {
  const rules = await prisma.rule.findMany({
    select: { id: true, text: true, order: true, isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const activeRules = rules.filter((rule) => rule.isActive).length;
  const hiddenRules = rules.length - activeRules;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            Manage rules
          </p>
          <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Rules list</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Edit, reorder, show, hide, or delete community rules.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Stat label="Total" value={rules.length} />
          <Stat label="Active" value={activeRules} />
          <Stat label="Hidden" value={hiddenRules} />
        </div>
      </div>

      <AdminRuleDragList initialRules={rules} />
    </section>
  );
}
