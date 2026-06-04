import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import AdminGameForm from "@/components/AdminGameForm";
import AdminGameList from "@/components/AdminGameList";
import AdminShell from "@/components/AdminShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Games | Admin | Ascendra",
  description: "Manage games available on the Ascendra platform.",
};

export default async function AdminGamesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/admin");
  }

  return (
    <AdminShell
      userName={session.user.name}
      title="Manage Games"
      description="Add, edit, and configure games available on the Ascendra platform."
    >
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
        <AdminGameForm />
        <AdminGameList />
      </section>
    </AdminShell>
  );
}
