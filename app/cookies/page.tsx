import type { Metadata } from "next";

import LegalPolicyPage, {
  type LegalHighlight,
  type LegalSection,
} from "@/components/LegalPolicyPage";

export const metadata: Metadata = {
  title: "Cookie Policy | AscendraHub",
  description:
    "Cookie Policy for AscendraHub authentication, sessions, security, and similar browser storage.",
};

const highlights: LegalHighlight[] = [
  { label: "Current use", value: "Necessary cookies only" },
  { label: "Advertising", value: "No advertising cookies currently" },
  { label: "Betting tracking", value: "Never used" },
  { label: "Contact", value: "support@ascendrahub.com" },
];

const sections: LegalSection[] = [
  {
    id: "what-cookies-are",
    title: "What cookies are",
    intro:
      "Cookies are small text files stored in your browser by websites you visit.",
    paragraphs: [
      "Cookies and similar technologies can help websites remember sessions, keep users logged in, protect forms from abuse, store basic preferences, and maintain security.",
      "Similar technologies may include local storage, session storage, authentication tokens, server-side sessions, and security identifiers.",
    ],
  },
  {
    id: "how-we-use-cookies",
    title: "How AscendraHub uses cookies",
    intro:
      "AscendraHub currently uses cookies and similar technologies only for necessary platform functions.",
    bullets: [
      "Authentication and login sessions.",
      "Discord OAuth sign-in flow.",
      "Session security and anti-abuse protection.",
      "Basic platform functionality.",
      "Keeping account-based features working while you use the website.",
      "Technical debugging and reliability when required by hosting or authentication systems.",
    ],
  },
  {
    id: "necessary-cookies",
    title: "Necessary cookies",
    intro:
      "Necessary cookies are required for core website functions and do not require the same type of optional consent as analytics or advertising cookies.",
    bullets: [
      "Session cookies: used to keep you signed in.",
      "Authentication cookies: used to connect your Discord login with your AscendraHub session.",
      "Security cookies or tokens: used to protect login, forms, and account actions.",
      "Preference storage: may be used for essential display or functionality preferences.",
    ],
    note: "If you block necessary cookies, login, profile pages, team creation, invitations, registrations, and admin features may not work correctly.",
  },
  {
    id: "discord-login",
    title: "Discord login cookies",
    intro: "AscendraHub uses Discord login for account-based features.",
    paragraphs: [
      "When you choose to sign in with Discord, your browser may be redirected to Discord and back to AscendraHub. During this process, cookies or similar authentication data may be used to complete the login securely.",
      "Discord may set its own cookies or process data when you use Discord services. Discord's own cookie and privacy practices are controlled by Discord, not AscendraHub.",
    ],
  },
  {
    id: "analytics",
    title: "Analytics and measurement",
    intro:
      "AscendraHub does not currently intentionally use Google Analytics, advertising pixels, or marketing tracking cookies.",
    bullets: [
      "No advertising cookies are intentionally used at this stage.",
      "No betting, gambling, or wagering tracking is used and will not be used.",
      "Infrastructure providers may process limited technical logs for security, performance, error handling, and delivery of the website.",
      "If AscendraHub later adds analytics, measurement, or optional tracking, this Cookie Policy will be updated before or at the time those tools are introduced.",
      "If consent is required for future analytics or optional cookies, AscendraHub should add a cookie consent banner or equivalent control.",
    ],
  },
  {
    id: "advertising",
    title: "No advertising, betting, or gambling cookies",
    intro:
      "AscendraHub does not use cookies for gambling, betting, wagering, casino activity, or odds-related tracking.",
    paragraphs: [
      "AscendraHub is not a gambling or betting platform. Cookies must not be used to support gambling, betting, wagering, match betting, casino-style activity, or related tracking.",
      "AscendraHub does not currently use advertising cookies, targeted ad cookies, retargeting pixels, or marketing profiling cookies.",
    ],
  },
  {
    id: "third-party-cookies",
    title: "Third-party cookies and services",
    intro:
      "Some third-party services may set or use cookies when you interact with their services.",
    bullets: [
      "Discord may use cookies when you sign in or interact with Discord services.",
      "Vercel may process technical data related to hosting and delivery of the website.",
      "Cloudflare may process DNS, security, and traffic-related technical data depending on configuration.",
      "Your browser, extensions, or device may also store data independently of AscendraHub.",
      "AscendraHub does not control third-party cookies outside the AscendraHub website.",
    ],
  },
  {
    id: "cookie-duration",
    title: "How long cookies last",
    intro: "Cookie duration depends on the type of cookie or storage used.",
    bullets: [
      "Session cookies may expire when you close your browser or after a limited session period.",
      "Authentication cookies may last longer to keep you signed in.",
      "Security cookies or tokens may expire automatically after a configured period.",
      "Third-party cookies are controlled by the third party that sets them.",
      "If AscendraHub later adds a cookie preference tool, it may store your cookie choices for a limited period.",
    ],
  },
  {
    id: "manage-cookies",
    title: "How to manage cookies",
    intro: "You can manage cookies through your browser settings.",
    bullets: [
      "You can delete cookies already stored in your browser.",
      "You can block cookies for all websites or for selected websites.",
      "You can use private browsing or browser privacy controls.",
      "You can disable third-party cookies in many browsers.",
      "Blocking required cookies may stop login, profile, team, tournament, and admin features from working correctly.",
    ],
  },
  {
    id: "future-changes",
    title: "Future changes",
    intro:
      "AscendraHub may add new features that change how cookies or similar technologies are used.",
    bullets: [
      "Future features may include analytics, email notifications, language preferences, payment-related features, subscriptions, prize verification, uploads, or user settings.",
      "If non-essential cookies are added, AscendraHub should update this policy and provide consent options where required.",
      "The latest version of this Cookie Policy will be available on this page.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    intro: "For cookie, privacy, or account questions, contact AscendraHub.",
    bullets: [
      "Email: support@ascendrahub.com.",
      "Please describe your question clearly and include your Discord username or account information only if needed.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalPolicyPage
      title="Cookie Policy"
      description="How AscendraHub uses cookies and similar technologies for login, authentication, security, sessions, and core website functionality."
      summaryTitle="AscendraHub currently uses cookies only for essential platform functionality."
      summaryBody="Cookies and similar technologies help account login, Discord authentication, session security, and core platform features work correctly. AscendraHub does not currently use advertising cookies and does not use gambling, betting, or wagering cookies."
      lastUpdated="22 May 2026"
      highlights={highlights}
      sections={sections}
    />
  );
}
