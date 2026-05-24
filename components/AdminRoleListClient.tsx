"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";

type RoleItem = {
  id: string;
  name: string;
  color: string;
  description: string;
  order: number;
  isActive: boolean;
};

type ServerAction = (formData: FormData) => void | Promise<void>;

type AdminRoleListClientProps = {
  roles: RoleItem[];
  updateRole: ServerAction;
  toggleRoleActive: ServerAction;
  deleteRole: ServerAction;
  reorderRoles: ServerAction;
};

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

export default function AdminRoleListClient({
  roles,
  updateRole,
  toggleRoleActive,
  deleteRole,
  reorderRoles,
}: AdminRoleListClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(roles);
  const itemsRef = useRef(roles);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    itemsRef.current = roles;
    setItems(roles);
  }, [roles]);

  function updateItems(nextItems: RoleItem[]) {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }

  function moveRole(targetId: string) {
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
      await reorderRoles(formData);
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
          <h2 className="mb-3 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Manage Roles</h2>
          <p className="max-w-2xl leading-7" style={{ color: "var(--asc-fg-3)" }}>
            Edit, show, hide, delete, or reorder Ascendra roles. Drag roles from the handle icon to change their order.
          </p>
          {isPending && (
            <p className="mt-3 text-sm font-black" style={{ color: "var(--asc-accent)" }}>Saving role order...</p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="border p-6 text-sm" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}>
            No roles found yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((role) => (
              <article
                key={role.id}
                onDragOver={(event) => { event.preventDefault(); moveRole(role.id); }}
                onDrop={(event) => { event.preventDefault(); handleDragEnd(); }}
                className={`flex gap-4 border p-5 transition ${draggedId === role.id ? "scale-[0.99] opacity-60" : ""}`}
                style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
              >
                <button
                  type="button"
                  draggable
                  title="Drag to reorder"
                  onDragStart={(event) => { setDraggedId(role.id); event.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={handleDragEnd}
                  className="mt-1 flex h-fit shrink-0 cursor-grab flex-col gap-1 border p-3 transition hover:opacity-80 active:cursor-grabbing"
                  style={inputStyle}
                >
                  <span className="block h-[2px] w-5 bg-current" />
                  <span className="block h-[2px] w-5 bg-current" />
                  <span className="block h-[2px] w-5 bg-current" />
                </button>

                <div className="flex-1">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span
                      className="inline-flex items-center border px-3 py-1 text-xs font-black uppercase tracking-[0.1em]"
                      style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
                    >
                      Role {role.order}
                    </span>
                    <span
                      className="inline-flex items-center border px-3 py-1 text-xs font-black uppercase tracking-[0.1em]"
                      style={role.isActive
                        ? { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }
                        : { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }}
                    >
                      {role.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>

                  <form action={updateRole} className="grid gap-4">
                    <input type="hidden" name="id" value={role.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        name="name"
                        defaultValue={role.name}
                        required
                        className="border px-4 py-3 text-sm outline-none transition"
                        style={inputStyle}
                      />
                      <select
                        name="color"
                        defaultValue={role.color}
                        className="border px-4 py-3 text-sm outline-none transition"
                        style={inputStyle}
                      >
                        <option value="text-red-300">Red</option>
                        <option value="text-purple-300">Purple</option>
                        <option value="text-blue-300">Blue</option>
                        <option value="text-cyan-300">Cyan</option>
                        <option value="text-yellow-300">Yellow</option>
                        <option value="text-green-300">Green</option>
                        <option value="text-gray-300">Gray</option>
                      </select>
                    </div>
                    <textarea
                      name="description"
                      defaultValue={role.description}
                      required
                      rows={3}
                      className="resize-none border px-4 py-3 text-sm outline-none transition"
                      style={inputStyle}
                    />
                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                      <button
                        type="submit"
                        className="border px-4 py-2 text-sm font-black transition hover:opacity-80 sm:w-auto"
                        style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <form action={toggleRoleActive}>
                      <input type="hidden" name="id" value={role.id} />
                      <input type="hidden" name="isActive" value={String(role.isActive)} />
                      <button
                        type="submit"
                        className="border px-4 py-2 text-sm font-black transition hover:opacity-80"
                        style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
                      >
                        {role.isActive ? "Hide" : "Show"}
                      </button>
                    </form>
                    <ConfirmDeleteForm
                      id={role.id}
                      action={deleteRole}
                      message="Are you sure you want to delete this role?"
                      onDeleted={() => {
                        const updatedRoles = itemsRef.current
                          .filter((item) => item.id !== role.id)
                          .map((item, index) => ({ ...item, order: index + 1 }));
                        updateItems(updatedRoles);
                      }}
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
