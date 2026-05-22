export type TournamentStatus = "open" | "upcoming" | "closed";

export type Tournament = {
  id: number | string;
  title: string;
  game: string;
  date: string;
  prize: string;
  teams: string;
  status: TournamentStatus;
  description: string;
};

export const tournaments: Tournament[] = [
  {
    id: 1,
    title: "Ascendra Community Cup",
    game: "Multi-Game",
    date: "Coming soon",
    prize: "To be announced",
    teams: "Open slots",
    status: "open",
    description:
      "A future Ascendra tournament designed for players from different electronic games. Registration will later require Discord login.",
  },
  {
    id: 2,
    title: "Ascendra Ranked Night",
    game: "Competitive Games",
    date: "Coming soon",
    prize: "Community rewards",
    teams: "Limited slots",
    status: "upcoming",
    description:
      "A planned event for competitive players who want to join organized matches and community challenges.",
  },
  {
    id: 3,
    title: "Ascendra Casual Event",
    game: "Community Games",
    date: "Coming soon",
    prize: "Fun rewards",
    teams: "Open for members",
    status: "upcoming",
    description:
      "A casual event for members who want to play, meet others, and enjoy the community without pressure.",
  },
  {
    id: 4,
    title: "Ascendra Test Bracket",
    game: "Tournament System",
    date: "Future update",
    prize: "Testing phase",
    teams: "Not available",
    status: "closed",
    description:
      "A placeholder tournament used to prepare the future registration, brackets, results, and admin tools.",
  },
];