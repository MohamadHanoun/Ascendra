import type { Tournament, TournamentStatus } from "@/data/tournaments";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

type TournamentCardProps = {
  tournament: Tournament;
};

type TournamentCardMessages = {
  statuses: Record<TournamentStatus, string>;
  labels: {
    date: string;
    prize: string;
    slots: string;
  };
  buttons: Record<TournamentStatus, string>;
  legacyText: Record<string, string>;
};

const tournamentCardMessages: Record<Locale, TournamentCardMessages> = {
  en: {
    statuses: {
      open: "Open",
      upcoming: "Upcoming",
      closed: "Closed",
    },
    labels: {
      date: "Date",
      prize: "Prize",
      slots: "Slots",
    },
    buttons: {
      open: "Login required later",
      upcoming: "Registration coming soon",
      closed: "Registration closed",
    },
    legacyText: {
      "Multi-Game": "Multi-Game",
      "Competitive Games": "Competitive Games",
      "Community Games": "Community Games",
      "Tournament System": "Tournament System",
      "Coming soon": "Coming soon",
      "Future update": "Future update",
      "To be announced": "To be announced",
      "Community rewards": "Community rewards",
      "Fun rewards": "Fun rewards",
      "Testing phase": "Testing phase",
      "Open slots": "Open slots",
      "Limited slots": "Limited slots",
      "Open for members": "Open for members",
      "Not available": "Not available",
      "Ascendra Community Cup": "Ascendra Community Cup",
      "Ascendra Ranked Night": "Ascendra Ranked Night",
      "Ascendra Casual Event": "Ascendra Casual Event",
      "Ascendra Test Bracket": "Ascendra Test Bracket",
      "A future Ascendra tournament designed for players from different electronic games. Registration will later require Discord login.":
        "A future Ascendra tournament designed for players from different electronic games. Registration will later require Discord login.",
      "A planned event for competitive players who want to join organized matches and community challenges.":
        "A planned event for competitive players who want to join organized matches and community challenges.",
      "A casual event for members who want to play, meet others, and enjoy the community without pressure.":
        "A casual event for members who want to play, meet others, and enjoy the community without pressure.",
      "A placeholder tournament used to prepare the future registration, brackets, results, and admin tools.":
        "A placeholder tournament used to prepare the future registration, brackets, results, and admin tools.",
    },
  },

  ar: {
    statuses: {
      open: "مفتوحة",
      upcoming: "قادمة",
      closed: "مغلقة",
    },
    labels: {
      date: "التاريخ",
      prize: "الجائزة",
      slots: "المقاعد",
    },
    buttons: {
      open: "تسجيل الدخول سيكون مطلوبًا لاحقًا",
      upcoming: "التسجيل قريبًا",
      closed: "التسجيل مغلق",
    },
    legacyText: {
      "Multi-Game": "ألعاب متعددة",
      "Competitive Games": "ألعاب تنافسية",
      "Community Games": "ألعاب المجتمع",
      "Tournament System": "نظام البطولات",
      "Coming soon": "قريبًا",
      "Future update": "تحديث مستقبلي",
      "To be announced": "سيتم الإعلان عنها لاحقًا",
      "Community rewards": "مكافآت مجتمعية",
      "Fun rewards": "مكافآت ترفيهية",
      "Testing phase": "مرحلة الاختبار",
      "Open slots": "مقاعد مفتوحة",
      "Limited slots": "مقاعد محدودة",
      "Open for members": "مفتوحة للأعضاء",
      "Not available": "غير متاح",
      "Ascendra Community Cup": "كأس مجتمع Ascendra",
      "Ascendra Ranked Night": "ليلة Ascendra التنافسية",
      "Ascendra Casual Event": "فعالية Ascendra الترفيهية",
      "Ascendra Test Bracket": "اختبار نظام البطولة في Ascendra",
      "A future Ascendra tournament designed for players from different electronic games. Registration will later require Discord login.":
        "بطولة مستقبلية من Ascendra مصممة للاعبين من ألعاب إلكترونية مختلفة. سيتطلب التسجيل لاحقًا تسجيل الدخول عبر Discord.",
      "A planned event for competitive players who want to join organized matches and community challenges.":
        "فعالية مخططة للاعبين التنافسيين الذين يرغبون في الانضمام إلى مباريات منظمة وتحديات مجتمعية.",
      "A casual event for members who want to play, meet others, and enjoy the community without pressure.":
        "فعالية ترفيهية للأعضاء الذين يرغبون في اللعب والتعرّف على الآخرين والاستمتاع بالمجتمع دون ضغط.",
      "A placeholder tournament used to prepare the future registration, brackets, results, and admin tools.":
        "بطولة تجريبية تُستخدم للتحضير لنظام التسجيل، والجداول، والنتائج، وأدوات الإدارة المستقبلية.",
    },
  },
};

const statusColors: Record<TournamentStatus, string> = {
  open: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  upcoming: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  closed: "border-red-400/25 bg-red-500/10 text-red-300",
};

function translateLegacyText(value: string, messages: TournamentCardMessages) {
  return messages.legacyText[value] || value;
}

export default async function TournamentCard({
  tournament,
}: TournamentCardProps) {
  const locale = await getLocale();
  const messages = tournamentCardMessages[locale];

  return (
    <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:-translate-y-1 hover:bg-white/10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-gray-300">
          {translateLegacyText(tournament.game, messages)}
        </span>

        <span
          className={`rounded-full border px-4 py-1 text-sm font-semibold ${
            statusColors[tournament.status]
          }`}
        >
          {messages.statuses[tournament.status]}
        </span>
      </div>

      <h2 className="mb-4 text-2xl font-bold">
        {translateLegacyText(tournament.title, messages)}
      </h2>

      <p className="mb-6 flex-1 leading-7 text-gray-300">
        {translateLegacyText(tournament.description, messages)}
      </p>

      <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="mb-3 text-sm text-gray-300">
          <span className="font-bold text-white">{messages.labels.date}:</span>{" "}
          {translateLegacyText(tournament.date, messages)}
        </p>

        <p className="mb-3 text-sm text-gray-300">
          <span className="font-bold text-white">{messages.labels.prize}:</span>{" "}
          {translateLegacyText(tournament.prize, messages)}
        </p>

        <p className="text-sm text-gray-300">
          <span className="font-bold text-white">{messages.labels.slots}:</span>{" "}
          {translateLegacyText(tournament.teams, messages)}
        </p>
      </div>

      <button
        disabled
        className="mt-auto cursor-not-allowed rounded-xl bg-white/10 px-6 py-3 font-bold text-gray-400"
      >
        {messages.buttons[tournament.status]}
      </button>
    </article>
  );
}
