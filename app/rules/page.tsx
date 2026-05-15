import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import RuleCard from "@/components/RuleCard";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rules",
  description:
    "Read the main RTN rules that help keep the community fair, friendly, and respectful.",
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
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Rules"
        title="Keep the community fair, friendly, and fun."
        description="Read the main rules that help keep RTN fair, friendly, and respectful for everyone."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">

        {rules.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">No active rules yet</h2>

            <p className="text-gray-300">
              Active rules will appear here after they are created from the
              admin panel.
            </p>
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
    </main>
  );
}