"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  activateStaffInline,
  deactivateStaffInline,
  deleteStaffInline,
  reorderStaffInline,
  updateStaffInline,
  type AdminStaffActionResult,
} from "@/actions/adminStaffInlineActions";
import InlineAdminStaffForm from "@/components/InlineAdminStaffForm";

type StaffItem = {
  id: string;
  name: string;
  role: string;
  status: string;
  order: number;
  isActive: boolean;
};

const staffStatuses = [
  { value: "active", label: "Active" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "inactive", label: "Inactive" },
];

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function StatusBadge({ active, status }: { active: boolean; status: string }) {
  if (!active) {
    return (
      <span
        className="inline-flex w-fit border px-3 py-1 text-xs font-black"
        style={{
          color: "var(--asc-fg-3)",
          borderColor: "var(--asc-line-soft)",
          background: "transparent",
        }}
      >
        Hidden
      </span>
    );
  }

  const normalizedStatus = status.toLowerCase();

  const statusStyles: Record<string, React.CSSProperties> = {
    active: {
      color: "var(--asc-green)",
      borderColor: "oklch(0.55 0.14 150 / 0.5)",
      background: "oklch(0.25 0.12 150 / 0.18)",
    },
    available: {
      color: "var(--asc-green)",
      borderColor: "oklch(0.55 0.14 150 / 0.5)",
      background: "oklch(0.25 0.12 150 / 0.18)",
    },
    busy: {
      color: "var(--asc-fg-2)",
      borderColor: "var(--asc-line-soft)",
      background: "var(--asc-bg-2)",
    },
    inactive: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "transparent",
    },
  };

  const style = statusStyles[normalizedStatus] ?? {
    color: "var(--asc-fg-3)",
    borderColor: "var(--asc-line-soft)",
    background: "transparent",
  };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black capitalize"
      style={style}
    >
      {status}
    </span>
  );
}

function Notice({ notice }: { notice: AdminStaffActionResult | null }) {
  if (!notice) return null;

  return (
    <div
      className="border px-4 py-3 text-sm font-bold"
      style={
        notice.ok
          ? {
              borderColor: "oklch(0.55 0.14 150 / 0.5)",
              background: "oklch(0.25 0.12 150 / 0.18)",
              color: "var(--asc-green)",
            }
          : {
              borderColor: "oklch(0.50 0.20 25 / 0.5)",
              background: "oklch(0.25 0.18 25 / 0.18)",
              color: "var(--asc-live)",
            }
      }
    >
      {notice.message}
    </div>
  );
}

function moveItem(items: StaffItem[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) return items;

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems.map((item, index) => ({ ...item, order: index + 1 }));
}

