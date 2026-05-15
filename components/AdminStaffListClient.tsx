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
      await reorderStaffMembers(formData);
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
          <h2 className="mb-3 text-3xl font-black">Manage Staff</h2>

          <p className="max-w-2xl leading-7 text-gray-300">
            Edit, show, hide, delete, or reorder RTN staff members. Drag staff
            members from the handle icon to change their order.
          </p>

          {isPending && (
            <p className="mt-3 text-sm font-semibold text-green-300">
              Saving staff order...
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-gray-300">
            No staff members found yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((member) => (
              <article
                key={member.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  moveStaffMember(member.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDragEnd();
                }}
                className={`flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition ${
                  draggedId === member.id
                    ? "scale-[0.99] opacity-60"
                    : "hover:border-green-500/40"
                }`}
              >
                <button
                  type="button"
                  draggable
                  title="Drag to reorder"
                  onDragStart={(event) => {
                    setDraggedId(member.id);
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
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-300">
                      Staff {member.order}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        member.isActive
                          ? "bg-green-500/20 text-green-300"
                          : "bg-gray-500/20 text-gray-300"
                      }`}
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
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-green-400"
                      />

                      <input
                        name="role"
                        defaultValue={member.role}
                        required
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-green-400"
                      />
                    </div>

                    <input
                      name="status"
                      defaultValue={member.status}
                      required
                      className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-green-400"
                    />

                    <input
                      name="avatarUrl"
                      defaultValue={member.avatarUrl || ""}
                      placeholder="Optional avatar URL"
                      className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-green-400"
                    />

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="rounded-xl border border-green-500/20 px-4 py-2 font-bold text-green-300 transition hover:bg-green-500/10"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <form action={toggleStaffMemberActive}>
                      <input type="hidden" name="id" value={member.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={String(member.isActive)}
                      />

                      <button
                        type="submit"
                        className="rounded-xl border border-green-500/20 px-4 py-2 font-bold text-green-300 transition hover:bg-green-500/10"
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