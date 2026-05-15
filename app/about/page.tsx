import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about The Noobs of Temple & Rift gaming community.",
};

const values = [
  {
    title: "Community First",
    description:
      "RTN is built around respect, teamwork, and a welcoming space for players of different games and skill levels.",
  },
  {
    title: "Games and Events",
    description:
      "The community focuses on gaming sessions, tournaments, shared events, and fun competitive moments.",
  },
  {
    title: "Fair Play",
    description:
      "Good behavior, fair competition, and respect for other members are important parts of the RTN experience.",
  },
  {
    title: "Growing Together",
    description:
      "RTN is made for players who want to meet others, improve, compete, and enjoy games as a community.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="About RTN"
        title="The Noobs of Temple & Rift."
        description="RTN is a gaming community for players who enjoy teamwork, tournaments, events, and spending time with others who share the same passion for games."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="mb-5 text-3xl font-black">Who we are</h2>

            <div className="grid gap-5 leading-8 text-gray-300">
              <p>
                The Noobs of Temple & Rift is a community made for players who
                want more than just joining random matches. RTN is about
                building a place where members can play together, compete,
                share moments, and be part of an active gaming group.
              </p>

              <p>
                The community welcomes different types of players, from casual
                members who play for fun to competitive players who enjoy
                tournaments and challenges.
              </p>

              <p>
                Our goal is to keep RTN organized, friendly, and enjoyable for
                everyone who joins.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-8">
            <h2 className="mb-5 text-3xl font-black text-indigo-300">
              What RTN offers
            </h2>

            <ul className="grid gap-4 text-gray-300">
              <li>Gaming sessions with community members</li>
              <li>Community tournaments and events</li>
              <li>Rules that keep the server fair and respectful</li>
              <li>Roles that help organize the community</li>
              <li>A place to meet players and stay connected</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="mb-3 text-xl font-bold">{item.title}</h3>

              <p className="leading-7 text-gray-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}