import type { Metadata } from "next";

import LegalPolicyPage, {
  type LegalSection,
} from "@/components/LegalPolicyPage";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

type PrivacyMessages = {
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

const privacyMessages: Record<Locale, PrivacyMessages> = {
  en: {
    metadata: {
      title: "Privacy Policy | AscendraHub",
      description:
        "Privacy Policy for AscendraHub and Ascendra account, team, tournament, Discord login, and leaderboard data.",
    },
    page: {
      title: "Privacy Policy",
      description:
        "How AscendraHub handles Discord login data, profiles, teams, tournament registrations, results, rankings, technical logs, and privacy rights.",
      lastUpdated: "22 May 2026",
      effectiveDate: "22 May 2026",
    },
    sections: [
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
    ],
  },

  ar: {
    metadata: {
      title: "سياسة الخصوصية | AscendraHub",
      description:
        "سياسة الخصوصية الخاصة ببيانات حسابات AscendraHub وAscendra والفرق والبطولات وتسجيل الدخول عبر Discord ولوحة المتصدرين.",
    },
    page: {
      title: "سياسة الخصوصية",
      description:
        "كيف تتعامل AscendraHub مع بيانات تسجيل الدخول عبر Discord، والملفات الشخصية، والفرق، وتسجيلات البطولات، والنتائج، ولوحة المتصدرين، والسجلات التقنية، وحقوق الخصوصية.",
      lastUpdated: "22 مايو 2026",
      effectiveDate: "22 مايو 2026",
    },
    sections: [
      {
        id: "controller",
        title: "من يتحكم في بياناتك الشخصية",
        intro:
          "تُدار AscendraHub / Ascendra حاليًا بواسطة Omar Hanoun، ومقره في Växjö، السويد.",
        bullets: [
          "المتحكم في البيانات: Omar Hanoun، مشغّل AscendraHub / Ascendra.",
          "الموقع: Växjö، السويد.",
          "البريد الإلكتروني للتواصل: support@ascendrahub.com.",
          "إذا أصبحت AscendraHub لاحقًا مُدارة من خلال شركة سويدية مسجلة، فسيتم تحديث سياسة الخصوصية هذه باسم الشركة وتفاصيل التسجيل.",
        ],
      },
      {
        id: "scope",
        title: "نطاق سياسة الخصوصية هذه",
        intro:
          "توضح سياسة الخصوصية هذه كيف تتعامل AscendraHub مع البيانات الشخصية عند استخدام الموقع، أو تسجيل الدخول عبر Discord، أو إنشاء الفرق أو الانضمام إليها، أو التسجيل في البطولات، أو الظهور في النتائج، أو استخدام لوحة المتصدرين، أو التفاعل مع ميزات المنصة المرتبطة بـ Discord.",
        paragraphs: [
          "لا تتحكم هذه السياسة في كيفية معالجة Discord أو Vercel أو Cloudflare أو GitHub أو ناشري الألعاب أو أي خدمات خارجية أخرى للبيانات ضمن خدماتهم الخاصة. لهذه الخدمات شروط وسياسات خصوصية خاصة بها.",
          "لا تتحكم AscendraHub في رسائل Discord الخاصة، أو حسابات الألعاب، أو خوادم الألعاب، أو ناشري الألعاب، أو أنظمة الحسابات الخارجية.",
        ],
      },
      {
        id: "data-we-collect",
        title: "البيانات الشخصية التي نجمعها",
        intro:
          "تجمع AscendraHub فقط البيانات اللازمة لتشغيل تسجيل الدخول والفرق والبطولات والإشراف ولوحة المتصدرين ووظائف المنصة.",
        bullets: [
          "بيانات حساب Discord: معرّف Discord، واسم مستخدم Discord، وصورة Discord، وحالة العضوية في خادم Discord عند الحاجة للمشاركة في البطولات.",
          "بيانات تسجيل الدخول والحساب: معرّف المستخدم الداخلي، ودور الحساب، وآخر وقت تسجيل دخول، وآخر وقت للتحقق من عضوية Discord، ووقت إنشاء الحساب، ووقت تحديث الحساب.",
          "بيانات الفريق: اسم الفريق، اللعبة، قائد الفريق، أعضاء الفريق، دور العضوية في الفريق، حالة الفريق، حالة الإرسال، معلومات الموافقة أو الرفض، والطوابع الزمنية المرتبطة.",
          "بيانات دعوات الفريق: المستخدم المدعو، والمستخدم الداعي، والفريق، وحالة الدعوة، ووقت الإنشاء، ووقت الرد.",
          "بيانات تسجيل البطولات: البطولة، الفريق، المستخدم الذي سجل، حالة التسجيل، معلومات الموافقة أو الرفض أو الإلغاء أو المراجعة، والطوابع الزمنية.",
          "لقطات نزاهة البطولة: اسم الفريق وقت التسجيل، واللعبة، والأعضاء عند الحاجة إلى حفظ سجل تاريخي للتسجيل أو النتيجة.",
          "بيانات نتائج البطولات: المركز، النقاط، ملاحظات النتيجة، وقت منح النتيجة، سجل نتائج الفريق، والسجلات المرتبطة بلوحة المتصدرين.",
          "بيانات دعم البطولات في Discord: أسماء الأدوار، معرّفات الأدوار، حالة المزامنة، أسماء القنوات، معرّفات القنوات، وأخطاء المزامنة عندما تستخدمها المنصة أو البوت لعمليات البطولة.",
          "المحتوى العام الذي يديره المسؤولون: الإعلانات، القواعد، الأدوار، أعضاء الفريق، إعدادات الخادم، ومحتوى الموقع العام الذي يديره المسؤولون.",
          "بيانات البوت والأحداث الفورية: سجلات تقنية تُستخدم لمعالجة إجراءات أدوار/قنوات Discord، والتحديثات، والإشعارات، ونشاط المنصة.",
          "البيانات التقنية: قد يعالج مزودو الاستضافة والأمان والخوادم وقواعد البيانات والنشر وDNS والبنية التحتية سجلات تقنية مثل عنوان IP، ووقت الطلب، وبيانات المتصفح/الجهاز، وسجلات الأخطاء، وأحداث الأمان.",
        ],
      },
      {
        id: "data-not-collected",
        title: "بيانات لا نجمعها عمدًا",
        intro:
          "تم تصميم AscendraHub لإدارة البطولات والمجتمع، وليس لمراقبة الرسائل الخاصة.",
        bullets: [
          "لا تقرأ AscendraHub رسائل Discord الخاصة ولا تخزنها.",
          "لا تجمع AscendraHub عمدًا بيانات بطاقات الدفع لأن المدفوعات لا تتم معالجتها حاليًا على المنصة.",
          "لا تشغّل AscendraHub ميزات مراهنة أو قمار أو رهانات أو كازينو.",
          "لا تبيع AscendraHub البيانات الشخصية عمدًا.",
          "لا تستخدم AscendraHub حاليًا ملفات تعريف ارتباط إعلانية أو ملفات تتبع تسويقية.",
          "لا تطلب AscendraHub منك تقديم وثائق هوية قانونية إلا إذا أصبحت متطلبات الجوائز المستقبلية أو منع الاحتيال أو الامتثال القانوني تجعل التحقق ضروريًا.",
        ],
      },
      {
        id: "sources",
        title: "مصادر البيانات",
        intro:
          "تأتي معظم البيانات الشخصية منك مباشرة، أو من تسجيل الدخول عبر Discord، أو من نشاطك داخل المنصة.",
        bullets: [
          "تقدم البيانات عند تسجيل الدخول، أو إنشاء الفرق، أو دعوة اللاعبين، أو التسجيل في البطولات، أو التفاعل مع المنصة.",
          "يوفر Discord بيانات حساب محدودة من خلال تسجيل الدخول عبر OAuth، مثل معرّف Discord واسم المستخدم والصورة ومعلومات عضوية الخادم حسب الصلاحيات المستخدمة.",
          "قد ينشئ المسؤولون أو يحدّثون سجلات البطولات والتسجيلات والنتائج والإعلانات والقواعد والأدوار وقرارات الإشراف.",
          "قد تنشئ الخدمات التقنية سجلات وبيانات أمان عندما يتصل متصفحك بالموقع.",
        ],
      },
      {
        id: "purposes",
        title: "لماذا نستخدم البيانات الشخصية",
        intro:
          "تستخدم AscendraHub البيانات الشخصية فقط لأغراض مشروعة تتعلق بالمنصة والبطولات والمجتمع والأمان والقانون.",
        bullets: [
          "لتمكين المستخدمين من تسجيل الدخول عبر Discord.",
          "لإنشاء الملفات الشخصية وإدارتها.",
          "للتحقق مما إذا كان المستخدم متصلًا بمجتمع Discord الرسمي عندما تتطلب المشاركة في البطولة ذلك.",
          "لإنشاء الفرق، وإدارة الأعضاء، وإرسال دعوات الفرق والرد عليها، وتتبع قادة الفرق.",
          "لتسجيل الفرق في البطولات وتمكين المسؤولين من الموافقة على التسجيلات أو رفضها أو مراجعتها أو إلغائها.",
          "لإدارة مقاعد البطولة، وأحجام الفرق، والنتائج، والمراكز، والنقاط، ولوحة المتصدرين.",
          "للحفاظ على نزاهة سجل البطولات من خلال لقطات لأسماء الفرق والألعاب والأعضاء.",
          "لدعم أدوار وقنوات Discord المرتبطة بالبطولات وتنسيق الخادم.",
          "لمنع الغش، والإساءة، والحسابات البديلة المسيئة، والبريد المزعج، والاحتيال، والتحرش، ومخالفات القواعد، وتهديدات الأمان.",
          "للرد على طلبات الدعم والخصوصية والطلبات القانونية وطلبات الإشراف.",
          "لصيانة الموقع وقاعدة البيانات والبوت والبنية التحتية للمنصة، وتصحيح الأخطاء، وتأمينها، وتحسينها.",
          "للامتثال للالتزامات القانونية وتنفيذ شروط استخدام المنصة.",
        ],
      },
      {
        id: "legal-basis",
        title: "الأساس القانوني بموجب GDPR",
        intro:
          "عندما ينطبق GDPR، تعتمد AscendraHub على أسس قانونية مختلفة حسب غرض المعالجة.",
        bullets: [
          "العقد أو الخطوات السابقة للعقد: لتقديم ميزات الحساب، وتسجيل الدخول، والفرق، والتسجيلات، والمشاركة في البطولات، ووظائف المنصة التي يطلبها المستخدم.",
          "المصالح المشروعة: لتأمين المنصة، ومنع الإساءة، وحماية نزاهة البطولات، وإدارة الترتيب، والإشراف على المجتمع، والاحتفاظ بالسجلات التقنية، وتحسين موثوقية الخدمة.",
          "الموافقة: عندما تتطلب الميزات الاختيارية أو التحليلات المستقبلية أو التسويق أو الاتصالات الاختيارية أو ملفات تعريف الارتباط غير الضرورية موافقة.",
          "الالتزام القانوني: عندما يجب على AscendraHub معالجة البيانات أو الاحتفاظ بها للامتثال للقانون المعمول به أو الرد على الطلبات القانونية أو التعامل مع النزاعات أو حماية الحقوق القانونية.",
          "لا تُستخدم المصالح الحيوية أو العامة عادةً كأساس قانوني لعمليات AscendraHub العادية.",
        ],
        note: "إذا أضافت AscendraHub لاحقًا المدفوعات أو الاشتراكات أو البطولات المدفوعة أو التحليلات المتقدمة، فيجب تحديث هذه السياسة قبل إطلاق تلك الميزات.",
      },
      {
        id: "public-data",
        title: "البيانات العامة والظاهرة للمجتمع",
        intro:
          "قد تكون بعض البيانات مرئية للمستخدمين الآخرين لأن المنصة مبنية حول الفرق والبطولات ولوحة المتصدرين والمنافسة العامة.",
        bullets: [
          "قد تظهر أسماء الفرق، والألعاب، والأعضاء، والقادة، وتسجيلات البطولات، والموافقات، والنتائج، والنقاط، والمراكز، ومواقع لوحة المتصدرين على الموقع أو في Discord.",
          "قد تبقى نتائج البطولات مرئية بعد انتهاء البطولة للحفاظ على سجل المنافسة ونزاهة الترتيب.",
          "قد تكون الإعلانات والقواعد وأعضاء الفريق والأدوار ومعلومات البطولات وبيانات لوحة المتصدرين عامة.",
          "إذا طلب المستخدم الحذف، فقد تقوم AscendraHub بإخفاء هوية بعض الإشارات التاريخية أو تقييدها عندما يؤدي الحذف الكامل إلى الإضرار بنزاهة البطولة أو التعامل مع النزاعات أو السجلات المشروعة.",
        ],
      },
      {
        id: "sharing",
        title: "من قد يستلم البيانات",
        intro:
          "لا تبيع AscendraHub البيانات الشخصية. قد تتم معالجة البيانات بواسطة مزودي الخدمات اللازمين لتشغيل المنصة.",
        bullets: [
          "قد تعالج Vercel سجلات الاستضافة والنشر والطلبات والسجلات التقنية.",
          "قد تعالج Cloudflare بيانات DNS والنطاق والأمان والبيانات التقنية المرتبطة بحركة المرور حسب الإعدادات.",
          "يعالج Discord بيانات تسجيل الدخول والبيانات المرتبطة بالمجتمع ضمن خدماته وسياساته الخاصة.",
          "يُستخدم مزود قاعدة بيانات PostgreSQL مُدار لتخزين سجلات المنصة.",
          "قد تعالج GitHub معلومات تقنية مرتبطة بالكود المصدري وتدفقات النشر.",
          "قد يصل المسؤولون إلى البيانات اللازمة لتشغيل البطولات والإشراف على المنصة ودعم المستخدمين والحفاظ على سلامة المجتمع.",
          "قد يتم الإفصاح عن البيانات إذا كان ذلك مطلوبًا بموجب القانون أو الإجراءات القانونية أو تحقيقات الأمان أو تنفيذ الشروط أو حماية الحقوق والسلامة.",
        ],
      },
      {
        id: "international-transfers",
        title: "نقل البيانات دوليًا",
        intro:
          "تُدار AscendraHub من السويد، لكن قد يعالج بعض مزودي الخدمات البيانات في دول أخرى.",
        paragraphs: [
          "قد يعالج بعض مزودي البنية التحتية أو الاستضافة أو المصادقة أو النطاق أو قاعدة البيانات أو التطوير البيانات الشخصية خارج السويد أو المنطقة الاقتصادية الأوروبية.",
          "عند الحاجة، تتوقع AscendraHub من مزودي الخدمات استخدام ضمانات مناسبة مثل الحماية التعاقدية أو البنود التعاقدية القياسية أو اتفاقيات معالجة البيانات أو آليات نقل قانونية أخرى.",
          "نظرًا لأن AscendraHub تستخدم خدمات خارجية، ينبغي للمستخدمين أيضًا مراجعة شروط الخصوصية الخاصة بتلك الخدمات، خصوصًا Discord وVercel وCloudflare وأي مزود قاعدة بيانات تستخدمه المنصة.",
        ],
      },
      {
        id: "retention",
        title: "مدة الاحتفاظ بالبيانات",
        intro:
          "تحتفظ AscendraHub بالبيانات الشخصية فقط طالما كان ذلك ضروريًا لوظائف المنصة، أو نزاهة البطولات، أو الأمان، أو الأغراض القانونية، أو السجلات المجتمعية المشروعة.",
        bullets: [
          "عادةً ما يتم الاحتفاظ ببيانات الحساب طالما بقي الحساب نشطًا أو طالما كانت مطلوبة لتقديم ميزات الحساب.",
          "يتم الاحتفاظ ببيانات الفرق والدعوات طالما كانت مطلوبة لإدارة الفريق أو السجل أو الإشراف أو التعامل مع النزاعات.",
          "قد يتم الاحتفاظ بتسجيلات البطولات ونتائجها للحفاظ على سجل البطولات والترتيب والنقاط وسجلات الجوائز ونزاهة المنافسة.",
          "يتم الاحتفاظ بالسجلات التقنية وفقًا لممارسات الاحتفاظ الخاصة بـ AscendraHub ومزودي خدماتها.",
          "قد يتم الاحتفاظ ببيانات البوت والأحداث الفورية للمعالجة التقنية وتصحيح الأخطاء والتدقيق وموثوقية المزامنة ومنع الإساءة.",
          "إذا طلبت الحذف، ستراجع AscendraHub الطلب وتحذف البيانات أو تخفي هويتها أو تقيّدها عندما يتطلب القانون المعمول به ذلك.",
        ],
      },
      {
        id: "deletion",
        title: "حذف الحساب وطلبات البيانات",
        intro:
          "يمكن للمستخدمين طلب حذف الحساب أو المساعدة المتعلقة بالخصوصية عبر التواصل مع support@ascendrahub.com.",
        bullets: [
          "لطلب الحذف، تواصل مع support@ascendrahub.com من حساب مناسب أو أرسل معلومات كافية لتحديد ملفك في AscendraHub.",
          "قم بتضمين اسم مستخدم Discord ومعرّف Discord إذا كان متاحًا.",
          "قد تحتاج AscendraHub إلى التحقق من الطلب قبل حذف البيانات أو تغييرها.",
          "قد يتم الاحتفاظ ببعض البيانات إذا كان ذلك ضروريًا لنزاهة البطولات أو التعامل مع النزاعات أو الأمان أو الالتزامات القانونية أو السجلات المشروعة.",
          "عندما يكون ذلك ممكنًا، قد يتم إخفاء هوية سجلات البطولات التاريخية أو تقييدها بدلًا من إزالتها بالكامل.",
        ],
      },
      {
        id: "rights",
        title: "حقوقك بموجب GDPR",
        intro:
          "إذا كان GDPR ينطبق عليك، فقد تملك الحقوق التالية فيما يتعلق ببياناتك الشخصية.",
        bullets: [
          "حق الوصول: يمكنك طلب معرفة البيانات الشخصية التي تحتفظ بها AscendraHub عنك.",
          "حق التصحيح: يمكنك طلب تصحيح البيانات غير الدقيقة.",
          "حق المحو: يمكنك طلب الحذف عندما تتحقق الشروط القانونية.",
          "حق التقييد: يمكنك طلب أن تقيّد AscendraHub بعض عمليات المعالجة.",
          "حق نقل البيانات: يمكنك طلب بعض البيانات بصيغة منظمة عندما ينطبق ذلك.",
          "حق الاعتراض: يمكنك الاعتراض على المعالجة القائمة على المصالح المشروعة.",
          "حق سحب الموافقة: عندما تكون المعالجة مبنية على الموافقة، يمكنك سحبها.",
          "حق تقديم شكوى: يمكنك التواصل مع هيئة حماية الخصوصية السويدية Integritetsskyddsmyndigheten أو أي سلطة حماية بيانات مختصة أخرى.",
        ],
        note: "لممارسة هذه الحقوق، تواصل مع support@ascendrahub.com. قد تطلب AscendraHub معلومات ضرورية للتحقق من هويتك وتحديد حسابك.",
      },
      {
        id: "security",
        title: "الأمان",
        intro:
          "تستخدم AscendraHub تدابير تقنية وتنظيمية معقولة لحماية بيانات المنصة.",
        bullets: [
          "الوصول إلى ميزات الإدارة محدود للمسؤولين المصرح لهم.",
          "تتم المصادقة من خلال تسجيل الدخول عبر Discord وأمان الجلسات داخل المنصة.",
          "تتم حماية سجلات قاعدة البيانات من خلال إعدادات مزود الاستضافة وقاعدة البيانات.",
          "تحاول AscendraHub تقليل البيانات المخزنة إلى ما هو ضروري لوظائف المنصة والبطولات.",
          "لا يمكن لأي خدمة على الإنترنت ضمان أمان كامل. يجب على المستخدمين حماية حساب Discord الخاص بهم والإبلاغ عن أي نشاط مشبوه.",
        ],
      },
      {
        id: "children",
        title: "الأطفال وقيود العمر",
        intro:
          "AscendraHub غير مخصصة للمستخدمين دون 13 عامًا أو للمستخدمين الذين لا يستوفون الحد الأدنى للعمر المطلوب لاستخدام Discord في بلدهم.",
        bullets: [
          "يجب ألا يستخدم من هم دون العمر المطلوب ميزات تسجيل الدخول أو الفرق أو البطولات أو المشاركة المجتمعية.",
          "قد تقوم AscendraHub بتقييد الحسابات أو حذفها إذا علمت أن المستخدم دون العمر المطلوب.",
          "يمكن للوالدين أو الأوصياء القانونيين التواصل مع support@ascendrahub.com بخصوص المخاوف المتعلقة بالخصوصية.",
        ],
      },
      {
        id: "cookies",
        title: "ملفات تعريف الارتباط والتقنيات المشابهة",
        intro:
          "قد تستخدم AscendraHub ملفات تعريف الارتباط أو تخزينًا مشابهًا في المتصفح للوظائف الضرورية مثل المصادقة والجلسات والأمان والتفضيلات الأساسية.",
        paragraphs: [
          "لا تنوي AscendraHub حاليًا استخدام ملفات تعريف ارتباط إعلانية أو تتبع مرتبط بالقمار. إذا تمت إضافة التحليلات أو الإعلانات أو التسويق أو ملفات تعريف الارتباط الاختيارية لاحقًا، فيجب تحديث سياسة الخصوصية وسياسة ملفات تعريف الارتباط وإضافة آلية موافقة عندما يكون ذلك مطلوبًا.",
        ],
      },
      {
        id: "updates",
        title: "تحديثات سياسة الخصوصية هذه",
        intro: "قد تقوم AscendraHub بتحديث سياسة الخصوصية هذه عند تغير المنصة.",
        bullets: [
          "قد تكون التحديثات ضرورية إذا أضافت AscendraHub المدفوعات أو الاشتراكات أو التحقق من الجوائز أو التحليلات أو إشعارات البريد الإلكتروني أو رفع الملفات أو التعليقات أو ميزات Discord المتقدمة أو هيكل شركة مسجلة.",
          "ستكون أحدث نسخة متاحة في هذه الصفحة.",
          "قد يتم الإعلان عن التغييرات المهمة أيضًا على الموقع أو خادم Discord الرسمي.",
        ],
      },
      {
        id: "contact",
        title: "التواصل بخصوص الخصوصية",
        intro:
          "لأسئلة الخصوصية أو طلبات حذف الحساب أو طلبات الوصول إلى البيانات أو الطلبات المتعلقة بـ GDPR، تواصل مع AscendraHub.",
        bullets: [
          "البريد الإلكتروني: support@ascendrahub.com.",
          "قم بتضمين اسم مستخدم Discord، ومعرّف Discord إذا كان متاحًا، وشرحًا واضحًا لطلبك.",
          "لا ترسل كلمات مرور أو تفاصيل بطاقات الدفع أو معلومات حساسة غير ضرورية.",
        ],
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = privacyMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const messages = privacyMessages[locale];

  return (
    <LegalPolicyPage
      title={messages.page.title}
      description={messages.page.description}
      lastUpdated={messages.page.lastUpdated}
      effectiveDate={messages.page.effectiveDate}
      sections={messages.sections}
      activePath="/privacy"
    />
  );
}
