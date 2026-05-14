import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { basicRules } from "@/data/rules";

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="Server Rules"
        title="Read the rules before joining the community."
        description="These rules help keep the server friendly, organized, and safe for everyone."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="space-y-4">
            {basicRules.map((rule, index) => (
              <div
                key={rule}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <p className="text-gray-300">
                  <span className="mr-3 font-bold text-indigo-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}