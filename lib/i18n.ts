import { cookies } from "next/headers";

export const localeCookieName = "ascendra_locale";

export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export type NavigationMessages = {
  links: {
    home: string;
    tournaments: string;
    leaderboard: string;
    news: string;
    community: string;
    profile: string;
    adminPanel: string;
    botDashboard: string;
  };
  actions: {
    login: string;
    logout: string;
    joinDiscord: string;
    menu: string;
    close: string;
    cancel: string;
    confirmLogout: string;
  };
  account: {
    signedIn: string;
    fallbackName: string;
    logoutTitle: string;
    logoutDescription: string;
  };
  language: {
    label: string;
    english: string;
    arabic: string;
    switchToEnglish: string;
    switchToArabic: string;
  };
};

export type FooterMessages = {
  description: string;
  columns: {
    platform: string;
    community: string;
    legal: string;
    discord: string;
  };
  links: {
    home: string;
    tournaments: string;
    leaderboard: string;
    news: string;
    community: string;
    about: string;
    rules: string;
    roles: string;
    staff: string;
    stats: string;
    terms: string;
    privacy: string;
    cookies: string;
  };
  discordDescription: string;
  joinDiscord: string;
  rights: string;
  developedBy: string;
};

export type I18nMessages = {
  navbar: NavigationMessages;
  footer: FooterMessages;
};

export const dictionaries: Record<Locale, I18nMessages> = {
  en: {
    navbar: {
      links: {
        home: "Home",
        tournaments: "Tournaments",
        leaderboard: "Leaderboard",
        news: "News",
        community: "Community",
        profile: "Profile",
        adminPanel: "Admin Panel",
        botDashboard: "Bot Dashboard",
      },
      actions: {
        login: "Login",
        logout: "Logout",
        joinDiscord: "Join Discord",
        menu: "Menu",
        close: "Close",
        cancel: "Cancel",
        confirmLogout: "Logout",
      },
      account: {
        signedIn: "Signed in",
        fallbackName: "Ascendra Player",
        logoutTitle: "Confirm logout",
        logoutDescription: "Are you sure you want to log out?",
      },
      language: {
        label: "Language",
        english: "English",
        arabic: "العربية",
        switchToEnglish: "Switch to English",
        switchToArabic: "التبديل إلى العربية",
      },
    },
    footer: {
      description:
        "A competitive gaming platform for tournaments, teams, rankings, and official community updates.",
      columns: {
        platform: "Platform",
        community: "Community",
        legal: "Legal",
        discord: "Discord",
      },
      links: {
        home: "Home",
        tournaments: "Tournaments",
        leaderboard: "Leaderboard",
        news: "News",
        community: "Community",
        about: "About",
        rules: "Rules",
        roles: "Roles",
        staff: "Staff",
        stats: "Stats",
        terms: "Terms",
        privacy: "Privacy Policy",
        cookies: "Cookie Policy",
      },
      discordDescription:
        "Follow tournaments, team updates, announcements, and community activity directly on Discord.",
      joinDiscord: "Join Discord",
      rights: "All rights reserved.",
      developedBy: "Developed by",
    },
  },

  ar: {
    navbar: {
      links: {
        home: "الرئيسية",
        tournaments: "البطولات",
        leaderboard: "لوحة المتصدرين",
        news: "الأخبار",
        community: "المجتمع",
        profile: "الملف الشخصي",
        adminPanel: "لوحة الإدارة",
        botDashboard: "لوحة البوت",
      },
      actions: {
        login: "تسجيل الدخول",
        logout: "تسجيل الخروج",
        joinDiscord: "انضم إلى Discord",
        menu: "القائمة",
        close: "إغلاق",
        cancel: "إلغاء",
        confirmLogout: "تسجيل الخروج",
      },
      account: {
        signedIn: "تم تسجيل الدخول",
        fallbackName: "لاعب Ascendra",
        logoutTitle: "تأكيد تسجيل الخروج",
        logoutDescription: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
      },
      language: {
        label: "اللغة",
        english: "English",
        arabic: "العربية",
        switchToEnglish: "Switch to English",
        switchToArabic: "التبديل إلى العربية",
      },
    },
    footer: {
      description:
        "منصة ألعاب تنافسية لإدارة البطولات والفرق ولوحة المتصدرين والتحديثات الرسمية للمجتمع.",
      columns: {
        platform: "المنصة",
        community: "المجتمع",
        legal: "قانوني",
        discord: "Discord",
      },
      links: {
        home: "الرئيسية",
        tournaments: "البطولات",
        leaderboard: "لوحة المتصدرين",
        news: "الأخبار",
        community: "المجتمع",
        about: "حول المنصة",
        rules: "القواعد",
        roles: "الأدوار",
        staff: "الفريق",
        stats: "الإحصائيات",
        terms: "شروط الاستخدام",
        privacy: "سياسة الخصوصية",
        cookies: "سياسة ملفات تعريف الارتباط",
      },
      discordDescription:
        "تابع البطولات وتحديثات الفرق والإعلانات ونشاط المجتمع مباشرة عبر Discord.",
      joinDiscord: "انضم إلى Discord",
      rights: "جميع الحقوق محفوظة.",
      developedBy: "تم التطوير بواسطة",
    },
  },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(localeCookieName)?.value;

  return isLocale(locale) ? locale : defaultLocale;
}

export function getDictionary(locale: Locale): I18nMessages {
  return dictionaries[locale] || dictionaries[defaultLocale];
}

export function getTextDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}
