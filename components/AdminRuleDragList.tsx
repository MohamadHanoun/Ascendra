"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  activateRuleInline,
  deactivateRuleInline,
  deleteRuleInline,
  reorderRulesInline,
  updateRuleInline,
  type AdminRuleActionResult,
} from "@/actions/adminRuleInlineActions";
import InlineAdminRuleForm from "@/components/InlineAdminRuleForm";

type RuleItem = {
  id: string;
  text: string;
  order: number;
  isActive: boolean;
};

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function StatusBadge({ active }: { active: boolean }) {
  const style: React.CSSProperties = active
    ? { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" }
    : { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" };
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={style}>
      {active ? "Active" : "Hidden"}
    </span>
  );
}

function Notice({ notice }: { notice: AdminRuleActionResult | null }) {
  if (!notice) return null;
  return (
    <div
      className="border px-4 py-3 text-sm font-bold"
      style={
        notice.ok
          ? { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }
          : { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }
      }
    >
      {notice.message}
    </div>
  );
}

function moveItem(items: RuleItem[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) return items;

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems.map((item, index) => ({ ...item, order: index + 1 }));
}

export default function AdminRuleDragList({ initialRules }: { initialRules: RuleItem[] }) {
  const router = useRouter();

  const [rules, setRules] = useState(initialRules);
  const [draggedRuleId, setDraggedRuleId] = useState<string | null>(null);
  const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);
  const [notice, setNotice] = useState<AdminRuleActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);

  function saveOrder(nextRules: RuleItem[]) {
    const formData = new FormData();
    formData.set("orderedRuleIds", JSON.stringify(nextRules.map((rule) => rule.id)));

    startTransition(async () => {
      const result = await reorderRulesInline(formData);
      setNotice(result);

      if (!result.ok) {
        setRules(initialRules);
        return;
      }

      window.setTimeout(() => { router.refresh(); }, 300);
    });
  }

  function handleDragStart(ruleId: string) {
    setDraggedRuleId(ruleId);
    setNotice(null);
  }

  function handleDragOver(ruleId: string) {
    if (!draggedRuleId || draggedRuleId === ruleId) return;
    setDragOverRuleId(ruleId);
  }

  function handleDrop(targetRuleId: string) {
    if (!draggedRuleId || draggedRuleId === targetRuleId) {
      setDraggedRuleId(null);
      setDragOverRuleId(null);
      return;
    }

    const fromIndex = rules.findIndex((rule) => rule.id === draggedRuleId);
    const toIndex = rules.findIndex((rule) => rule.id === targetRuleId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedRuleId(null);
      setDragOverRuleId(null);
      return;
    }

    const nextRules = moveItem(rules, fromIndex, toIndex);
    setRules(nextRules);
    setDraggedRuleId(null);
    setDragOverRuleId(null);
    saveOrder(nextRules);
  }

  function handleDragEnd() {
    setDraggedRuleId(null);
    setDragOverRuleId(null);
  }

  if (rules.length === 0) {
    return (
      <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-3)" }}>
        No rules found.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div
        className="flex flex-col justify-between gap-3 border px-5 py-4 shadow-2xl shadow-black/20 lg:flex-row lg:items-center"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div>
          <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>Drag to reorder</p>
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>Use the handle and drop the rule in a new position.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {pending && (
            <div
              className="border px-4 py-3 text-sm font-bold"
              style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
            >
              Saving order...
            </div>
          )}
          <Notice notice={notice} />
        </div>
      </div>

      <section
        className="overflow-hidden border shadow-2xl shadow-black/20"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div
          className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] lg:grid lg:grid-cols-[90px_minmax(0,1fr)_120px_220px] lg:gap-5"
          style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "oklch(0.08 0.02 287)", color: "var(--asc-fg-3)" }}
        >
          <span>Order</span>
          <span>Rule</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        <div>
          {rules.map((rule, index) => {
            const position = index + 1;
            const isDragging = draggedRuleId === rule.id;
            const isDragTarget = dragOverRuleId === rule.id;

            return (
              <article
                key={rule.id}
                draggable
                onDragStart={() => handleDragStart(rule.id)}
                onDragOver={(event) => { event.preventDefault(); handleDragOver(rule.id); }}
                onDrop={() => handleDrop(rule.id)}
                onDragEnd={handleDragEnd}
                className={`grid gap-4 px-5 py-4 transition lg:grid-cols-[90px_minmax(0,1fr)_120px_220px] lg:items-start lg:gap-5 ${isDragging ? "opacity-50" : ""} ${isDragTarget ? "bg-violet-500/10" : "hover:bg-white/[0.035]"}`}
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div className="flex items-center justify-between gap-3 lg:justify-start">
                  <span
                    className="grid h-10 w-10 place-items-center text-sm font-black"
                    style={{ border: "1px solid oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
                  >
                    {String(position).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    aria-label="Drag rule"
                    className="grid h-10 w-10 cursor-grab place-items-center text-lg font-black transition active:cursor-grabbing lg:hidden"
                    style={{ border: "1px solid var(--asc-line-soft)", background: "oklch(0.09 0.02 287)", color: "var(--asc-fg-3)" }}
                  >
                    ≡
                  </button>
                </div>

                <InlineAdminRuleForm
                  action={updateRuleInline}
                  buttonLabel="Save"
                  pendingLabel="Saving..."
                  className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_90px] xl:items-start"
                >
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <input type="hidden" name="order" value={position} />

                  <label className="grid gap-2">
                    <span className="sr-only">Rule text</span>
                    <textarea
                      name="text"
                      required
                      defaultValue={rule.text}
                      className="min-h-20 resize-y border px-4 py-3 text-sm leading-6 text-white outline-none transition"
                      style={inputStyle}
                    />
                  </label>
                </InlineAdminRuleForm>

                <div className="flex items-center justify-between gap-3 lg:block">
                  <StatusBadge active={rule.isActive} />

                  <button
                    type="button"
                    aria-label="Drag rule"
                    className="hidden h-10 w-10 cursor-grab place-items-center text-lg font-black transition active:cursor-grabbing lg:grid"
                    style={{ border: "1px solid var(--asc-line-soft)", background: "oklch(0.09 0.02 287)", color: "var(--asc-fg-3)" }}
                  >
                    ≡
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {rule.isActive ? (
                    <InlineAdminRuleForm
                      action={deactivateRuleInline}
                      buttonLabel="Hide"
                      pendingLabel="Hiding..."
                      variant="secondary"
                      className="grid gap-2"
                    >
                      <input type="hidden" name="ruleId" value={rule.id} />
                    </InlineAdminRuleForm>
                  ) : (
                    <InlineAdminRuleForm
                      action={activateRuleInline}
                      buttonLabel="Show"
                      pendingLabel="Showing..."
                      variant="success"
                      className="grid gap-2"
                    >
                      <input type="hidden" name="ruleId" value={rule.id} />
                    </InlineAdminRuleForm>
                  )}

                  <InlineAdminRuleForm
                    action={deleteRuleInline}
                    buttonLabel="Delete"
                    pendingLabel="Deleting..."
                    variant="danger"
                    className="grid gap-2"
                    confirmTitle="Delete rule?"
                    confirmDescription={`Delete rule #${position}? This cannot be undone.`}
                    confirmLabel="Delete permanently"
                  >
                    <input type="hidden" name="ruleId" value={rule.id} />
                  </InlineAdminRuleForm>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
