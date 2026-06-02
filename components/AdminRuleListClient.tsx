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

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

export default function AdminRuleListClient({
  rules,
  toggleRuleActive,
  deleteRule,
  reorderRules,
}: AdminRuleListClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(rules);
  const [prevRules, setPrevRules] = useState(rules);
  const itemsRef = useRef(rules);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (prevRules !== rules) {
    setPrevRules(rules);
    setItems(rules);
  }

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  function updateItems(nextItems: RuleItem[]) {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }

  function moveRule(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const currentItems = itemsRef.current;
    const draggedIndex = currentItems.findIndex((item) => item.id === draggedId);
    const targetIndex = currentItems.findIndex((item) => item.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const updatedItems = [...currentItems];
    const [draggedItem] = updatedItems.splice(draggedIndex, 1);
    updatedItems.splice(targetIndex, 0, draggedItem);
    updateItems(updatedItems.map((item, index) => ({ ...item, order: index + 1 })));
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
    if (draggedId) saveOrder();
    setDraggedId(null);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="border p-6" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="mb-8">
          <h2 className="mb-3 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Manage Rules</h2>
          <p className="max-w-2xl leading-7" style={{ color: "var(--asc-fg-3)" }}>
            Drag rules from the handle icon to reorder them. The new order is saved to the database automatically.
          </p>
          {isPending && (
            <p className="mt-3 text-sm font-black" style={{ color: "var(--asc-accent)" }}>Saving rule order...</p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="border p-6 text-sm" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}>
            No rules found yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((rule) => (
              <article
                key={rule.id}
                onDragOver={(event) => { event.preventDefault(); moveRule(rule.id); }}
                onDrop={(event) => { event.preventDefault(); handleDragEnd(); }}
                className={`flex gap-4 border p-5 transition ${draggedId === rule.id ? "scale-[0.99] opacity-60" : ""}`}
                style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
              >
                <button
                  type="button"
                  draggable
                  title="Drag to reorder"
                  onDragStart={(event) => { setDraggedId(rule.id); event.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={handleDragEnd}
                  className="mt-1 flex h-fit shrink-0 cursor-grab flex-col gap-1 border p-3 transition hover:opacity-80 active:cursor-grabbing"
                  style={inputStyle}
                >
                  <span className="block h-[2px] w-5 bg-current" />
                  <span className="block h-[2px] w-5 bg-current" />
                  <span className="block h-[2px] w-5 bg-current" />
                </button>

                <div className="flex-1">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span
                          className="inline-flex items-center border px-3 py-1 text-xs font-black uppercase tracking-[0.1em]"
                          style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
                        >
                          Rule {rule.order}
                        </span>
                        <span
                          className="inline-flex items-center border px-3 py-1 text-xs font-black uppercase tracking-[0.1em]"
                          style={rule.isActive
                            ? { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }
                            : { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }}
                        >
                          {rule.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>
                      <p className="max-w-4xl leading-7" style={{ color: "var(--asc-fg-3)" }}>{rule.text}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:flex sm:flex-wrap">
                    <form action={toggleRuleActive}>
                      <input type="hidden" name="id" value={rule.id} />
                      <input type="hidden" name="isActive" value={String(rule.isActive)} />
                      <button
                        type="submit"
                        className="border px-4 py-2 text-sm font-black transition hover:opacity-80"
                        style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
                      >
                        {rule.isActive ? "Hide" : "Show"}
                      </button>
                    </form>
                    <ConfirmDeleteForm id={rule.id} action={deleteRule} message="Are you sure you want to delete this rule?" />
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
