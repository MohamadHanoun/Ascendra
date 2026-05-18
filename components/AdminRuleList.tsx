import AdminRuleDragList from "@/components/AdminRuleDragList";
import { prisma } from "@/lib/prisma";

export default async function AdminRuleList() {
  const rules = await prisma.rule.findMany({
    select: {
      id: true,
      text: true,
      order: true,
      isActive: true,
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
            Manage Rules
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">Rules list</h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Edit rules, reorder them by dragging, change visibility, or delete
            rules with confirmation.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
            Total rules
          </p>

          <p className="mt-1 text-2xl font-black text-white">{rules.length}</p>
        </div>
      </div>

      <AdminRuleDragList initialRules={rules} />
    </section>
  );
}
