import type { Metadata } from "next";

import LegalPolicyPage, {
  type LegalSection,
} from "@/components/LegalPolicyPage";

export const metadata: Metadata = {
  title: "Terms of Service | AscendraHub",
  description:
    "Terms of Service for AscendraHub, Ascendra tournaments, teams, rankings, and Discord-related community features.",
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these Terms",
    intro:
      "These Terms of Service govern your access to and use of AscendraHub, also referred to as Ascendra in some parts of the platform.",
    paragraphs: [
      "By accessing the website, signing in with Discord, creating a team, joining a team, registering for a tournament, using leaderboard features, interacting with Discord-related platform features, or otherwise using AscendraHub, you agree to these Terms.",
      "If you do not agree to these Terms, you must not use account-based features, create teams, register for tournaments, or participate in AscendraHub-managed events.",
      "AscendraHub may update these Terms as the platform grows. If important changes are made, reasonable steps will be taken to make the updated terms visible through the website, Discord, or another official channel.",
    ],
  },
  {
    id: "operator",
    title: "Operator and legal contact",
    intro:
      "AscendraHub / Ascendra is currently operated by Omar Hanoun as an individual project based in Växjö, Sweden.",
    bullets: [
      "Platform name: AscendraHub / Ascendra.",
      "Current operator: Omar Hanoun.",
      "Location: Växjö, Sweden.",
      "Legal and support contact: support@ascendrahub.com.",
      "AscendraHub may later be operated through a Swedish registered business. If that happens, these Terms will be updated with the correct legal entity information.",
    ],
  },
  {
    id: "service",
    title: "What AscendraHub provides",
    intro:
      "AscendraHub is a competitive gaming platform for community tournaments, teams, registrations, rankings, results, and official updates.",
    bullets: [
      "Public website pages, including news, rules, roles, staff, statistics, tournaments, and leaderboards.",
      "Discord login for account-based features.",
      "Team creation and team membership features.",
      "Player invitations and team management.",
      "Tournament registration, approval, rejection, cancellation, and result management.",
      "Leaderboard and tournament points based on official results.",
      "Discord-related features such as role or channel support when connected to tournament flows.",
    ],
    note: "AscendraHub is an independent project. It is not owned, operated, sponsored, endorsed, or officially connected to Discord, Riot Games, Valve, Counter-Strike, Dota, League of Legends, Valorant, or any other game publisher unless explicitly stated in writing.",
  },
  {
    id: "eligibility",
    title: "Eligibility and age requirements",
    intro:
      "AscendraHub relies on Discord login for participation features. Users must meet the age requirements for Discord and their own country.",
    bullets: [
      "You must be at least 13 years old.",
      "You must also meet the minimum age required to use Discord in your country.",
      "If you do not meet the required age, you may not use account-based features, create teams, register for tournaments, or participate in AscendraHub tournament activities.",
      "AscendraHub may restrict, suspend, or remove accounts if there is reason to believe the user is not eligible to use the service.",
      "You are responsible for ensuring that your use of AscendraHub is legal where you live.",
    ],
  },
  {
    id: "discord",
    title: "Discord account and community requirement",
    intro:
      "You can browse many parts of AscendraHub without logging in, but participation features require Discord login.",
    bullets: [
      "Discord login is required to create a profile, create or join teams, invite players, accept or reject team invitations, register for tournaments, and access profile-based features.",
      "Joining the official Discord server may be required to participate in tournaments, receive announcements, verify community membership, or access tournament-related Discord roles or channels.",
      "You are responsible for the security of your Discord account.",
      "If your Discord account is removed, banned, compromised, or no longer available, AscendraHub may not be able to restore your platform access.",
      "AscendraHub does not control Discord and is not responsible for Discord outages, account restrictions, policy decisions, or technical issues.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts and profile information",
    intro:
      "Your AscendraHub profile is connected to your Discord identity and is used to manage participation features.",
    bullets: [
      "You must not impersonate another person, player, team, moderator, administrator, organization, or game publisher.",
      "You must not create fake accounts, abuse multiple accounts, or use account switching to manipulate tournaments, teams, rankings, or rewards.",
      "You are responsible for any activity made through your account, team leadership, invitations, registrations, or profile.",
      "AscendraHub may update account-related information from Discord when you log in, such as username, avatar, and Discord membership status.",
      "AscendraHub may suspend or restrict accounts that violate these Terms, tournament rules, Discord community rules, or applicable law.",
    ],
  },
  {
    id: "teams",
    title: "Teams, invitations, and membership",
    intro:
      "Teams are used to organize players for tournaments and platform rankings.",
    bullets: [
      "You must choose team names that are respectful, lawful, and not misleading.",
      "Team names must not contain hate speech, harassment, threats, illegal content, sexual exploitation, extremist content, impersonation, or offensive material.",
      "Team leaders are responsible for inviting the correct players and ensuring team members are eligible to participate.",
      "Players must not be added to teams through deception, abuse, or manipulation.",
      "Administrators may approve, reject, rename, remove, or restrict teams if necessary to protect the platform, users, tournament integrity, or community rules.",
      "Team membership, team invitations, and team status may be used for tournament registration and leaderboard history.",
    ],
  },
  {
    id: "tournaments",
    title: "Tournament participation",
    intro:
      "Tournament pages or official Discord announcements may include additional rules for each event.",
    bullets: [
      "A team is not guaranteed participation until the registration is approved by an administrator or confirmed through the official tournament flow.",
      "Players and teams must follow tournament schedules, match rules, platform rules, Discord rules, and any game-specific rules announced for the tournament.",
      "Teams are responsible for accurate member information and timely attendance.",
      "AscendraHub may reject, cancel, or remove registrations if a team is incomplete, ineligible, abusive, suspicious, or violates rules.",
      "AscendraHub may modify schedules, formats, registration rules, maximum slots, team sizes, maps, match procedures, and tournament settings when needed.",
      "AscendraHub may cancel, pause, postpone, or end tournaments due to technical problems, safety concerns, low participation, cheating concerns, administrator decisions, or circumstances outside AscendraHub's control.",
    ],
  },
  {
    id: "no-gambling",
    title: "No gambling, betting, or wagering",
    intro:
      "AscendraHub is not a gambling, betting, wagering, casino, lottery, or games-of-chance platform.",
    paragraphs: [
      "Users must not use AscendraHub, its tournaments, Discord server, teams, rankings, results, or community features for gambling, betting, wagering, odds, prediction markets, casino-style activity, lotteries, raffles, paid chance-based games, or any similar activity.",
      "AscendraHub does not offer betting, does not accept wagers, does not run gambling services, and does not allow users to organize betting or gambling through the platform.",
      "Any attempt to use AscendraHub or the official Discord community for gambling, betting, match fixing, result manipulation, or prize abuse may lead to removal, suspension, disqualification, and reporting where appropriate.",
    ],
    note: "Tournament prizes, if offered, are intended as skill-based community rewards for competitive gaming participation and are not betting or gambling products.",
  },
  {
    id: "prizes",
    title: "Prizes and future rewards",
    intro:
      "AscendraHub is currently free to use. Future tournaments may include prizes or rewards.",
    bullets: [
      "Prizes may be offered in future tournaments.",
      "Prize details, eligibility, delivery method, timing, restrictions, and additional rules will be stated on the tournament page or in an official Discord announcement.",
      "AscendraHub may require reasonable verification before delivering a prize.",
      "Users are responsible for complying with tax, reporting, age, regional, or local rules that may apply to receiving prizes.",
      "AscendraHub may withhold, cancel, or reassign a prize if a player or team violates rules, cheats, manipulates results, provides false information, is ineligible, or cannot be contacted within a reasonable time.",
      "Unless clearly stated otherwise, tournament points, roles, leaderboard positions, and community recognition have no cash value.",
    ],
  },
  {
    id: "rules-and-admins",
    title: "Administrators, moderation, and decisions",
    intro:
      "AscendraHub administrators manage platform safety, tournament quality, and competitive integrity.",
    bullets: [
      "Administrators may approve or reject teams and tournament registrations.",
      "Administrators may correct results, points, placements, rankings, or team data if a mistake, abuse, cheating concern, or technical issue is found.",
      "Administrators may remove content, restrict features, suspend accounts, disqualify teams, or remove players when necessary.",
      "Administrator decisions are final unless AscendraHub chooses to review them.",
      "Users may submit a reasonable appeal by contacting support@ascendrahub.com or the official Discord support channel, preferably within 48 hours of the relevant decision.",
      "Appeals do not guarantee reversal of a decision.",
    ],
  },
  {
    id: "conduct",
    title: "Prohibited conduct",
    intro:
      "You agree not to misuse AscendraHub, its Discord community, tournament systems, or other users.",
    bullets: [
      "No cheating, exploiting bugs, unauthorized software, match fixing, smurfing, boosting, or result manipulation.",
      "No harassment, bullying, threats, intimidation, hate speech, racism, sexism, homophobia, transphobia, religious hatred, extremist content, or targeted abuse.",
      "No spam, scams, phishing, malware, credential theft, social engineering, or attempts to bypass security.",
      "No impersonation of AscendraHub staff, administrators, players, sponsors, game publishers, or other users.",
      "No illegal content, sexual exploitation, child safety violations, violent threats, doxxing, or privacy violations.",
      "No offensive, misleading, or unlawful team names, player names, profile content, links, or Discord behavior.",
      "No attempts to overload, scrape, reverse engineer, disrupt, attack, or interfere with AscendraHub, its database, Discord integration, bot, hosting, or security systems.",
      "No gambling, betting, wagering, match betting, or organizing odds around tournaments.",
    ],
  },
  {
    id: "user-content",
    title: "User content and submitted information",
    intro:
      "Users may submit limited information through the platform, such as team names, registrations, and participation data.",
    bullets: [
      "You are responsible for the content and information you submit.",
      "You must have the right to submit any content you provide.",
      "You must not submit content that violates law, privacy rights, intellectual property rights, community rules, or these Terms.",
      "AscendraHub may remove, edit, restrict, or reject content that violates these Terms or creates risk for users, the platform, or the community.",
      "Announcements and official content are currently controlled by administrators.",
      "If uploads, comments, posts, or more advanced user-generated content are added later, additional rules may apply.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    intro:
      "AscendraHub owns or controls the platform design, branding, layout, text, code structure, and original visual identity created for AscendraHub.",
    paragraphs: [
      "You may not copy, reuse, sell, claim ownership of, or misrepresent AscendraHub branding, layout, platform content, tournament structure, or original assets without permission.",
      "Game names, publisher names, logos, character names, trademarks, and related intellectual property belong to their respective owners. Any game references are used only to identify tournament categories, supported games, or community interests.",
      "AscendraHub does not claim ownership of Discord, Riot Games, Valve, Counter-Strike, Dota, League of Legends, Valorant, or any third-party intellectual property.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    intro:
      "AscendraHub depends on third-party services for authentication, hosting, domain, database, deployment, Discord features, and game-related community activity.",
    bullets: [
      "Discord may be used for login, community membership, tournament communication, roles, or channels.",
      "Vercel may be used for hosting and deployment.",
      "Cloudflare may be used for domain, DNS, and related infrastructure.",
      "A managed PostgreSQL database provider may be used to store platform records.",
      "GitHub may be used for source code and deployment workflows.",
      "Game publishers and platforms control their own games, accounts, servers, rules, availability, and enforcement decisions.",
      "AscendraHub is not responsible for outages, data handling, account actions, service changes, or failures caused by third-party services.",
    ],
  },
  {
    id: "availability",
    title: "Availability and changes",
    intro: "AscendraHub is an evolving platform and may change over time.",
    bullets: [
      "Features may be added, changed, restricted, paused, or removed.",
      "The website, bot, database, Discord features, or tournament systems may be unavailable due to maintenance, errors, hosting issues, security work, third-party outages, or development changes.",
      "AscendraHub does not guarantee uninterrupted service, error-free operation, permanent availability, or permanent preservation of all content.",
      "AscendraHub may change the domain, branding, policies, service structure, or operating entity in the future.",
    ],
  },
  {
    id: "liability",
    title: "No warranties and limitation of liability",
    intro: "AscendraHub is provided on an as-is and as-available basis.",
    paragraphs: [
      "To the fullest extent permitted by applicable law, AscendraHub does not provide warranties that the service will always be secure, accurate, available, uninterrupted, compatible, or error-free.",
      "AscendraHub is not responsible for personal disputes between players, losses caused by third-party services, game server issues, Discord issues, device problems, internet outages, user mistakes, unauthorized access caused by compromised user accounts, or actions outside AscendraHub's reasonable control.",
      "Nothing in these Terms limits liability where it cannot be limited under applicable law.",
    ],
  },
  {
    id: "suspension",
    title: "Suspension and termination",
    intro:
      "AscendraHub may restrict access when necessary to protect users, the platform, tournaments, or the community.",
    bullets: [
      "AscendraHub may suspend, restrict, or remove accounts, teams, registrations, results, content, or Discord-related access if these Terms are violated.",
      "AscendraHub may take action if required by law, platform safety, Discord rules, tournament integrity, security concerns, or administrator decisions.",
      "Users may request account deletion by contacting support@ascendrahub.com.",
      "Some historical tournament records may be retained in limited, anonymized, or integrity-preserving form where necessary to protect results, rankings, dispute records, or legal obligations.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing law and disputes",
    intro:
      "These Terms are governed by Swedish law, while applicable EU data protection law, including the GDPR, applies where relevant.",
    paragraphs: [
      "Before starting any formal dispute, you agree to first contact AscendraHub at support@ascendrahub.com and give a reasonable opportunity to resolve the issue informally.",
      "If a dispute cannot be resolved informally, it will be handled under applicable Swedish law and competent Swedish authorities or courts, unless mandatory consumer or data protection law gives you additional rights in your country.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    intro:
      "For support, legal questions, tournament issues, account requests, or policy questions, contact AscendraHub.",
    bullets: [
      "Email: support@ascendrahub.com.",
      "Please include your Discord username, Discord ID if available, relevant team name, tournament name, and a clear explanation of your request.",
      "For privacy-related requests, see the Privacy Policy.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPolicyPage
      title="Terms of Service"
      description="The rules for using AscendraHub, participating in Ascendra tournaments, managing teams, using Discord-related features, and interacting with the community."
      lastUpdated="22 May 2026"
      effectiveDate="22 May 2026"
      sections={sections}
    />
  );
}