export default function AdminStaffDragList({
  initialStaffMembers,
}: {
  initialStaffMembers: StaffItem[];
}) {
  const router = useRouter();

  const [staffMembers, setStaffMembers] = useState(initialStaffMembers);
  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);
  const [dragOverStaffId, setDragOverStaffId] = useState<string | null>(null);
  const [notice, setNotice] = useState<AdminStaffActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setStaffMembers(initialStaffMembers);
  }, [initialStaffMembers]);

  function saveOrder(nextStaffMembers: StaffItem[]) {
    const formData = new FormData();

    formData.set(
      "orderedStaffIds",
      JSON.stringify(nextStaffMembers.map((staffMember) => staffMember.id)),
    );

    startTransition(async () => {
      const result = await reorderStaffInline(formData);

      setNotice(result);

      if (!result.ok) {
        setStaffMembers(initialStaffMembers);
        return;
      }

      window.setTimeout(() => {
        router.refresh();
      }, 300);
    });
  }

  function handleDragStart(staffId: string) {
    setDraggedStaffId(staffId);
    setNotice(null);
  }

  function handleDragOver(staffId: string) {
    if (!draggedStaffId || draggedStaffId === staffId) return;
    setDragOverStaffId(staffId);
  }

  function handleDrop(targetStaffId: string) {
    if (!draggedStaffId || draggedStaffId === targetStaffId) {
      setDraggedStaffId(null);
      setDragOverStaffId(null);
      return;
    }

    const fromIndex = staffMembers.findIndex(
      (staffMember) => staffMember.id === draggedStaffId,
    );
    const toIndex = staffMembers.findIndex(
      (staffMember) => staffMember.id === targetStaffId,
    );

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedStaffId(null);
      setDragOverStaffId(null);
      return;
    }

    const nextStaffMembers = moveItem(staffMembers, fromIndex, toIndex);

    setStaffMembers(nextStaffMembers);
    setDraggedStaffId(null);
    setDragOverStaffId(null);
    saveOrder(nextStaffMembers);
  }

  function handleDragEnd() {
    setDraggedStaffId(null);
    setDragOverStaffId(null);
  }

  if (staffMembers.length === 0) {
    return (
      <div
        className="border p-6 shadow-2xl shadow-black/20"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-bg-1)",
          color: "var(--asc-fg-3)",
        }}
      >
        No staff members found.
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
            Use the handle and drop the staff member in a new position.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {pending && (
            <div
              className="border px-4 py-3 text-sm font-bold"
              style={{
                borderColor: "oklch(0.50 0.20 285 / 0.4)",
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
            background: "oklch(0.08 0.02 287)",
            color: "var(--asc-fg-3)",
          }}
        >
          <span>Order</span>
          <span>Staff member</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        <div>
          {staffMembers.map((staffMember, index) => {
            const position = index + 1;
            const isDragging = draggedStaffId === staffMember.id;
            const isDragTarget = dragOverStaffId === staffMember.id;

            return (
              <article
                key={staffMember.id}
                draggable
                onDragStart={() => handleDragStart(staffMember.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  handleDragOver(staffMember.id);
                }}
                onDrop={() => handleDrop(staffMember.id)}
                onDragEnd={handleDragEnd}
                className={`grid gap-4 px-5 py-4 transition lg:grid-cols-[90px_minmax(0,1fr)_120px_220px] lg:items-start lg:gap-5 ${
                  isDragging ? "opacity-50" : ""
                } ${isDragTarget ? "bg-violet-500/10" : "hover:bg-white/[0.035]"}`}
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div className="flex items-center justify-between gap-3 lg:justify-start">
                  <span
                    className="grid h-10 w-10 place-items-center text-sm font-black"
                    style={{
                      border: "1px solid oklch(0.50 0.20 285 / 0.4)",
                      background: "var(--asc-accent-dim)",
                      color: "var(--asc-accent)",
                    }}
                  >
                    {String(position).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    aria-label="Drag staff member"
                    className="grid h-10 w-10 cursor-grab place-items-center text-lg font-black transition active:cursor-grabbing lg:hidden"
                    style={{
                      border: "1px solid var(--asc-line-soft)",
                      background: "oklch(0.09 0.02 287)",
                      color: "var(--asc-fg-3)",
                    }}
                  >
                    ≡
                  </button>
                </div>

                <InlineAdminStaffForm
                  action={updateStaffInline}
                  buttonLabel="Save"
                  pendingLabel="Saving..."
                  className="grid gap-4"
                  confirmTitle="Save staff changes?"
                  confirmDescription={`Save changes to ${staffMember.name}?`}
                  confirmLabel="Save staff member"
                >
                  <input type="hidden" name="staffId" value={staffMember.id} />
                  <input type="hidden" name="order" value={position} />

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
                    <label className="grid gap-2">
                      <span
                        className="text-xs font-black uppercase tracking-[0.12em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        Name
                      </span>
                      <input
                        name="name"
                        required
                        defaultValue={staffMember.name}
                        className="border px-4 py-3 text-white outline-none transition"
                        style={inputStyle}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span
                        className="text-xs font-black uppercase tracking-[0.12em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        Role
                      </span>
                      <input
                        name="role"
                        required
                        defaultValue={staffMember.role}
                        className="border px-4 py-3 text-white outline-none transition"
                        style={inputStyle}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span
                        className="text-xs font-black uppercase tracking-[0.12em]"
                        style={{ color: "var(--asc-fg-3)" }}
                      >
                        Status
                      </span>
                      <select
                        name="status"
                        required
                        defaultValue={staffMember.status}
                        className="border px-4 py-3 text-white outline-none transition"
                        style={inputStyle}
                      >
                        {staffStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </InlineAdminStaffForm>

                <div className="flex items-center justify-between gap-3 lg:block">
                  <StatusBadge
                    active={staffMember.isActive}
                    status={staffMember.status}
                  />

                  <button
                    type="button"
                    aria-label="Drag staff member"
                    className="hidden h-10 w-10 cursor-grab place-items-center text-lg font-black transition active:cursor-grabbing lg:mt-4 lg:grid"
                    style={{
                      border: "1px solid var(--asc-line-soft)",
                      background: "oklch(0.09 0.02 287)",
                      color: "var(--asc-fg-3)",
                    }}
                  >
                    ≡
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {staffMember.isActive ? (
                    <InlineAdminStaffForm
                      action={deactivateStaffInline}
                      buttonLabel="Hide"
                      pendingLabel="Hiding..."
                      variant="secondary"
                      className="grid gap-2"
                      confirmTitle="Hide staff member?"
                      confirmDescription={`Hide ${staffMember.name} from the public staff list?`}
                      confirmLabel="Hide staff member"
                    >
                      <input
                        type="hidden"
                        name="staffId"
                        value={staffMember.id}
                      />
                    </InlineAdminStaffForm>
                  ) : (
                    <InlineAdminStaffForm
                      action={activateStaffInline}
                      buttonLabel="Show"
                      pendingLabel="Showing..."
                      variant="success"
                      className="grid gap-2"
                      confirmTitle="Show staff member?"
                      confirmDescription={`Show ${staffMember.name} in the public staff list?`}
                      confirmLabel="Show staff member"
                    >
                      <input
                        type="hidden"
                        name="staffId"
                        value={staffMember.id}
                      />
                    </InlineAdminStaffForm>
                  )}

                  <InlineAdminStaffForm
                    action={deleteStaffInline}
                    buttonLabel="Delete"
                    pendingLabel="Deleting..."
                    variant="danger"
                    className="grid gap-2"
                    confirmTitle="Delete staff member?"
                    confirmDescription={`Delete ${staffMember.name}? This cannot be undone.`}
                    confirmLabel="Delete permanently"
                  >
                    <input
                      type="hidden"
                      name="staffId"
                      value={staffMember.id}
                    />
                  </InlineAdminStaffForm>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
