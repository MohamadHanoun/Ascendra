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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
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

function moveItem(items: RuleItem[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
}

export default function AdminRuleDragList({
  initialRules,
}: {
  initialRules: RuleItem[];
}) {
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

    formData.set(
      "orderedRuleIds",
      JSON.stringify(nextRules.map((rule) => rule.id)),
    );

    startTransition(async () => {
      const result = await reorderRulesInline(formData);

      setNotice(result);

      if (!result.ok) {
        setRules(initialRules);
        return;
      }

      window.setTimeout(() => {
        router.refresh();
      }, 450);
    });
  }

  function handleDragStart(ruleId: string) {
    setDraggedRuleId(ruleId);
    setNotice(null);
  }

  function handleDragOver(ruleId: string) {
    if (!draggedRuleId || draggedRuleId === ruleId) {
      return;
    }

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
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
        No rules found.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <div>
          <p className="text-sm font-black text-white">Drag to reorder</p>
          <p className="mt-1 text-sm text-gray-400">
            Hold the handle and drop the rule in its new position.
          </p>
        </div>

        {notice && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-bold ${
              notice.ok
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {notice.message}
          </div>
        )}

        {pending && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-300">
            Saving order...
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <div className="hidden border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-gray-400 lg:grid lg:grid-cols-[96px_minmax(0,1fr)_220px] lg:gap-5">
          <span>Order</span>
          <span>Rule text</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-white/10">
          {rules.map((rule, index) => {
            const position = index + 1;
            const isDragging = draggedRuleId === rule.id;
            const isDragTarget = dragOverRuleId === rule.id;

            return (
              <article
                key={rule.id}
                draggable
                onDragStart={() => handleDragStart(rule.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  handleDragOver(rule.id);
                }}
                onDrop={() => handleDrop(rule.id)}
                onDragEnd={handleDragEnd}
                className={`grid gap-5 p-5 transition lg:grid-cols-[96px_minmax(0,1fr)_220px] lg:items-start ${
                  isDragging ? "opacity-50" : ""
                } ${isDragTarget ? "bg-cyan-400/10" : "hover:bg-white/[0.03]"}`}
              >
                <div className="flex items-center justify-between gap-4 lg:grid lg:gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-lg font-black text-cyan-200">
                      {position}
                    </span>

                    <div className="lg:hidden">
                      <p className="text-sm font-black text-white">
                        Rule #{position}
                      </p>

                      <div className="mt-1">
                        <StatusBadge active={rule.isActive} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Drag rule"
                    className="grid h-10 w-10 cursor-grab place-items-center rounded-xl border border-white/10 bg-black/20 text-lg font-black text-gray-300 transition hover:border-cyan-400/40 hover:text-cyan-200 active:cursor-grabbing"
                  >
                    ≡
                  </button>
                </div>

                <InlineAdminRuleForm
                  action={updateRuleInline}
                  buttonLabel="Save"
                  pendingLabel="Saving..."
                  className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_96px] xl:items-start"
                >
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <input type="hidden" name="order" value={position} />

                  <label className="grid gap-2">
                    <span className="sr-only">Rule text</span>

                    <textarea
                      name="text"
                      required
                      defaultValue={rule.text}
                      className={`${inputClass()} min-h-20 resize-y text-sm leading-6`}
                    />
                  </label>
                </InlineAdminRuleForm>

                <div className="grid gap-3">
                  <div className="hidden lg:block">
                    <StatusBadge active={rule.isActive} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {rule.isActive ? (
                      <InlineAdminRuleForm
                        action={deactivateRuleInline}
                        buttonLabel="Hide"
                        pendingLabel="Hiding..."
                        variant="danger"
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
                      confirmDescription={`Are you sure you want to delete rule #${position}? This cannot be undone.`}
                      confirmLabel="Delete permanently"
                    >
                      <input type="hidden" name="ruleId" value={rule.id} />
                    </InlineAdminRuleForm>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
