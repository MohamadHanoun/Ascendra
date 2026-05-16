import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Preview",
  description: "RTN current colors with platform layout preview.",
};

const tournaments = [
  {
    title: "RTN Valorant Cup",
    game: "Valorant",
    format: "5v5",
    teams: "6 / 16",
    status: "Open",
  },
  {
    title: "Rift Masters",
    game: "League of Legends",
    format: "5v5",
    teams: "4 / 8",
    status: "Upcoming",
  },
  {
    title: "Dust Protocol",
    game: "CS2",
    format: "5v5",
    teams: "10 / 16",
    status: "Closed",
  },
];

const features = [
  {
    title: "Create tournaments",
    description:
      "Build clean tournament pages with team size, slots, game, and registration rules.",
  },
  {
    title: "Manage teams",
    description:
      "Players create teams, invite members, and submit them for admin review.",
  },
  {
    title: "Review registrations",
    description:
      "Admins approve or reject tournament registrations from one clear queue.",
  },
];

const queue = [
  {
    name: "RTN Wolves",
    type: "Team Review",
    status: "Pending",
    date: "Today, 18:42",
  },
  {
    name: "Rift Hunters",
    type: "Tournament Registration",
    status: "Approved",
    date: "Yesterday, 21:10",
  },
  {
    name: "Dust Squad",
    type: "Tournament Registration",
    status: "Rejected",
    date: "12 May, 16:05",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: "bg-green-500/10 text-green-300 border-green-500/20",
    Approved: "bg-green-500/10 text-green-300 border-green-500/20",
    Upcoming: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    Pending: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    Closed: "bg-red-500/10 text-red-300 border-red-500/20",
    Rejected: "bg-red-500/10 text-red-300 border-red-500/20",
  };

  return (
    <span
      className={`inline-flex rounded border px-2.5 py-1 text-xs font-bold ${
        styles[status] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded bg-indigo-500 px-6 py-3 font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400">
      {children}
    </button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded border border-white/10 bg-white/5 px-6 py-3 font-black text-white transition hover:bg-white/10">
      {children}
    </button>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
        {label}
      </p>

      <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
        {title}
      </h2>

      <p className="mt-4 text-lg leading-8 text-gray-300">{description}</p>
    </div>
  );
}

export default function DesignPreviewPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[#0b0f1a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.28)_0%,transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.16)_0%,transparent_28%)]" />

        <header className="relative z-10 border-b border-white/10">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded bg-indigo-500 text-sm font-black text-white">
                RTN
              </div>

              <div>
                <p className="text-lg font-black leading-none">RTN</p>
                <p className="mt-1 text-xs text-gray-400">
                  The Noobs of Temple & Rift
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-8 lg:flex">
              {["Tournaments", "Teams", "Leaderboard", "Rules", "About"].map(
                (item) => (
                  <button
                    key={item}
                    className="text-sm font-semibold text-gray-300 transition hover:text-white"
                  >
                    {item}
                  </button>
                ),
              )}
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden rounded border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white sm:block">
                Sign in
              </button>

              <button className="rounded bg-indigo-500 px-5 py-2 text-sm font-black text-white transition hover:bg-indigo-400">
                Join Discord
              </button>
            </div>
          </nav>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Tournament platform
            </p>

            <h1 className="max-w-5xl text-5xl font-black leading-[1.04] tracking-tight md:text-7xl">
              Run RTN tournaments with a clean professional platform.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Create tournaments, approve teams, manage registrations, and keep
              players informed through a simple RTN tournament hub.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryButton>Explore tournaments</PrimaryButton>
              <SecondaryButton>Create a team</SecondaryButton>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/30">
            <div className="rounded-md border border-white/10 bg-[#0b0f1a]">
              <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
                  Admin queue
                </p>

                <h2 className="mt-2 text-2xl font-black text-white">
                  Pending actions
                </h2>
              </div>

              <div className="divide-y divide-white/10">
                {queue.map((item) => (
                  <div
                    key={`${item.name}-${item.type}`}
                    className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-black text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {item.type} · {item.date}
                      </p>
                    </div>

                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <svg
          className="absolute bottom-[-1px] left-0 w-full text-[#0b0f1a]"
          viewBox="0 0 1440 120"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
        </svg>
      </section>

      <section className="bg-[#0b0f1a] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            label="How it works"
            title="Everything needed to organize RTN competitions."
            description="The layout focuses on simple sections, clear actions, and fast scanning instead of heavy dashboard screens."
          />

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="border border-white/10 bg-white/5 p-8"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded bg-indigo-500 text-lg font-black text-white">
                  {index + 1}
                </div>

                <h3 className="text-2xl font-black text-white">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-gray-300">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black/20 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            label="Tournaments"
            title="Upcoming RTN tournaments."
            description="Tournaments are shown in a practical list. Registration and details open on a focused tournament page."
          />

          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-sm">
            <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_auto] border-b border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-gray-400 lg:grid">
              <span>Tournament</span>
              <span>Game</span>
              <span>Format</span>
              <span>Teams</span>
              <span>Status</span>
              <span></span>
            </div>

            {tournaments.map((tournament) => (
              <div
                key={tournament.title}
                className="grid gap-4 border-b border-white/10 px-5 py-5 last:border-b-0 lg:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_auto] lg:items-center"
              >
                <div>
                  <p className="font-black text-white">{tournament.title}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Tournament details and registration
                  </p>
                </div>

                <p className="text-gray-300">{tournament.game}</p>
                <p className="font-bold text-white">{tournament.format}</p>
                <p className="font-bold text-white">{tournament.teams}</p>

                <StatusBadge status={tournament.status} />

                <button className="rounded bg-indigo-500 px-4 py-2 text-sm font-black text-white transition hover:bg-indigo-400">
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b0f1a] px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
              Player experience
            </p>

            <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              A clean profile without unnecessary clutter.
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-300">
              Players should see their Discord status, invitations, teams, and
              tournament access clearly. Detailed team management should open in
              focused pages.
            </p>

            <div className="mt-8 flex gap-3">
              <PrimaryButton>Create team</PrimaryButton>
              <button className="rounded border border-white/10 px-6 py-3 font-black text-gray-300 transition hover:bg-white/10 hover:text-white">
                View profile
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 shadow-sm">
            <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
                Profile
              </p>

              <h3 className="mt-2 text-2xl font-black text-white">Mohamad</h3>
            </div>

            <div className="divide-y divide-white/10">
              <div className="flex items-center justify-between px-6 py-5">
                <span className="font-bold text-white">Discord status</span>
                <StatusBadge status="Approved" />
              </div>

              <div className="flex items-center justify-between px-6 py-5">
                <span className="font-bold text-white">Team invitations</span>
                <span className="rounded bg-indigo-500 px-2.5 py-1 text-xs font-bold text-white">
                  1 Pending
                </span>
              </div>

              <div className="flex items-center justify-between px-6 py-5">
                <span className="font-bold text-white">Owned teams</span>
                <span className="font-black text-white">2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/20 px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-black">RTN</p>
            <p className="mt-1 text-sm text-gray-400">
              The Noobs of Temple & Rift
            </p>
          </div>

          <p className="text-sm text-gray-400">
            RTN colors · platform layout preview
          </p>
        </div>
      </footer>
    </main>
  );
}
