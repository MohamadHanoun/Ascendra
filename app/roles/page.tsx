import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { serverRoles } from "@/data/roles";

export default function RolesPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="Server Roles"
        title="Explore the server roles and future ranking system."
        description="This page will later connect with Discord roles and the XP system."
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-24 md:grid-cols-2 lg:grid-cols-3">
        {serverRoles.map((role) => (
          <article
            key={role.name}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:-translate-y-1 hover:bg-white/10"
          >
            <h2 className={`mb-4 text-2xl font-bold ${role.color}`}>
              {role.name}
            </h2>

            <p className="leading-7 text-gray-300">{role.description}</p>
          </article>
        ))}
      </section>

      <Footer />
    </main>
  );
}