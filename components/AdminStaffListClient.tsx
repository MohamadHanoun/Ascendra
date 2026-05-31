"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";

type StaffItem = {
  id: string;
  name: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  order: number;
  isActive: boolean;
};

type ServerAction = (formData: FormData) => void | Promise<void>;

type AdminStaffListClientProps = {
  staffMembers: StaffItem[];
  updateStaffMember: ServerAction;
  toggleStaffMemberActive: ServerAction;
  deleteStaffMember: ServerAction;
  reorderStaffMembers: ServerAction;
};

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

export default function AdminStaffListClient({
  staffMembers,
  updateStaffMember,
  toggleStaffMemberActive,
  deleteStaffMember,
  reorderStaffMembers,
}: AdminStaffListClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(staffMembers);
  const itemsRef = useRef(staffMembers);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    itemsRef.current = staffMembers;
    setItems(staffMembers);
  }, [staffMembers]);

  function updateItems(nextItems: StaffItem[]) {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }

  function moveStaffMember(targetId: string) {
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
      await reorderStaffMembers(formData);
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
          <h2 className="mb-3 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Manage Staff</h2>
          <p className="max-w-2xl leading-7" style={{ color: "var(--asc-fg-3)" }}>
            Edit, show, hide, delete, or reorder Ascendra staff members. Drag staff members from the handle icon to change their order.
          </p>
          {isPending && (
            <p className="mt-3 text-sm font-black" style={{ color: "var(--asc-green)" }}>Saving staff order...</p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="border p-6 text-sm" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}>
            No staff members found yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((member) => (
              <article
                key={member.id}
                onDragOver={(event) => { event.preventDefault(); moveStaffMember(member.id); }}
                onDrop={(event) => { event.preventDefault(); handleDragEnd(); }}
                className={`flex gap-4 border p-5 transition ${draggedId === member.id ? "scale-[0.99] opacity-60" : ""}`}
                style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
              >
                <button
                  type="button"
                  draggable
                  title="Drag to reorder"
                  onDragStart={(event) => { setDraggedId(member.id); event.dataTransfer.effectAllowed = "move"; }}
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
                      style={{ borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }}
                    >
                      Staff {member.order}
                    </span>
                    <span
                      className="inline-flex items-center border px-3 py-1 text-xs font-black uppercase tracking-[0.1em]"
                      style={member.isActive
                        ? { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }
                        : { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }}
                    >
                      {member.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>

                  <form action={updateStaffMember} className="grid gap-4">
                    <input type="hidden" name="id" value={member.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        name="name"
                        defaultValue={member.name}
                        required
                        className="border px-4 py-3 text-sm outline-none transition"
                        style={inputStyle}
                        placeholder="Name"
                      />
                      <input
                        name="role"
                        defaultValue={member.role}
                        required
                        className="border px-4 py-3 text-sm outline-none transition"
                        style={inputStyle}
                        placeholder="Role"
                      />
                    </div>
                    <input
                      name="status"
                      defaultValue={member.status}
                      required
                      className="border px-4 py-3 text-sm outline-none transition"
                      style={inputStyle}
                      placeholder="Status"
                    />
                    <input
                      name="avatarUrl"
                      defaultValue={member.avatarUrl || ""}
                      placeholder="Optional avatar URL"
                      className="border px-4 py-3 text-sm outline-none transition"
                      style={inputStyle}
                    />
                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                      <button
                        type="submit"
                        className="border px-4 py-2 text-sm font-black transition hover:opacity-80"
                        style={{ borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <form action={toggleStaffMemberActive}>
                      <input type="hidden" name="id" value={member.id} />
                      <input type="hidden" name="isActive" value={String(member.isActive)} />
                      <button
                        type="submit"
                        className="border px-4 py-2 text-sm font-black transition hover:opacity-80"
                        style={{ borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }}
                      >
                        {member.isActive ? "Hide" : "Show"}
                      </button>
                    </form>
                    <ConfirmDeleteForm
                      id={member.id}
                      action={deleteStaffMember}
                      message="Are you sure you want to delete this staff member?"
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
