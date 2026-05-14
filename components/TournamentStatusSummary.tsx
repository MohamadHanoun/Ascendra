import { tournaments } from "@/data/tournaments";

const statusCards = [
  {
    label: "Open",
    status: "open",
    description: "Tournaments ready for registration later.",
  },
  {
    label: "Upcoming",
    status: "upcoming",
    description: "Planned tournaments and future events.",
  },
  {
    label: "Closed",
    status: "closed",
    description: "Registration is closed.",
  },
];

export default function TournamentStatusSummary() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="grid gap-6 md:grid-cols-3">
        {statusCards.map((card) => {
          const count = tournaments.filter(
            (tournament) => tournament.status === card.status,
          ).length;

          return (
            <article
              key={card.status}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <p className="mb-2 text-4xl font-black text-indigo-400">
                {count}
              </p>

              <h2 className="mb-3 text-xl font-bold">{card.label}</h2>

              <p className="leading-7 text-gray-300">{card.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}