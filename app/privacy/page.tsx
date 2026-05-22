import type { Metadata } from "next";

import LegalPolicyPage, {
  type LegalHighlight,
  type LegalSection,
} from "@/components/LegalPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | AscendraHub",
  description:
    "Privacy Policy for AscendraHub and Ascendra account, team, tournament, Discord login, and leaderboard data.",
};

const highlights: LegalHighlight[] = [
  { label: "Controller", value: "Omar Hanoun, Växjö, Sweden" },
  { label: "Platform", value: "AscendraHub / Ascendra" },
  { label: "Legal contact", value: "support@ascendrahub.com" },
  { label: "Core law", value: "GDPR and Swedish applicable law" },
];

const sections: LegalSection[] = [
  {
    id: "controller",
    title: "Who controls your personal data",
    intro:
      "AscendraHub / Ascendra is currently operated by Omar Hanoun, based in Växjö, Sweden.",
    bullets: [
      "Data controller: Omar Hanoun, operating AscendraHub / Ascendra.",
      "Location: Växjö, Sweden.",
      "Contact email: support@ascendrahub.com.",
      "If AscendraHub later becomes operated by a Swedish registered business, this Privacy Policy will be updated with the company name and registration details.",
    ],
  },
  {
    id: "scope",
    title: "Scope of this Privacy Policy",
    intro:
      "This Privacy Policy explains how AscendraHub handles personal data when you use the website, sign in with Discord, create or join teams, register for tournaments, appear in results, use leaderboard features, or interact with Discord-related platform features.",
    paragraphs: [
      "This policy does not control how Discord, Vercel, Cloudflare, GitHub, game publishers, or other third-party services process data under their own services. Those services have their own terms and privacy policies.",
      "AscendraHub does not control private Discord direct messages, game accounts, game servers, game publishers, or third-party account systems.",
    ],
  },
  {
    id: "data-we-collect",
    title: "Personal data we collect",
    intro:
      "AscendraHub collects only the data needed to operate login, teams, tournaments, moderation, rankings, and platform functionality.",
    bullets: [
      "Discord account data: Discord ID, Discord username, Discord avatar, and Discord server membership status where needed for tournament participation.",
      "Login and account data: internal user ID, account role, last login time, last Discord guild check time, account creation time, and account update time.",
      "Team data: team name, game, team leader, team members, team membership role, team status, submission status, approval or rejection information, and related timestamps.",
      "Team invitation data: invited user, inviting user, team, invitation status, creation time, and response time.",
      "Tournament registration data: tournament, team, registering user, registration status, approval/rejection/cancellation/review information, and timestamps.",
      "Tournament integrity snapshots: snapshot team name, snapshot game, and snapshot members when a registration or result needs historical integrity.",
      "Tournament result data: placement, points, result notes, awarded time, team result history, and leaderboard-related records.",
      "Discord tournament support data: Discord role names, role IDs, role sync status, channel names, channel IDs, and sync errors when the platform or bot uses these for tournament operations.",
      "Admin-managed public content: announcements, rules, roles, staff entries, server settings, and public website content managed by administrators.",
      "Bot and realtime event data: technical event records used to process Discord role/channel actions, updates, notifications, and platform activity.",
      "Technical data: hosting, security, server, database, deployment, DNS, and infrastructure providers may process technical logs such as IP address, request time, browser/device data, error logs, and security events.",
    ],
  },
  {
    id: "data-not-collected",
    title: "Data we do not intentionally collect",
    intro:
      "AscendraHub is designed for tournament and community management, not private message monitoring.",
    bullets: [
      "AscendraHub does not read or store your Discord private direct messages.",
      "AscendraHub does not intentionally collect payment card data because payments are not currently processed on the platform.",
      "AscendraHub does not operate betting, gambling, wagering, or casino features.",
      "AscendraHub does not intentionally sell personal data.",
      "AscendraHub does not currently use advertising cookies or marketing tracking cookies.",
      "AscendraHub does not require you to provide legal identity documents unless future prize, fraud prevention, or legal compliance requirements make verification necessary.",
    ],
  },
  {
    id: "sources",
    title: "Where data comes from",
    intro:
      "Most personal data is provided directly by you, by Discord login, or by platform activity.",
    bullets: [
      "You provide data when you sign in, create teams, invite players, register for tournaments, or interact with the platform.",
      "Discord provides limited account data through OAuth login, such as your Discord ID, username, avatar, and guild membership information depending on the permissions used.",
      "Administrators may create or update tournament records, registrations, results, announcements, rules, roles, and moderation decisions.",
      "Technical service providers may generate logs and security data when your browser connects to the website.",
    ],
  },
  {
    id: "purposes",
    title: "Why we use personal data",
    intro:
      "AscendraHub uses personal data only for legitimate platform, tournament, community, security, and legal purposes.",
    bullets: [
      "To let users sign in with Discord.",
      "To create and manage user profiles.",
      "To verify whether a user is connected to the official Discord community when tournament participation requires it.",
      "To create teams, manage members, send and respond to team invitations, and track team leaders.",
      "To register teams for tournaments and allow administrators to approve, reject, review, or cancel registrations.",
      "To manage tournament slots, team sizes, results, placements, points, and leaderboards.",
      "To preserve historical tournament integrity through snapshots of team names, games, and members.",
      "To support Discord-related tournament roles, channels, and server coordination.",
      "To prevent cheating, abuse, smurfing, spam, fraud, harassment, rule violations, and security threats.",
      "To respond to support, privacy, legal, and moderation requests.",
      "To maintain, debug, secure, and improve the website, database, bot, and platform infrastructure.",
      "To comply with legal obligations and enforce platform Terms of Service.",
    ],
  },
  {
    id: "legal-basis",
    title: "Legal basis under GDPR",
    intro:
      "Where GDPR applies, AscendraHub relies on different legal bases depending on the purpose of processing.",
    bullets: [
      "Contract or steps before a contract: to provide account features, login, teams, registrations, tournament participation, and platform functionality requested by the user.",
      "Legitimate interests: to secure the platform, prevent abuse, protect tournament integrity, manage rankings, moderate the community, maintain technical logs, and improve service reliability.",
      "Consent: where optional features, future analytics, marketing, optional communications, or non-essential cookies require consent.",
      "Legal obligation: where AscendraHub must process or retain data to comply with applicable law, respond to lawful requests, handle disputes, or protect legal rights.",
      "Vital or public interests are not normally used as a legal basis for ordinary AscendraHub operations.",
    ],
    note: "If AscendraHub later adds payments, subscriptions, paid tournaments, or more advanced analytics, this policy should be updated before those features go live.",
  },
  {
    id: "public-data",
    title: "Public and community-visible data",
    intro:
      "Some data may be visible to other users because the platform is built around teams, tournaments, rankings, and public competition.",
    bullets: [
      "Team names, games, members, leaders, tournament registrations, approvals, results, points, placements, and leaderboard positions may be visible on the website or in Discord.",
      "Tournament results may remain visible after a tournament ends to preserve competition history and ranking integrity.",
      "Announcements, rules, staff entries, roles, tournament information, and leaderboard data may be public.",
      "If a user requests deletion, AscendraHub may anonymize or limit some historical references where complete deletion would damage tournament integrity, dispute handling, or legitimate records.",
    ],
  },
  {
    id: "sharing",
    title: "Who may receive data",
    intro:
      "AscendraHub does not sell personal data. Data may be processed by service providers needed to run the platform.",
    bullets: [
      "Vercel may process hosting, deployment, request, and technical logs.",
      "Cloudflare may process DNS, domain, security, and traffic-related technical data depending on configuration.",
      "Discord processes login and community-related data under its own services and policies.",
      "A managed PostgreSQL database provider is used to store platform records.",
      "GitHub may process source code and deployment-related technical information.",
      "Administrators may access the data necessary to run tournaments, moderate the platform, support users, and maintain community safety.",
      "Data may be disclosed if required by law, legal process, security investigation, enforcement of Terms, or protection of rights and safety.",
    ],
  },
  {
    id: "international-transfers",
    title: "International data transfers",
    intro:
      "AscendraHub is operated from Sweden, but some service providers may process data in other countries.",
    paragraphs: [
      "Some infrastructure, hosting, authentication, domain, database, or development providers may process personal data outside Sweden or the European Economic Area.",
      "Where required, AscendraHub expects service providers to use appropriate safeguards such as contractual protections, standard contractual clauses, data processing agreements, or other lawful transfer mechanisms.",
      "Because AscendraHub uses third-party services, users should also review the privacy terms of those services, especially Discord, Vercel, Cloudflare, and any database provider used by the platform.",
    ],
  },
  {
    id: "retention",
    title: "How long data is kept",
    intro:
      "AscendraHub keeps personal data only as long as needed for platform functionality, tournament integrity, security, legal purposes, or legitimate community records.",
    bullets: [
      "Account data is generally kept while the account remains active or while needed to provide account-based features.",
      "Team and invitation data is kept while needed for team management, history, moderation, or dispute handling.",
      "Tournament registrations and results may be kept to preserve tournament history, rankings, points, prize records, and competition integrity.",
      "Technical logs are kept according to the retention practices of AscendraHub and its service providers.",
      "Bot and realtime events may be kept for technical processing, debugging, audit, sync reliability, and abuse prevention.",
      "If you request deletion, AscendraHub will review the request and delete, anonymize, or restrict data where required by applicable law.",
    ],
  },
  {
    id: "deletion",
    title: "Account deletion and data requests",
    intro:
      "Users may request account deletion or privacy help by contacting support@ascendrahub.com.",
    bullets: [
      "To request deletion, contact support@ascendrahub.com from a reasonable account or include enough information to identify your AscendraHub profile.",
      "Include your Discord username and Discord ID if available.",
      "AscendraHub may need to verify the request before deleting or changing data.",
      "Some data may be retained if necessary for tournament integrity, dispute handling, security, legal obligations, or legitimate records.",
      "Where possible, historical tournament records may be anonymized or limited instead of being fully removed.",
    ],
  },
  {
    id: "rights",
    title: "Your GDPR rights",
    intro:
      "If GDPR applies to you, you may have the following rights regarding your personal data.",
    bullets: [
      "Right of access: you can ask what personal data AscendraHub holds about you.",
      "Right to rectification: you can ask to correct inaccurate data.",
      "Right to erasure: you can ask for deletion when the legal conditions are met.",
      "Right to restriction: you can ask AscendraHub to limit certain processing.",
      "Right to data portability: you can ask for certain data in a structured format where applicable.",
      "Right to object: you can object to processing based on legitimate interests.",
      "Right to withdraw consent: where processing is based on consent, you can withdraw it.",
      "Right to lodge a complaint: you may contact the Swedish Authority for Privacy Protection, Integritetsskyddsmyndigheten, or another competent data protection authority.",
    ],
    note: "To exercise these rights, contact support@ascendrahub.com. AscendraHub may request information needed to verify your identity and locate your account.",
  },
  {
    id: "security",
    title: "Security",
    intro:
      "AscendraHub uses reasonable technical and organizational measures to protect platform data.",
    bullets: [
      "Access to administrative features is limited to authorized administrators.",
      "Authentication is handled through Discord login and session-based platform security.",
      "Database records are protected through the hosting and database provider configuration.",
      "AscendraHub attempts to limit stored data to what is needed for platform and tournament functionality.",
      "No online service can guarantee perfect security. Users should secure their Discord account and report suspicious activity.",
    ],
  },
  {
    id: "children",
    title: "Children and age restrictions",
    intro:
      "AscendraHub is not intended for users under 13 years old or users who do not meet the minimum age required to use Discord in their country.",
    bullets: [
      "Users below the required age must not use login, team, tournament, or community participation features.",
      "AscendraHub may restrict or delete accounts if it learns that a user is under the required age.",
      "Parents or legal guardians may contact support@ascendrahub.com for privacy-related concerns.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and similar technologies",
    intro:
      "AscendraHub may use cookies or similar browser storage for necessary functions such as authentication, sessions, security, and basic preferences.",
    paragraphs: [
      "AscendraHub does not currently intend to use advertising cookies or gambling-related tracking. If analytics, advertising, marketing, or optional cookies are added later, this Privacy Policy and the Cookie Policy should be updated and a consent mechanism should be added where required.",
    ],
  },
  {
    id: "updates",
    title: "Updates to this Privacy Policy",
    intro:
      "AscendraHub may update this Privacy Policy when the platform changes.",
    bullets: [
      "Updates may be needed if AscendraHub adds payments, subscriptions, prize verification, analytics, email notifications, uploads, comments, advanced Discord features, or a registered company structure.",
      "The latest version will be available on this page.",
      "Important changes may also be announced on the website or official Discord server.",
    ],
  },
  {
    id: "contact",
    title: "Privacy contact",
    intro:
      "For privacy questions, account deletion requests, data access requests, or GDPR-related requests, contact AscendraHub.",
    bullets: [
      "Email: support@ascendrahub.com.",
      "Include your Discord username, Discord ID if available, and a clear explanation of your request.",
      "Do not send passwords, payment card details, or unnecessary sensitive information.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPolicyPage
      title="Privacy Policy"
      description="How AscendraHub handles Discord login data, profiles, teams, tournament registrations, results, rankings, technical logs, and privacy rights."
      summaryTitle="Your data is used to run the platform and protect tournament integrity."
      summaryBody="AscendraHub uses personal data for Discord login, teams, tournament participation, moderation, results, rankings, security, and support. The platform does not sell personal data and does not intentionally read Discord private messages."
      lastUpdated="22 May 2026"
      highlights={highlights}
      sections={sections}
    />
  );
}
