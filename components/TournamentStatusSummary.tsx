import type { Tournament, TournamentStatus } from "@/data/tournaments";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

type TournamentStatusSummaryProps = {
  tournaments: Tournament[];
};

type StatusCard = {
  label: string;
  status: TournamentStatus;
  description: string;
};

const statusCardsByLocale: Record<Locale, StatusCard[]> = {
  en: [
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
  ],

  ar: [
    {
      label: "مفتوحة",
      status: "open",
      description: "بطولات جاهزة للتسجيل لاحقًا.",
    },
    {
      label: "قادمة",
      status: "upcoming",
      description: "بطولات مخططة وفعاليات مستقبلية.",
    },
    {
      label: "مغلقة",
      status: "closed",
      description: "التسجيل مغلق.",
    },
  ],
};

export default async function TournamentStatusSummary({
  tournaments,
}: TournamentStatusSummaryProps) {
  const locale = await getLocale();
  const statusCards = statusCardsByLocale[locale];

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
              <p className="mb-2 text-4xl font-black text-violet-400">
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
