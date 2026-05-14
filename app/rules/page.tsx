import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import RuleCard from "@/components/RuleCard";
import { basicRules } from "@/data/rules";

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Rules"
        title="Keep the community fair, friendly, and fun."
        description="These rules help The Noobs of Temple & Rift stay organized, respectful, and enjoyable for every player in the community."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10 rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-6">
          <h2 className="mb-3 text-2xl font-bold text-indigo-300">
            Rules Management Coming Later
          </h2>

          <p className="leading-7 text-gray-300">
            These rules are currently loaded from static website data. Later,
            RTN admins will be able to add, edit, remove, and reorder rules
            directly from the admin panel.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {basicRules.map((rule, index) => (
            <RuleCard key={rule} rule={rule} index={index} />
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}