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

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function StatusBadge({ active }: { active: boolean }) {
  const style: React.CSSProperties = active
    ? {
        color: "var(--asc-green)",
        borderColor: "var(--asc-green-border)",
        background: "var(--asc-green-bg)",
      }
    : {
        color: "var(--asc-fg-3)",
        borderColor: "var(--asc-line-soft)",
        background: "transparent",
      };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black"
      style={style}
    >
      {active ? "Active" : "Hidden"}
    </span>
  );
}

function Notice({ notice }: { notice: AdminRoleActionResult | null }) {
  if (!notice) return null;

  return (
    <div
      className="border px-4 py-3 text-sm font-bold"
      style={
        notice.ok
          ? {
              borderColor: "var(--asc-green-border)",
              background: "var(--asc-green-bg)",
              color: "var(--asc-green)",
            }
          : {
              borderColor: "var(--asc-live-border)",
              background: "var(--asc-live-bg)",
              color: "var(--asc-live)",
            }
      }
    >
      {notice.message}
    </div>
  );
}

function normalizeColor(color: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return "#b8893d";
}

function moveItem(items: RoleItem[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) return items;

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems.map((item, index) => ({ ...item, order: index + 1 }));
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
    if (!draggedRoleId || draggedRoleId === roleId) return;
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
      <div
        className="border p-6 shadow-2xl shadow-black/20"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-bg-1)",
          color: "var(--asc-fg-3)",
        }}
      >
        No roles found.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div
        className="flex flex-col justify-between gap-3 border px-5 py-4 shadow-2xl shadow-black/20 lg:flex-row lg:items-center"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-bg-1)",
        }}
      >
        <div>
          <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
            Drag to reorder
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            Use the handle and drop the role in a new position.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {pending && (
            <div
              className="border px-4 py-3 text-sm font-bold"
              style={{
                borderColor: "var(--asc-accent-border)",
                background: "var(--asc-accent-dim)",
                color: "var(--asc-accent)",
              }}
            >
              Saving order...
            </div>
          )}

          <Notice notice={notice} />
        </div>
      </div>

      <section
        className="overflow-hidden border shadow-2xl shadow-black/20"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-bg-1)",
        }}
      >
        <div
          className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] lg:grid lg:grid-cols-[90px_minmax(0,1fr)_120px_220px] lg:gap-5"
          style={{
            borderBottom: "1px solid var(--asc-line-soft)",
            background: "var(--asc-table-head-bg)",
            color: "var(--asc-fg-3)",
          }}
        >
          <span>Order</span>
          <span>Role</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        <div>
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
                } ${isDragTarget ? "bg-[var(--asc-accent-dim)]" : "hover:bg-white/[0.035]"}`}
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div className="flex items-center justify-between gap-3 lg:justify-start">
                  <span
                    className="grid h-10 w-10 place-items-center text-sm font-black"
                    style={{
                      border: "1px solid var(--asc-accent-border)",
                      background: "var(--asc-accent-dim)",
                      color: "var(--asc-accent)",
                    }}
                  >
                    {String(position).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    aria-label="Drag role"
                    className="grid h-10 w-10 cursor-grab place-items-center text-lg font-black transition active:cursor-grabbing lg:hidden"
                    style={{
                      border: "1px solid var(--asc-line-soft)",
                      background: "var(--asc-bg-2)",
                      color: "var(--asc-fg-3)",
                    }}
                  >
                    ≡
                  </button>
                </div>

                <InlineAdminRoleForm
                  action={updateRoleInline}
                  buttonLabel="Save"
                  pendingLabel="Saving..."
                  className="grid gap-4"
                  confirmTitle="Save role changes?"
                  confirmDescription={`Save changes to ${role.name}?`}
                  confirmLabel="Save role"
                >
                  <input type="hidden" name="roleId" value={role.id} />
                  <input type="hidden" name="order" value={position} />

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px]">
                    <label className="grid gap-2">
                      <span
                        className="text-xs font-black uppercase tracking-[0.12em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        Role name
                      </span>
                      <input
                        name="name"
                        required
                        defaultValue={role.name}
                        className="border px-4 py-3 outline-none transition"
                        style={inputStyle}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span
                        className="text-xs font-black uppercase tracking-[0.12em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        Color
                      </span>
                      <input
                        name="color"
                        type="color"
                        required
                        defaultValue={normalizeColor(role.color)}
                        className="h-[50px] w-full cursor-pointer border p-2 outline-none transition"
                        style={inputStyle}
                      />
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span
                      className="text-xs font-black uppercase tracking-[0.12em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      Description
                    </span>
                    <textarea
                      name="description"
                      required
                      defaultValue={role.description}
                      className="min-h-20 resize-y border px-4 py-3 text-sm leading-6 outline-none transition"
                      style={inputStyle}
                    />
                  </label>
                </InlineAdminRoleForm>

                <div className="flex items-center justify-between gap-3 lg:block">
                  <StatusBadge active={role.isActive} />

                  <button
                    type="button"
                    aria-label="Drag role"
                    className="hidden h-10 w-10 cursor-grab place-items-center text-lg font-black transition active:cursor-grabbing lg:mt-4 lg:grid"
                    style={{
                      border: "1px solid var(--asc-line-soft)",
                      background: "var(--asc-bg-2)",
                      color: "var(--asc-fg-3)",
                    }}
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
                      confirmTitle="Hide role?"
                      confirmDescription={`Hide ${role.name} from the public roles list?`}
                      confirmLabel="Hide role"
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
                      confirmTitle="Show role?"
                      confirmDescription={`Show ${role.name} in the public roles list?`}
                      confirmLabel="Show role"
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
