import type { Metadata } from "next";

import LegalPolicyPage, {
  type LegalSection,
} from "@/components/LegalPolicyPage";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

type TermsMessages = {
  metadata: {
    title: string;
    description: string;
  };
  page: {
    title: string;
    description: string;
    lastUpdated: string;
    effectiveDate: string;
  };
  sections: LegalSection[];
};

const termsMessages: Record<Locale, TermsMessages> = {
  en: {
    metadata: {
      title: "Terms of Service | AscendraHub",
      description:
        "Terms of Service for AscendraHub, Ascendra tournaments, teams, rankings, and Discord-related community features.",
    },
    page: {
      title: "Terms of Service",
      description:
        "The rules for using AscendraHub, participating in Ascendra tournaments, managing teams, using Discord-related features, and interacting with the community.",
      lastUpdated: "22 May 2026",
      effectiveDate: "22 May 2026",
    },
    sections: [
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
    ],
  },

  ar: {
    metadata: {
      title: "شروط الاستخدام | AscendraHub",
      description:
        "شروط استخدام AscendraHub وبطولات Ascendra والفرق ولوحة المتصدرين وميزات المجتمع المرتبطة بـ Discord.",
    },
    page: {
      title: "شروط الاستخدام",
      description:
        "القواعد الخاصة باستخدام AscendraHub، والمشاركة في بطولات Ascendra، وإدارة الفرق، واستخدام الميزات المرتبطة بـ Discord، والتفاعل مع المجتمع.",
      lastUpdated: "22 مايو 2026",
      effectiveDate: "22 مايو 2026",
    },
    sections: [
      {
        id: "acceptance",
        title: "قبول هذه الشروط",
        intro:
          "تنظم شروط الاستخدام هذه وصولك إلى AscendraHub واستخدامك له، والذي قد يُشار إليه باسم Ascendra في بعض أجزاء المنصة.",
        paragraphs: [
          "عند الوصول إلى الموقع، أو تسجيل الدخول عبر Discord، أو إنشاء فريق، أو الانضمام إلى فريق، أو التسجيل في بطولة، أو استخدام ميزات لوحة المتصدرين، أو التفاعل مع ميزات المنصة المرتبطة بـ Discord، أو استخدام AscendraHub بأي شكل آخر، فإنك توافق على هذه الشروط.",
          "إذا كنت لا توافق على هذه الشروط، يجب ألا تستخدم الميزات المعتمدة على الحساب، أو تنشئ فرقًا، أو تسجل في البطولات، أو تشارك في الفعاليات التي تديرها AscendraHub.",
          "قد تقوم AscendraHub بتحديث هذه الشروط مع تطور المنصة. إذا تم إجراء تغييرات مهمة، فسيتم اتخاذ خطوات معقولة لإظهار الشروط المحدّثة عبر الموقع أو Discord أو قناة رسمية أخرى.",
        ],
      },
      {
        id: "operator",
        title: "المشغّل وجهة التواصل القانونية",
        intro:
          "تُدار AscendraHub / Ascendra حاليًا بواسطة Omar Hanoun كمشروع فردي مقره في Växjö، السويد.",
        bullets: [
          "اسم المنصة: AscendraHub / Ascendra.",
          "المشغّل الحالي: Omar Hanoun.",
          "الموقع: Växjö، السويد.",
          "البريد القانوني وبريد الدعم: support@ascendrahub.com.",
          "قد يتم تشغيل AscendraHub لاحقًا من خلال شركة سويدية مسجلة. إذا حدث ذلك، فسيتم تحديث هذه الشروط بمعلومات الجهة القانونية الصحيحة.",
        ],
      },
      {
        id: "service",
        title: "ما الذي تقدمه AscendraHub",
        intro:
          "AscendraHub هي منصة ألعاب تنافسية لبطولات المجتمع والفرق والتسجيلات ولوحة المتصدرين والنتائج والتحديثات الرسمية.",
        bullets: [
          "صفحات عامة في الموقع، بما في ذلك الأخبار، القواعد، الأدوار، الفريق، الإحصائيات، البطولات، ولوحة المتصدرين.",
          "تسجيل الدخول عبر Discord للميزات المعتمدة على الحساب.",
          "ميزات إنشاء الفرق وإدارة عضوية الفريق.",
          "دعوات اللاعبين وإدارة الفرق.",
          "تسجيل البطولات، والموافقة، والرفض، والإلغاء، وإدارة النتائج.",
          "لوحة المتصدرين ونقاط البطولات بناءً على النتائج الرسمية.",
          "ميزات مرتبطة بـ Discord مثل دعم الأدوار أو القنوات عند ربطها بتدفقات البطولات.",
        ],
        note: "AscendraHub مشروع مستقل. لا تملكه أو تديره أو ترعاه أو تؤيده Discord أو Riot Games أو Valve أو Counter-Strike أو Dota أو League of Legends أو Valorant أو أي ناشر ألعاب آخر، ولا توجد صلة رسمية بهم ما لم يتم توضيح ذلك كتابيًا بشكل صريح.",
      },
      {
        id: "eligibility",
        title: "الأهلية ومتطلبات العمر",
        intro:
          "تعتمد AscendraHub على تسجيل الدخول عبر Discord لميزات المشاركة. يجب على المستخدمين الالتزام بمتطلبات العمر الخاصة بـ Discord وبلدهم.",
        bullets: [
          "يجب أن يكون عمرك 13 عامًا على الأقل.",
          "يجب أيضًا أن تستوفي الحد الأدنى للعمر المطلوب لاستخدام Discord في بلدك.",
          "إذا لم تستوفِ العمر المطلوب، فلا يجوز لك استخدام الميزات المعتمدة على الحساب، أو إنشاء فرق، أو التسجيل في البطولات، أو المشاركة في أنشطة بطولات AscendraHub.",
          "قد تقوم AscendraHub بتقييد الحسابات أو تعليقها أو إزالتها إذا كان هناك سبب للاعتقاد بأن المستخدم غير مؤهل لاستخدام الخدمة.",
          "أنت مسؤول عن التأكد من أن استخدامك لـ AscendraHub قانوني في المكان الذي تعيش فيه.",
        ],
      },
      {
        id: "discord",
        title: "حساب Discord ومتطلبات المجتمع",
        intro:
          "يمكنك تصفح أجزاء كثيرة من AscendraHub دون تسجيل الدخول، لكن ميزات المشاركة تتطلب تسجيل الدخول عبر Discord.",
        bullets: [
          "تسجيل الدخول عبر Discord مطلوب لإنشاء ملف شخصي، أو إنشاء الفرق أو الانضمام إليها، أو دعوة اللاعبين، أو قبول دعوات الفرق أو رفضها، أو التسجيل في البطولات، أو الوصول إلى الميزات المرتبطة بالملف الشخصي.",
          "قد يكون الانضمام إلى خادم Discord الرسمي مطلوبًا للمشاركة في البطولات، أو تلقي الإعلانات، أو التحقق من عضوية المجتمع، أو الوصول إلى أدوار أو قنوات Discord المرتبطة بالبطولات.",
          "أنت مسؤول عن أمان حساب Discord الخاص بك.",
          "إذا تمت إزالة حساب Discord الخاص بك أو حظره أو اختراقه أو أصبح غير متاح، فقد لا تتمكن AscendraHub من استعادة وصولك إلى المنصة.",
          "لا تتحكم AscendraHub في Discord، وليست مسؤولة عن انقطاعات Discord أو قيود الحسابات أو قرارات السياسة أو المشكلات التقنية.",
        ],
      },
      {
        id: "accounts",
        title: "الحسابات ومعلومات الملف الشخصي",
        intro:
          "يرتبط ملفك الشخصي في AscendraHub بهويتك في Discord ويُستخدم لإدارة ميزات المشاركة.",
        bullets: [
          "يجب ألا تنتحل شخصية شخص آخر أو لاعب أو فريق أو مشرف أو مدير أو منظمة أو ناشر ألعاب.",
          "يجب ألا تنشئ حسابات مزيفة أو تسيء استخدام عدة حسابات أو تستخدم تبديل الحسابات للتلاعب بالبطولات أو الفرق أو الترتيب أو المكافآت.",
          "أنت مسؤول عن أي نشاط يتم من خلال حسابك أو قيادة فريقك أو دعواتك أو تسجيلاتك أو ملفك الشخصي.",
          "قد تقوم AscendraHub بتحديث المعلومات المرتبطة بالحساب من Discord عند تسجيل الدخول، مثل اسم المستخدم والصورة وحالة عضوية Discord.",
          "قد تقوم AscendraHub بتعليق أو تقييد الحسابات التي تخالف هذه الشروط أو قواعد البطولات أو قواعد مجتمع Discord أو القانون المعمول به.",
        ],
      },
      {
        id: "teams",
        title: "الفرق والدعوات والعضوية",
        intro: "تُستخدم الفرق لتنظيم اللاعبين في البطولات ولوحة المتصدرين.",
        bullets: [
          "يجب اختيار أسماء فرق محترمة وقانونية وغير مضللة.",
          "يجب ألا تحتوي أسماء الفرق على خطاب كراهية أو مضايقة أو تهديدات أو محتوى غير قانوني أو استغلال جنسي أو محتوى متطرف أو انتحال شخصية أو مواد مسيئة.",
          "قادة الفرق مسؤولون عن دعوة اللاعبين الصحيحين والتأكد من أهلية أعضاء الفريق للمشاركة.",
          "يجب ألا تتم إضافة اللاعبين إلى الفرق من خلال الخداع أو الإساءة أو التلاعب.",
          "قد يقوم المسؤولون بالموافقة على الفرق أو رفضها أو إعادة تسميتها أو إزالتها أو تقييدها عند الحاجة لحماية المنصة أو المستخدمين أو نزاهة البطولات أو قواعد المجتمع.",
          "قد تُستخدم عضوية الفريق ودعوات الفريق وحالة الفريق في تسجيل البطولات وسجل لوحة المتصدرين.",
        ],
      },
      {
        id: "tournaments",
        title: "المشاركة في البطولات",
        intro:
          "قد تحتوي صفحات البطولات أو إعلانات Discord الرسمية على قواعد إضافية لكل فعالية.",
        bullets: [
          "لا تكون مشاركة الفريق مضمونة حتى تتم الموافقة على التسجيل من قبل مسؤول أو تأكيده من خلال مسار البطولة الرسمي.",
          "يجب على اللاعبين والفرق الالتزام بجداول البطولات وقواعد المباريات وقواعد المنصة وقواعد Discord وأي قواعد خاصة باللعبة يتم الإعلان عنها للبطولة.",
          "الفرق مسؤولة عن دقة معلومات الأعضاء والحضور في الوقت المناسب.",
          "قد تقوم AscendraHub برفض التسجيلات أو إلغائها أو إزالة الفرق إذا كان الفريق غير مكتمل أو غير مؤهل أو مسيئًا أو مشبوهًا أو مخالفًا للقواعد.",
          "قد تقوم AscendraHub بتعديل الجداول أو الأنظمة أو قواعد التسجيل أو الحد الأقصى للمقاعد أو أحجام الفرق أو الخرائط أو إجراءات المباريات أو إعدادات البطولة عند الحاجة.",
          "قد تقوم AscendraHub بإلغاء البطولات أو إيقافها مؤقتًا أو تأجيلها أو إنهائها بسبب مشكلات تقنية أو مخاوف تتعلق بالسلامة أو انخفاض المشاركة أو مخاوف الغش أو قرارات الإدارة أو ظروف خارجة عن سيطرة AscendraHub.",
        ],
      },
      {
        id: "no-gambling",
        title: "حظر القمار أو المراهنات",
        intro:
          "AscendraHub ليست منصة قمار أو مراهنات أو رهانات أو كازينو أو يانصيب أو ألعاب حظ.",
        paragraphs: [
          "يجب ألا يستخدم المستخدمون AscendraHub أو بطولاتها أو خادم Discord أو الفرق أو الترتيب أو النتائج أو ميزات المجتمع لأغراض القمار أو المراهنات أو الرهانات أو الاحتمالات أو أسواق التوقعات أو أنشطة الكازينو أو اليانصيب أو السحوبات أو الألعاب المدفوعة المعتمدة على الحظ أو أي نشاط مشابه.",
          "لا تقدم AscendraHub خدمات مراهنة، ولا تقبل الرهانات، ولا تدير خدمات قمار، ولا تسمح للمستخدمين بتنظيم القمار أو المراهنات من خلال المنصة.",
          "أي محاولة لاستخدام AscendraHub أو مجتمع Discord الرسمي للقمار أو المراهنات أو التلاعب بالمباريات أو التلاعب بالنتائج أو إساءة استخدام الجوائز قد تؤدي إلى الإزالة أو التعليق أو الاستبعاد أو الإبلاغ عند الاقتضاء.",
        ],
        note: "جوائز البطولات، إذا تم تقديمها، تكون مكافآت مجتمعية قائمة على المهارة للمشاركة في الألعاب التنافسية، وليست منتجات مراهنة أو قمار.",
      },
      {
        id: "prizes",
        title: "الجوائز والمكافآت المستقبلية",
        intro:
          "AscendraHub مجانية الاستخدام حاليًا. قد تتضمن البطولات المستقبلية جوائز أو مكافآت.",
        bullets: [
          "قد يتم تقديم جوائز في بطولات مستقبلية.",
          "سيتم توضيح تفاصيل الجائزة والأهلية وطريقة التسليم والتوقيت والقيود والقواعد الإضافية في صفحة البطولة أو في إعلان رسمي عبر Discord.",
          "قد تطلب AscendraHub تحققًا معقولًا قبل تسليم الجائزة.",
          "المستخدمون مسؤولون عن الالتزام بقواعد الضرائب أو الإبلاغ أو العمر أو المنطقة أو القواعد المحلية التي قد تنطبق على استلام الجوائز.",
          "قد تقوم AscendraHub بحجب الجائزة أو إلغائها أو إعادة تخصيصها إذا خالف لاعب أو فريق القواعد أو غش أو تلاعب بالنتائج أو قدم معلومات خاطئة أو كان غير مؤهل أو تعذر التواصل معه خلال وقت معقول.",
          "ما لم يُذكر خلاف ذلك بوضوح، فإن نقاط البطولات والأدوار ومراكز لوحة المتصدرين والتقدير المجتمعي لا تملك قيمة نقدية.",
        ],
      },
      {
        id: "rules-and-admins",
        title: "المسؤولون والإشراف والقرارات",
        intro:
          "يدير مسؤولو AscendraHub سلامة المنصة وجودة البطولات ونزاهة المنافسة.",
        bullets: [
          "قد يوافق المسؤولون على الفرق وتسجيلات البطولات أو يرفضونها.",
          "قد يصحح المسؤولون النتائج أو النقاط أو المراكز أو الترتيب أو بيانات الفريق إذا تم اكتشاف خطأ أو إساءة استخدام أو مخاوف غش أو مشكلة تقنية.",
          "قد يزيل المسؤولون المحتوى أو يقيّدون الميزات أو يعلقون الحسابات أو يستبعدون الفرق أو يزيلون اللاعبين عند الحاجة.",
          "قرارات المسؤولين نهائية ما لم تختَر AscendraHub مراجعتها.",
          "يمكن للمستخدمين تقديم اعتراض معقول عبر التواصل مع support@ascendrahub.com أو قناة الدعم الرسمية في Discord، ويفضل أن يكون ذلك خلال 48 ساعة من القرار المعني.",
          "لا يضمن تقديم الاعتراض تغيير القرار.",
        ],
      },
      {
        id: "conduct",
        title: "السلوك المحظور",
        intro:
          "أنت توافق على عدم إساءة استخدام AscendraHub أو مجتمع Discord الخاص بها أو أنظمة البطولات أو المستخدمين الآخرين.",
        bullets: [
          "يُحظر الغش أو استغلال الأخطاء أو استخدام برامج غير مصرح بها أو التلاعب بالمباريات أو الحسابات البديلة المسيئة أو تعزيز الحسابات أو التلاعب بالنتائج.",
          "يُحظر التحرش أو التنمر أو التهديدات أو التخويف أو خطاب الكراهية أو العنصرية أو التمييز الجنسي أو رهاب المثلية أو رهاب العبور الجنسي أو الكراهية الدينية أو المحتوى المتطرف أو الإساءة المستهدفة.",
          "يُحظر البريد المزعج أو الاحتيال أو التصيد أو البرمجيات الخبيثة أو سرقة بيانات الدخول أو الهندسة الاجتماعية أو محاولات تجاوز الأمان.",
          "يُحظر انتحال شخصية فريق AscendraHub أو المسؤولين أو اللاعبين أو الرعاة أو ناشري الألعاب أو المستخدمين الآخرين.",
          "يُحظر المحتوى غير القانوني أو الاستغلال الجنسي أو انتهاكات سلامة الأطفال أو التهديدات العنيفة أو نشر المعلومات الخاصة أو انتهاكات الخصوصية.",
          "يُحظر استخدام أسماء فرق أو أسماء لاعبين أو محتوى ملفات شخصية أو روابط أو سلوك في Discord يكون مسيئًا أو مضللًا أو غير قانوني.",
          "يُحظر محاولة إرهاق AscendraHub أو جمع بياناتها بشكل غير مشروع أو عكس هندستها أو تعطيلها أو مهاجمتها أو التدخل في قاعدة بياناتها أو تكامل Discord أو البوت أو الاستضافة أو أنظمة الأمان.",
          "يُحظر القمار أو المراهنات أو الرهانات أو مراهنات المباريات أو تنظيم الاحتمالات حول البطولات.",
        ],
      },
      {
        id: "user-content",
        title: "محتوى المستخدم والمعلومات المرسلة",
        intro:
          "قد يرسل المستخدمون معلومات محدودة من خلال المنصة، مثل أسماء الفرق والتسجيلات وبيانات المشاركة.",
        bullets: [
          "أنت مسؤول عن المحتوى والمعلومات التي ترسلها.",
          "يجب أن تملك الحق في إرسال أي محتوى تقدمه.",
          "يجب ألا ترسل محتوى يخالف القانون أو حقوق الخصوصية أو حقوق الملكية الفكرية أو قواعد المجتمع أو هذه الشروط.",
          "قد تقوم AscendraHub بإزالة أو تعديل أو تقييد أو رفض المحتوى الذي يخالف هذه الشروط أو يسبب خطرًا على المستخدمين أو المنصة أو المجتمع.",
          "الإعلانات والمحتوى الرسمي تخضع حاليًا لإدارة المسؤولين.",
          "إذا تمت إضافة عمليات رفع الملفات أو التعليقات أو المنشورات أو محتوى المستخدم المتقدم لاحقًا، فقد تنطبق قواعد إضافية.",
        ],
      },
      {
        id: "intellectual-property",
        title: "الملكية الفكرية",
        intro:
          "تمتلك AscendraHub أو تتحكم في تصميم المنصة والعلامة التجارية والتخطيط والنصوص وبنية الكود والهوية البصرية الأصلية التي تم إنشاؤها لـ AscendraHub.",
        paragraphs: [
          "لا يجوز لك نسخ أو إعادة استخدام أو بيع أو ادعاء ملكية أو إساءة تمثيل علامة AscendraHub أو تخطيطها أو محتوى المنصة أو بنية البطولات أو الأصول الأصلية دون إذن.",
          "أسماء الألعاب وأسماء الناشرين والشعارات وأسماء الشخصيات والعلامات التجارية والملكية الفكرية المرتبطة بها تعود إلى مالكيها المعنيين. تُستخدم أي إشارات للألعاب فقط لتحديد فئات البطولات أو الألعاب المدعومة أو اهتمامات المجتمع.",
          "لا تدّعي AscendraHub ملكية Discord أو Riot Games أو Valve أو Counter-Strike أو Dota أو League of Legends أو Valorant أو أي ملكية فكرية لطرف ثالث.",
        ],
      },
      {
        id: "third-party-services",
        title: "الخدمات الخارجية",
        intro:
          "تعتمد AscendraHub على خدمات خارجية للمصادقة والاستضافة والنطاق وقاعدة البيانات والنشر وميزات Discord والنشاط المجتمعي المرتبط بالألعاب.",
        bullets: [
          "قد يُستخدم Discord لتسجيل الدخول أو عضوية المجتمع أو التواصل الخاص بالبطولات أو الأدوار أو القنوات.",
          "قد تُستخدم Vercel للاستضافة والنشر.",
          "قد تُستخدم Cloudflare للنطاق وDNS والبنية التحتية المرتبطة.",
          "قد يُستخدم مزود قاعدة بيانات PostgreSQL مُدار لتخزين سجلات المنصة.",
          "قد تُستخدم GitHub للكود المصدري وتدفقات النشر.",
          "يتحكم ناشرو الألعاب والمنصات في ألعابهم وحساباتهم وخوادمهم وقواعدهم وتوفرها وقرارات التنفيذ الخاصة بهم.",
          "AscendraHub ليست مسؤولة عن الانقطاعات أو معالجة البيانات أو إجراءات الحسابات أو تغييرات الخدمة أو الأعطال الناتجة عن خدمات خارجية.",
        ],
      },
      {
        id: "availability",
        title: "التوفر والتغييرات",
        intro: "AscendraHub منصة متطورة وقد تتغير مع الوقت.",
        bullets: [
          "قد تتم إضافة الميزات أو تغييرها أو تقييدها أو إيقافها مؤقتًا أو إزالتها.",
          "قد لا يكون الموقع أو البوت أو قاعدة البيانات أو ميزات Discord أو أنظمة البطولات متاحة بسبب الصيانة أو الأخطاء أو مشكلات الاستضافة أو أعمال الأمان أو انقطاعات الخدمات الخارجية أو تغييرات التطوير.",
          "لا تضمن AscendraHub خدمة غير منقطعة أو تشغيلًا خاليًا من الأخطاء أو توفرًا دائمًا أو حفظًا دائمًا لجميع المحتويات.",
          "قد تغيّر AscendraHub النطاق أو العلامة التجارية أو السياسات أو بنية الخدمة أو جهة التشغيل في المستقبل.",
        ],
      },
      {
        id: "liability",
        title: "عدم وجود ضمانات وحدود المسؤولية",
        intro: "تُقدم AscendraHub كما هي وحسب توفرها.",
        paragraphs: [
          "إلى أقصى حد يسمح به القانون المعمول به، لا تقدم AscendraHub ضمانات بأن الخدمة ستكون دائمًا آمنة أو دقيقة أو متاحة أو غير منقطعة أو متوافقة أو خالية من الأخطاء.",
          "AscendraHub ليست مسؤولة عن النزاعات الشخصية بين اللاعبين، أو الخسائر الناتجة عن خدمات خارجية، أو مشكلات خوادم الألعاب، أو مشكلات Discord، أو مشكلات الأجهزة، أو انقطاعات الإنترنت، أو أخطاء المستخدمين، أو الوصول غير المصرح به الناتج عن اختراق حسابات المستخدمين، أو الأفعال الخارجة عن السيطرة المعقولة لـ AscendraHub.",
          "لا يحد أي شيء في هذه الشروط من المسؤولية عندما لا يمكن تقييدها بموجب القانون المعمول به.",
        ],
      },
      {
        id: "suspension",
        title: "التعليق والإنهاء",
        intro:
          "قد تقوم AscendraHub بتقييد الوصول عند الحاجة لحماية المستخدمين أو المنصة أو البطولات أو المجتمع.",
        bullets: [
          "قد تقوم AscendraHub بتعليق أو تقييد أو إزالة الحسابات أو الفرق أو التسجيلات أو النتائج أو المحتوى أو الوصول المرتبط بـ Discord إذا تمت مخالفة هذه الشروط.",
          "قد تتخذ AscendraHub إجراءً إذا كان ذلك مطلوبًا بموجب القانون أو سلامة المنصة أو قواعد Discord أو نزاهة البطولات أو مخاوف الأمان أو قرارات الإدارة.",
          "يمكن للمستخدمين طلب حذف الحساب عبر التواصل مع support@ascendrahub.com.",
          "قد يتم الاحتفاظ ببعض سجلات البطولات التاريخية بشكل محدود أو مجهول أو يحافظ على نزاهة السجل عند الحاجة لحماية النتائج أو الترتيب أو سجلات النزاعات أو الالتزامات القانونية.",
        ],
      },
      {
        id: "governing-law",
        title: "القانون الحاكم والنزاعات",
        intro:
          "تخضع هذه الشروط للقانون السويدي، مع تطبيق قوانين حماية البيانات في الاتحاد الأوروبي، بما في ذلك GDPR، عند الاقتضاء.",
        paragraphs: [
          "قبل بدء أي نزاع رسمي، توافق على التواصل أولًا مع AscendraHub عبر support@ascendrahub.com وإتاحة فرصة معقولة لحل المشكلة بشكل غير رسمي.",
          "إذا تعذر حل النزاع بشكل غير رسمي، فسيتم التعامل معه بموجب القانون السويدي المعمول به والجهات أو المحاكم السويدية المختصة، ما لم تمنحك قوانين حماية المستهلك أو حماية البيانات الإلزامية حقوقًا إضافية في بلدك.",
        ],
      },
      {
        id: "contact",
        title: "التواصل",
        intro:
          "للدعم أو الأسئلة القانونية أو مشكلات البطولات أو طلبات الحساب أو أسئلة السياسات، تواصل مع AscendraHub.",
        bullets: [
          "البريد الإلكتروني: support@ascendrahub.com.",
          "يرجى تضمين اسم مستخدم Discord الخاص بك، ومعرّف Discord إن كان متاحًا، واسم الفريق المعني، واسم البطولة، وشرح واضح لطلبك.",
          "للطلبات المتعلقة بالخصوصية، راجع سياسة الخصوصية.",
        ],
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = termsMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const messages = termsMessages[locale];

  return (
    <LegalPolicyPage
      title={messages.page.title}
      description={messages.page.description}
      lastUpdated={messages.page.lastUpdated}
      effectiveDate={messages.page.effectiveDate}
      sections={messages.sections}
    />
  );
}
