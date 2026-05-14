import AdminModuleCard from "@/components/AdminModuleCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { adminModules } from "@/data/admin";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="Admin Panel"
        title="Manage the community from one place."
        description="This admin panel is prepared for future Discord login, database management, tournament control, XP settings, and live server statistics."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10 rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-6">
          <h2 className="mb-3 text-2xl font-bold text-yellow-300">
            Admin Login Coming Soon
          </h2>

          <p className="leading-7 text-gray-300">
            This page is only a visual structure for now. Later, it will require
            Discord login and admin permission before anyone can manage the
            website.
          </p>

          <button
            disabled
            className="mt-6 cursor-not-allowed rounded-xl border border-white/10 px-6 py-3 font-bold text-gray-400"
          >
            Login with Discord Coming Soon
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminModules.map((module) => (
            <AdminModuleCard
              key={module.title}
              title={module.title}
              description={module.description}
              status={module.status}
            />
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}