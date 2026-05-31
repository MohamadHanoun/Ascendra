import type { Metadata } from "next";

import LegalPolicyPage, {
  type LegalSection,
} from "@/components/LegalPolicyPage";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

type CookiesMessages = {
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

const cookiesMessages: Record<Locale, CookiesMessages> = {
  en: {
    metadata: {
      title: "Cookie Policy | AscendraHub",
      description:
        "Cookie Policy for AscendraHub authentication, sessions, security, and similar browser storage.",
    },
    page: {
      title: "Cookie Policy",
      description:
        "How AscendraHub uses cookies and similar technologies for login, authentication, security, sessions, and core website functionality.",
      lastUpdated: "22 May 2026",
      effectiveDate: "22 May 2026",
    },
    sections: [
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
        intro:
          "For cookie, privacy, or account questions, contact AscendraHub.",
        bullets: [
          "Email: support@ascendrahub.com.",
          "Please describe your question clearly and include your Discord username or account information only if needed.",
        ],
      },
    ],
  },

  ar: {
    metadata: {
      title: "سياسة ملفات تعريف الارتباط | AscendraHub",
      description:
        "سياسة ملفات تعريف الارتباط الخاصة بالمصادقة والجلسات والأمان والتخزين المشابه في المتصفح على AscendraHub.",
    },
    page: {
      title: "سياسة ملفات تعريف الارتباط",
      description:
        "كيف تستخدم AscendraHub ملفات تعريف الارتباط والتقنيات المشابهة لتسجيل الدخول والمصادقة والأمان والجلسات ووظائف الموقع الأساسية.",
      lastUpdated: "22 مايو 2026",
      effectiveDate: "22 مايو 2026",
    },
    sections: [
      {
        id: "what-cookies-are",
        title: "ما هي ملفات تعريف الارتباط",
        intro:
          "ملفات تعريف الارتباط هي ملفات نصية صغيرة تُخزّن في متصفحك بواسطة المواقع التي تزورها.",
        paragraphs: [
          "يمكن أن تساعد ملفات تعريف الارتباط والتقنيات المشابهة المواقع على تذكر الجلسات، وإبقاء المستخدمين مسجلين الدخول، وحماية النماذج من الإساءة، وتخزين التفضيلات الأساسية، والحفاظ على الأمان.",
          "قد تشمل التقنيات المشابهة التخزين المحلي، وتخزين الجلسة، ورموز المصادقة، والجلسات من جهة الخادم، ومعرّفات الأمان.",
        ],
      },
      {
        id: "how-we-use-cookies",
        title: "كيف تستخدم AscendraHub ملفات تعريف الارتباط",
        intro:
          "تستخدم AscendraHub حاليًا ملفات تعريف الارتباط والتقنيات المشابهة فقط لوظائف المنصة الضرورية.",
        bullets: [
          "المصادقة وجلسات تسجيل الدخول.",
          "تدفق تسجيل الدخول عبر Discord OAuth.",
          "أمان الجلسات والحماية من الإساءة.",
          "وظائف المنصة الأساسية.",
          "إبقاء الميزات المعتمدة على الحساب تعمل أثناء استخدامك للموقع.",
          "تصحيح الأخطاء التقنية والاعتمادية عندما تتطلبها أنظمة الاستضافة أو المصادقة.",
        ],
      },
      {
        id: "necessary-cookies",
        title: "ملفات تعريف الارتباط الضرورية",
        intro:
          "ملفات تعريف الارتباط الضرورية مطلوبة لوظائف الموقع الأساسية ولا تتطلب نفس نوع الموافقة الاختيارية مثل ملفات التحليلات أو الإعلانات.",
        bullets: [
          "ملفات جلسة العمل: تُستخدم لإبقائك مسجلًا الدخول.",
          "ملفات المصادقة: تُستخدم لربط تسجيل دخول Discord بجلسة AscendraHub الخاصة بك.",
          "ملفات أو رموز الأمان: تُستخدم لحماية تسجيل الدخول والنماذج وإجراءات الحساب.",
          "تخزين التفضيلات: قد يُستخدم لتفضيلات العرض أو الوظائف الأساسية.",
        ],
        note: "إذا قمت بحظر ملفات تعريف الارتباط الضرورية، فقد لا تعمل ميزات تسجيل الدخول والملف الشخصي وإنشاء الفرق والدعوات والتسجيلات وميزات الإدارة بشكل صحيح.",
      },
      {
        id: "discord-login",
        title: "ملفات تعريف الارتباط الخاصة بتسجيل الدخول عبر Discord",
        intro:
          "تستخدم AscendraHub تسجيل الدخول عبر Discord للميزات المعتمدة على الحساب.",
        paragraphs: [
          "عندما تختار تسجيل الدخول عبر Discord، قد تتم إعادة توجيه متصفحك إلى Discord ثم العودة إلى AscendraHub. أثناء هذه العملية، قد تُستخدم ملفات تعريف الارتباط أو بيانات مصادقة مشابهة لإكمال تسجيل الدخول بأمان.",
          "قد يقوم Discord بتعيين ملفات تعريف ارتباط خاصة به أو معالجة بيانات عند استخدامك لخدمات Discord. ممارسات ملفات تعريف الارتباط والخصوصية الخاصة بـ Discord يتحكم بها Discord، وليس AscendraHub.",
        ],
      },
      {
        id: "analytics",
        title: "التحليلات والقياس",
        intro:
          "لا تستخدم AscendraHub حاليًا عن قصد Google Analytics أو وحدات تتبع الإعلانات أو ملفات تعريف الارتباط التسويقية.",
        bullets: [
          "لا يتم استخدام ملفات تعريف ارتباط إعلانية عن قصد في هذه المرحلة.",
          "لا يتم استخدام أي تتبع متعلق بالمراهنات أو القمار أو الرهانات، ولن يتم استخدامه.",
          "قد يعالج مزودو البنية التحتية سجلات تقنية محدودة للأمان والأداء ومعالجة الأخطاء وتقديم الموقع.",
          "إذا أضافت AscendraHub لاحقًا التحليلات أو القياس أو التتبع الاختياري، فسيتم تحديث سياسة ملفات تعريف الارتباط هذه قبل أو عند إدخال تلك الأدوات.",
          "إذا كانت الموافقة مطلوبة للتحليلات المستقبلية أو ملفات تعريف الارتباط الاختيارية، فيجب على AscendraHub إضافة شريط موافقة على ملفات تعريف الارتباط أو عنصر تحكم مكافئ.",
        ],
      },
      {
        id: "advertising",
        title: "لا توجد ملفات إعلانات أو مراهنات أو قمار",
        intro:
          "لا تستخدم AscendraHub ملفات تعريف الارتباط لأغراض القمار أو المراهنات أو الرهانات أو أنشطة الكازينو أو التتبع المرتبط بالاحتمالات.",
        paragraphs: [
          "AscendraHub ليست منصة قمار أو مراهنات. يجب ألا تُستخدم ملفات تعريف الارتباط لدعم القمار أو المراهنات أو الرهانات أو مراهنات المباريات أو أنشطة الكازينو أو أي تتبع مرتبط بذلك.",
          "لا تستخدم AscendraHub حاليًا ملفات تعريف ارتباط إعلانية أو ملفات إعلانات موجهة أو وحدات إعادة الاستهداف أو ملفات تعريف تسويقية.",
        ],
      },
      {
        id: "third-party-cookies",
        title: "ملفات تعريف الارتباط والخدمات الخارجية",
        intro:
          "قد تقوم بعض الخدمات الخارجية بتعيين أو استخدام ملفات تعريف الارتباط عند تفاعلك مع خدماتها.",
        bullets: [
          "قد يستخدم Discord ملفات تعريف الارتباط عند تسجيل الدخول أو التفاعل مع خدمات Discord.",
          "قد تعالج Vercel بيانات تقنية مرتبطة باستضافة الموقع وتسليمه.",
          "قد تعالج Cloudflare بيانات DNS والأمان والبيانات التقنية المرتبطة بحركة المرور حسب الإعدادات.",
          "قد يخزن متصفحك أو إضافاتك أو جهازك بيانات بشكل مستقل عن AscendraHub.",
          "لا تتحكم AscendraHub في ملفات تعريف الارتباط الخارجية خارج موقع AscendraHub.",
        ],
      },
      {
        id: "cookie-duration",
        title: "مدة بقاء ملفات تعريف الارتباط",
        intro:
          "تعتمد مدة ملفات تعريف الارتباط على نوع الملف أو التخزين المستخدم.",
        bullets: [
          "قد تنتهي ملفات جلسة العمل عند إغلاق المتصفح أو بعد فترة جلسة محدودة.",
          "قد تستمر ملفات المصادقة لمدة أطول لإبقائك مسجلًا الدخول.",
          "قد تنتهي ملفات أو رموز الأمان تلقائيًا بعد مدة محددة.",
          "تتحكم الجهة الخارجية التي تضع ملف تعريف الارتباط في مدة ملفها.",
          "إذا أضافت AscendraHub لاحقًا أداة تفضيلات ملفات تعريف الارتباط، فقد تخزن اختياراتك لمدة محدودة.",
        ],
      },
      {
        id: "manage-cookies",
        title: "كيفية إدارة ملفات تعريف الارتباط",
        intro: "يمكنك إدارة ملفات تعريف الارتباط من خلال إعدادات المتصفح.",
        bullets: [
          "يمكنك حذف ملفات تعريف الارتباط المخزنة بالفعل في متصفحك.",
          "يمكنك حظر ملفات تعريف الارتباط لجميع المواقع أو لمواقع محددة.",
          "يمكنك استخدام التصفح الخاص أو عناصر تحكم الخصوصية في المتصفح.",
          "يمكنك تعطيل ملفات تعريف الارتباط الخارجية في العديد من المتصفحات.",
          "قد يؤدي حظر الملفات المطلوبة إلى توقف تسجيل الدخول والملف الشخصي والفرق والبطولات وميزات الإدارة عن العمل بشكل صحيح.",
        ],
      },
      {
        id: "future-changes",
        title: "التغييرات المستقبلية",
        intro:
          "قد تضيف AscendraHub ميزات جديدة تغيّر طريقة استخدام ملفات تعريف الارتباط أو التقنيات المشابهة.",
        bullets: [
          "قد تشمل الميزات المستقبلية التحليلات، وإشعارات البريد الإلكتروني، وتفضيلات اللغة، والميزات المرتبطة بالدفع، والاشتراكات، والتحقق من الجوائز، ورفع الملفات، أو إعدادات المستخدم.",
          "إذا تمت إضافة ملفات تعريف ارتباط غير ضرورية، فيجب على AscendraHub تحديث هذه السياسة وتوفير خيارات موافقة عند الحاجة.",
          "ستكون أحدث نسخة من سياسة ملفات تعريف الارتباط هذه متاحة في هذه الصفحة.",
        ],
      },
      {
        id: "contact",
        title: "التواصل",
        intro:
          "لأسئلة ملفات تعريف الارتباط أو الخصوصية أو الحساب، تواصل مع AscendraHub.",
        bullets: [
          "البريد الإلكتروني: support@ascendrahub.com.",
          "يرجى وصف سؤالك بوضوح وتضمين اسم مستخدم Discord أو معلومات الحساب فقط إذا كانت مطلوبة.",
        ],
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = cookiesMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

export default async function CookiesPage() {
  const locale = await getLocale();
  const messages = cookiesMessages[locale];

  return (
    <LegalPolicyPage
      title={messages.page.title}
      description={messages.page.description}
      lastUpdated={messages.page.lastUpdated}
      effectiveDate={messages.page.effectiveDate}
      sections={messages.sections}
      activePath="/cookies"
    />
  );
}
