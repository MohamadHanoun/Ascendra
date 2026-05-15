export type Announcement = {
  id: number;
  title: string;
  category: string;
  date: string;
  description: string;
  important: boolean;
};

export const announcements: Announcement[] = [
  {
    id: 1,
    title: "RTN Website Foundation",
    category: "Update",
    date: "Coming soon",
    description:
      "The RTN website is being prepared with pages for rules, roles, staff, tournaments, announcements, stats, leaderboard, and future Discord integration.",
    important: true,
  },
  {
    id: 3,
    title: "XP System Preparation",
    category: "Bot",
    date: "Future update",
    description:
      "A custom RTN Discord bot will later track activity, XP, levels, and leaderboards for active community members.",
    important: false,
  },
];