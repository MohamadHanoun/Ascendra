import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RuleCard from "@/components/RuleCard";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rules | Ascendra",
  description:
    "Read the main Ascendra rules that help keep the community fair, friendly, and respectful.",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getRules() {
  return prisma.rule.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: "asc",
    },
  });
}

export default async function RulesPage() {
  const rules = await getRules();

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(7,8,17,0.98),rgba(7,8,17,0.82),rgba(7,8,17,0.98)),url('https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=2200&q=80')] bg-cover bg-center opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.28)_0%,transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.10)_0%,transparent_28%)]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
            <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
              Ascendra rules
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
              Keep the community fair and competitive.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Read the main rules that help keep Ascendra fair, friendly, and
              respectful for every player and team.
            </p>
          </div>

          <svg
            className="absolute bottom-[-1px] left-0 w-full text-[#070811]"
            viewBox="0 0 1440 120"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
          {rules.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20">
              <EmptyState
                title="No active rules yet"
                description="Ascendra rules will appear here when they are available."
              />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {rules.map((rule, index) => (
                <RuleCard key={rule.id} rule={rule.text} index={index} />
              ))}
            </div>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}
