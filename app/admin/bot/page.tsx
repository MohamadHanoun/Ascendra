import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import AdminBotEventsPanel from "@/components/AdminBotEventsPanel";
import AdminBotSettingsPanel from "@/components/AdminBotSettingsPanel";
import AdminToast from "@/components/AdminToast";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bot Dashboard | Ascendra",
  description: "Ascendra Discord bot operations dashboard.",
};

type AdminBotPageProps = {
  searchParams: Promise<{
    message?: string;
    type?: string;
    botStatus?: string;
    botType?: string;
  }>;
};

export default async function AdminBotPage({
  searchParams,
}: AdminBotPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const toastType = params.type === "error" ? "error" : "success";

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto max-w-[1440px] px-6 pb-10 pt-14 lg:px-10">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-300">
                  Bot operations
                </p>

                <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
                  Bot Dashboard
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400">
                  Manage Discord bot settings, monitor queue activity, review
                  failed operations, and retry bot work from one focused admin
                  dashboard.
                </p>
              </div>

              <Link
                href="/admin"
                className="w-fit rounded-xl border border-white/10 bg-black/25 px-5 py-3 text-sm font-black text-gray-300 transition hover:border-violet-400/30 hover:bg-white/10 hover:text-white"
              >
                Back to Admin Panel
              </Link>
            </div>
          </div>
        </section>

        {params.message && (
          <AdminToast message={params.message} type={toastType} />
        )}

        <section className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
          <AdminBotSettingsPanel />

          <AdminBotEventsPanel
            statusFilter={params.botStatus}
            eventTypeFilter={params.botType}
          />
        </section>

        <Footer />
      </div>
    </main>
  );
}
