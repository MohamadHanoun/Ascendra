import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

type TournamentHeroMessages = {
  label: string;
  title: string;
  description: string;
  viewTournaments: string;
  loginComingSoon: string;
};

const tournamentHeroMessages: Record<Locale, TournamentHeroMessages> = {
  en: {
    label: "Ascendra Tournaments",
    title: "Compete with the community and join future Ascendra events.",
    description:
      "This page will become the main place for Ascendra tournament announcements, registrations, team slots, match schedules, brackets, and future Discord account login.",
    viewTournaments: "View tournaments",
    loginComingSoon: "Login coming soon",
  },

  ar: {
    label: "بطولات Ascendra",
    title: "نافس مع المجتمع وانضم إلى فعاليات Ascendra القادمة.",
    description:
      "ستكون هذه الصفحة المكان الأساسي لإعلانات بطولات Ascendra، والتسجيلات، ومقاعد الفرق، وجداول المباريات، وأنظمة البطولة، وتسجيل الدخول عبر Discord مستقبلًا.",
    viewTournaments: "عرض البطولات",
    loginComingSoon: "تسجيل الدخول قريبًا",
  },
};

export default async function TournamentHero() {
  const locale = await getLocale();
  const messages = tournamentHeroMessages[locale];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-violet-500/10">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
          {messages.label}
        </p>

        <h1 className="mb-6 max-w-3xl text-5xl font-black leading-tight md:text-7xl">
          {messages.title}
        </h1>

        <p className="max-w-2xl text-lg leading-8 text-gray-300">
          {messages.description}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#tournaments"
            className="rounded-xl bg-violet-600 px-7 py-4 font-bold transition hover:bg-violet-500"
          >
            {messages.viewTournaments}
          </a>

          <button
            disabled
            className="cursor-not-allowed rounded-xl border border-white/10 px-7 py-4 font-bold text-gray-400"
          >
            {messages.loginComingSoon}
          </button>
        </div>
      </div>
    </section>
  );
}
