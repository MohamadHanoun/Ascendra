"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";

type RuleItem = {
  id: string;
  text: string;
  order: number;
  isActive: boolean;
};

type ServerAction = (formData: FormData) => void | Promise<void>;

type AdminRuleListClientProps = {
  rules: RuleItem[];
  toggleRuleActive: ServerAction;
  deleteRule: ServerAction;
  reorderRules: ServerAction;
};

export default function AdminRuleListClient({
  rules,
  toggleRuleActive,
  deleteRule,
  reorderRules,
}: AdminRuleListClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(rules);
  const itemsRef = useRef(rules);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
  itemsRef.current = rules;
  setItems(rules);
}, [rules]);

  function updateItems(nextItems: RuleItem[]) {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }

  function moveRule(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      return;
    }

    const currentItems = itemsRef.current;

    const draggedIndex = currentItems.findIndex((item) => item.id === draggedId);
    const targetIndex = currentItems.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const updatedItems = [...currentItems];
    const [draggedItem] = updatedItems.splice(draggedIndex, 1);

    updatedItems.splice(targetIndex, 0, draggedItem);

    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    updateItems(reorderedItems);
  }

  function saveOrder() {
    const formData = new FormData();
    formData.append("ids", itemsRef.current.map((item) => item.id).join(","));

    startTransition(async () => {
      await reorderRules(formData);
      router.refresh();
    });
  }

  function handleDragEnd() {
    if (draggedId) {
      saveOrder();
    }

    setDraggedId(null);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-8">
          <h2 className="mb-3 text-3xl font-black">Manage Rules</h2>

          <p className="max-w-2xl leading-7 text-gray-300">
            Drag rules from the handle icon to reorder them. The new order is
            saved to the database automatically.
          </p>

          {isPending && (
            <p className="mt-3 text-sm font-semibold text-purple-300">
              Saving rule order...
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-gray-300">
            No rules found yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((rule) => (
              <article
                key={rule.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  moveRule(rule.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDragEnd();
                }}
                className={`flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition ${
                  draggedId === rule.id
                    ? "scale-[0.99] opacity-60"
                    : "hover:border-purple-500/40"
                }`}
              >
                <button
                  type="button"
                  draggable
                  title="Drag to reorder"
                  onDragStart={(event) => {
                    setDraggedId(rule.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={handleDragEnd}
                  className="mt-1 flex h-fit shrink-0 cursor-grab flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-3 text-gray-400 transition hover:bg-white/10 hover:text-white active:cursor-grabbing"
                >
                  <span className="block h-[2px] w-5 rounded bg-current" />
                  <span className="block h-[2px] w-5 rounded bg-current" />
                  <span className="block h-[2px] w-5 rounded bg-current" />
                </button>

                <div className="flex-1">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-semibold text-purple-300">
                          Rule {rule.order}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            rule.isActive
                              ? "bg-green-500/20 text-green-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>

                      <p className="max-w-4xl leading-7 text-gray-300">
                        {rule.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <form action={toggleRuleActive}>
                      <input type="hidden" name="id" value={rule.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={String(rule.isActive)}
                      />

                      <button
                        type="submit"
                        className="rounded-xl border border-purple-500/20 px-4 py-2 font-bold text-purple-300 transition hover:bg-purple-500/10"
                      >
                        {rule.isActive ? "Hide" : "Show"}
                      </button>
                    </form>

                    <ConfirmDeleteForm
                      id={rule.id}
                      action={deleteRule}
                      message="Are you sure you want to delete this rule?"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}