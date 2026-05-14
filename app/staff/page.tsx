import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { staffMembers } from "@/data/staff";

export default function StaffPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="Staff Team"
        title="Meet the team behind the community."
        description="This page is prepared for future staff profiles, Discord avatars, and admin management."
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-24 md:grid-cols-3">
        {staffMembers.map((member) => (
          <article
            key={member.name}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-3xl font-black">
              {member.name.charAt(0)}
            </div>

            <h2 className="mb-2 text-2xl font-bold">{member.name}</h2>
            <p className="text-indigo-300">{member.role}</p>
            <p className="mt-4 text-gray-400">{member.status}</p>
          </article>
        ))}
      </section>

      <Footer />
    </main>
  );
}