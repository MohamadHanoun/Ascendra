"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  activateRoleInline,
  deactivateRoleInline,
  deleteRoleInline,
  reorderRolesInline,
  updateRoleInline,
  type AdminRoleActionResult,
} from "@/actions/adminRoleInlineActions";
import InlineAdminRoleForm from "@/components/InlineAdminRoleForm";

type RoleItem = {
  id: string;
  name: string;
  color: string;
  description: string;
  order: number;
  isActive: boolean;
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        active
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {active ? "Active" : "Hidden"}
    </span>
  );
}

function Notice({ notice }: { notice: AdminRoleActionResult | null }) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-bold ${
        notice.ok
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-red-400/25 bg-red-500/10 text-red-300"
      }`}
    >
      {notice.message}
    </div>
  );
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

function normalizeColor(color: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return "#8b5cf6";
}

function moveItem(items: RoleItem[], fromIndex: number, toIndex: number) {
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

export default function AdminRoleDragList({
  initialRoles,
}: {
  initialRoles: RoleItem[];
}) {
  const router = useRouter();

  const [roles, setRoles] = useState(initialRoles);
  const [draggedRoleId, setDraggedRoleId] = useState<string | null>(null);
  const [dragOverRoleId, setDragOverRoleId] = useState<string | null>(null);
  const [notice, setNotice] = useState<AdminRoleActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);

  function saveOrder(nextRoles: RoleItem[]) {
    const formData = new FormData();

    formData.set(
      "orderedRoleIds",
      JSON.stringify(nextRoles.map((role) => role.id)),
    );

    startTransition(async () => {
      const result = await reorderRolesInline(formData);

      setNotice(result);

      if (!result.ok) {
        setRoles(initialRoles);
        return;
      }

      window.setTimeout(() => {
        router.refresh();
      }, 300);
    });
  }

  function handleDragStart(roleId: string) {
    setDraggedRoleId(roleId);
    setNotice(null);
  }

  function handleDragOver(roleId: string) {
    if (!draggedRoleId || draggedRoleId === roleId) {
      return;
    }

    setDragOverRoleId(roleId);
  }

  function handleDrop(targetRoleId: string) {
    if (!draggedRoleId || draggedRoleId === targetRoleId) {
      setDraggedRoleId(null);
      setDragOverRoleId(null);
      return;
    }

    const fromIndex = roles.findIndex((role) => role.id === draggedRoleId);
    const toIndex = roles.findIndex((role) => role.id === targetRoleId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedRoleId(null);
      setDragOverRoleId(null);
      return;
    }

    const nextRoles = moveItem(roles, fromIndex, toIndex);

    setRoles(nextRoles);
    setDraggedRoleId(null);
    setDragOverRoleId(null);
    saveOrder(nextRoles);
  }

  function handleDragEnd() {
    setDraggedRoleId(null);
    setDragOverRoleId(null);
  }

  if (roles.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-gray-300 shadow-2xl shadow-black/20">
        No roles found.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 shadow-2xl shadow-black/20 lg:flex-row lg:items-center">
        <div>
          <p className="font-black text-white">Drag to reorder</p>
          <p className="mt-1 text-sm text-gray-400">
            Use the handle and drop the role in a new position.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {pending && (
            <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200">
              Saving order...
            </div>
          )}

          <Notice notice={notice} />
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
        <div className="hidden border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500 lg:grid lg:grid-cols-[90px_minmax(0,1fr)_120px_220px] lg:gap-5">
          <span>Order</span>
          <span>Role</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-white/10">
          {roles.map((role, index) => {
            const position = index + 1;
            const isDragging = draggedRoleId === role.id;
            const isDragTarget = dragOverRoleId === role.id;

            return (
              <article
                key={role.id}
                draggable
                onDragStart={() => handleDragStart(role.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  handleDragOver(role.id);
                }}
                onDrop={() => handleDrop(role.id)}
                onDragEnd={handleDragEnd}
                className={`grid gap-4 px-5 py-4 transition lg:grid-cols-[90px_minmax(0,1fr)_120px_220px] lg:items-start lg:gap-5 ${
                  isDragging ? "opacity-50" : ""
                } ${
                  isDragTarget ? "bg-violet-500/10" : "hover:bg-white/[0.035]"
                }`}
              >
                <div className="flex items-center justify-between gap-3 lg:justify-start">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-sm font-black text-violet-200">
                    {String(position).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    aria-label="Drag role"
                    className="grid h-10 w-10 cursor-grab place-items-center rounded-xl border border-white/10 bg-black/25 text-lg font-black text-gray-300 transition hover:border-violet-400/40 hover:text-violet-200 active:cursor-grabbing lg:hidden"
                  >
                    ≡
                  </button>
                </div>

                <InlineAdminRoleForm
                  action={updateRoleInline}
                  buttonLabel="Save"
                  pendingLabel="Saving..."
                  className="grid gap-4"
                >
                  <input type="hidden" name="roleId" value={role.id} />
                  <input type="hidden" name="order" value={position} />

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px]">
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
                        type="color"
                        required
                        defaultValue={normalizeColor(role.color)}
                        className="h-[50px] w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 p-2 outline-none transition focus:border-violet-400"
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
                      className={`${inputClass()} min-h-20 resize-y text-sm leading-6`}
                    />
                  </label>
                </InlineAdminRoleForm>

                <div className="flex items-center justify-between gap-3 lg:block">
                  <StatusBadge active={role.isActive} />

                  <button
                    type="button"
                    aria-label="Drag role"
                    className="hidden h-10 w-10 cursor-grab place-items-center rounded-xl border border-white/10 bg-black/25 text-lg font-black text-gray-300 transition hover:border-violet-400/40 hover:text-violet-200 active:cursor-grabbing lg:mt-4 lg:grid"
                  >
                    ≡
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {role.isActive ? (
                    <InlineAdminRoleForm
                      action={deactivateRoleInline}
                      buttonLabel="Hide"
                      pendingLabel="Hiding..."
                      variant="secondary"
                      className="grid gap-2"
                    >
                      <input type="hidden" name="roleId" value={role.id} />
                    </InlineAdminRoleForm>
                  ) : (
                    <InlineAdminRoleForm
                      action={activateRoleInline}
                      buttonLabel="Show"
                      pendingLabel="Showing..."
                      variant="success"
                      className="grid gap-2"
                    >
                      <input type="hidden" name="roleId" value={role.id} />
                    </InlineAdminRoleForm>
                  )}

                  <InlineAdminRoleForm
                    action={deleteRoleInline}
                    buttonLabel="Delete"
                    pendingLabel="Deleting..."
                    variant="danger"
                    className="grid gap-2"
                    confirmTitle="Delete role?"
                    confirmDescription={`Delete ${role.name}? This cannot be undone.`}
                    confirmLabel="Delete permanently"
                  >
                    <input type="hidden" name="roleId" value={role.id} />
                  </InlineAdminRoleForm>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
