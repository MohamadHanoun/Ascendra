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
      await reorderRoles(formData);
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
          <h2 className="mb-3 text-3xl font-black">Manage Roles</h2>

          <p className="max-w-2xl leading-7 text-gray-300">
            Edit, show, hide, delete, or reorder RTN roles. Drag roles from the
            handle icon to change their order.
          </p>

          {isPending && (
            <p className="mt-3 text-sm font-semibold text-blue-300">
              Saving role order...
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-gray-300">
            No roles found yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((role) => (
              <article
                key={role.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  moveRole(role.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDragEnd();
                }}
                className={`flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition ${
                  draggedId === role.id
                    ? "scale-[0.99] opacity-60"
                    : "hover:border-blue-500/40"
                }`}
              >
                <button
                  type="button"
                  draggable
                  title="Drag to reorder"
                  onDragStart={(event) => {
                    setDraggedId(role.id);
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
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-300">
                      Role {role.order}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        role.isActive
                          ? "bg-green-500/20 text-green-300"
                          : "bg-gray-500/20 text-gray-300"
                      }`}
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
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                      />

                      <select
                        name="color"
                        defaultValue={role.color}
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-400"
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
                      className="resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                    />

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="rounded-xl border border-blue-500/20 px-4 py-2 font-bold text-blue-300 transition hover:bg-blue-500/10"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <form action={toggleRoleActive}>
                      <input type="hidden" name="id" value={role.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={String(role.isActive)}
                      />

                      <button
                        type="submit"
                        className="rounded-xl border border-blue-500/20 px-4 py-2 font-bold text-blue-300 transition hover:bg-blue-500/10"
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
                            .map((item, index) => ({
                                ...item,
                                order: index + 1,
                            }));

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