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
  search: {
    label: string;
    placeholder: string;
    loading: string;
    noResults: string;
    error: string;
    types: {
      tournament: string;
      announcement: string;
      rule: string;
      role: string;
      staff: string;
      team: string;
      player: string;
    };
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

export type HomeMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
  };
  statuses: {
    tournamentOpen: string;
    tournamentClosed: string;
    registrationOpen: string;
    registrationClosed: string;
    upcoming: string;
    ended: string;
    cancelled: string;
  };
  tournaments: {
    label: string;
    title: string;
    description: string;
    empty: string;
    viewAll: string;
    viewDetails: string;
    approved: string;
    applicationSubmitted: string;
    applicationsSubmitted: string;
  };
  flow: {
    label: string;
    title: string;
    description: string;
    steps: {
      title: string;
      description: string;
    }[];
  };
  playerHub: {
    label: string;
    loggedInTitle: string;
    guestTitle: string;
    loggedInDescription: string;
    guestDescription: string;
    openProfile: string;
    loginWithDiscord: string;
    viewTournaments: string;
    stats: {
      teams: string;
      invites: string;
      entries: string;
      points: string;
      results: string;
      best: string;
    };
  };
};

export type CommunityMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
  };
  stats: {
    rules: string;
    roles: string;
    staff: string;
    tournaments: string;
    results: string;
  };
  directory: {
    label: string;
    title: string;
    open: string;
    links: {
      href: string;
      label: string;
      title: string;
      description: string;
    }[];
  };
  flow: {
    label: string;
    title: string;
    steps: {
      number: string;
      title: string;
      description: string;
    }[];
  };
  quickAccess: {
    label: string;
    title: string;
    description: string;
    profile: string;
    leaderboard: string;
  };
};

export type NewsMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    title: string;
    description: string;
  };
  stats: {
    published: string;
    important: string;
    categories: string;
  };
  labels: {
    featured: string;
    important: string;
    latest: string;
    publishedAnnouncements: string;
    noOtherAnnouncements: string;
  };
  empty: {
    title: string;
    description: string;
  };
};

export type TournamentsMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    title: string;
    description: string;
  };
  statuses: {
    tournamentOpen: string;
    tournamentClosed: string;
    registrationOpen: string;
    registrationClosed: string;
    upcoming: string;
    ended: string;
    cancelled: string;
  };
  stats: {
    tournaments: string;
    open: string;
    applications: string;
    approved: string;
  };
  sections: {
    active: string;
    archive: string;
  };
  labels: {
    tournamentSingular: string;
    tournamentPlural: string;
    approved: string;
    prize: string;
    team: string;
    slotLeft: string;
    slotsLeft: string;
    application: string;
    applications: string;
    resultSaved: string;
    resultsSaved: string;
    details: string;
    currentlyAccept: string;
    currentlyAcceptPlural: string;
  };
  empty: {
    noTournamentsTitle: string;
    noTournamentsDescription: string;
    noActive: string;
    noArchived: string;
  };
};

export type LeaderboardMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    title: string;
    description: string;
  };
  types: {
    playerRanking: string;
    teamRanking: string;
  };
  filters: {
    overall: string;
  };
  headings: {
    players: string;
    teams: string;
    overallStandings: string;
    gameStandings: string;
    rankedBy: string;
  };
  stats: {
    players: string;
    teams: string;
    totalPoints: string;
    results: string;
    topPlayer: string;
    topTeam: string;
  };
  table: {
    playerRanking: string;
    teamRanking: string;
    standings: string;
    rank: string;
    player: string;
    team: string;
    role: string;
    game: string;
    leader: string;
    members: string;
    results: string;
    best: string;
    points: string;
    ledBy: string;
    noRankedPlayers: string;
    noRankedTeams: string;
    resultSingular: string;
    resultPlural: string;
    memberSingular: string;
    memberPlural: string;
    pointsSuffix: string;
  };
  empty: {
    title: string;
    overallDescription: string;
    gameDescription: string;
    action: string;
  };
  fallback: {
    unknownPlayer: string;
    none: string;
  };
};
export type TournamentDetailsMessages = {
  metadata: {
    title: string;
    description: string;
  };
  statuses: {
    open: string;
    upcoming: string;
    closed: string;
    ended: string;
    cancelled: string;
    registrationOpen: string;
    registrationClosed: string;
    registered: string;
    approved: string;
    rejected: string;
  };
  labels: {
    backToTournaments: string;
    date: string;
    prize: string;
    team: string;
    slotsLeft: string;
    approved: string;
    applicationSubmitted: string;
    applicationsSubmitted: string;
    registration: string;
    registerYourTeam: string;
    teams: string;
    applications: string;
    noTeamsRegistered: string;
    players: string;
    player: string;
    results: string;
    finalStandings: string;
    points: string;
    unavailableReasons: {
      wrongGame: string;
      needsMorePlayer: string;
      needsMorePlayers: string;
      pendingInvites: string;
      notEligible: string;
    };
  };
  panel: {
    chooseTeam: string;
    selectTeam: string;
    registering: string;
    registerTeam: string;
    cancelling: string;
    cancelRegistration: string;
    confirmation: string;
    cancelRegistrationTitle: string;
    cancelRegistrationDescription: string;
    keepRegistration: string;
    currentRegistrationStatus: string;
    approvedByAdmin: string;
    tournamentEnded: string;
    tournamentEndedDescription: string;
    loginRequired: string;
    loginRequiredDescription: string;
    loginWithDiscord: string;
    discordRequired: string;
    discordRequiredDescription: string;
    joinDiscord: string;
    discordInviteNotConfigured: string;
    refreshLogin: string;
    registrationClosed: string;
    registrationClosedDescription: string;
    tournamentFull: string;
    tournamentFullDescription: string;
    noEligibleTeams: string;
    noEligibleTeamsDescription: string;
    manageTeams: string;
    unavailableTeams: string;
    requirements: string;
    requirementSameGame: string;
    requirementAtLeast: string;
    requirementNoPending: string;
    tournamentStatus: string;
  };
};

export type I18nMessages = {
  navbar: NavigationMessages;
  footer: FooterMessages;
  home: HomeMessages;
  community: CommunityMessages;
  news: NewsMessages;
  tournaments: TournamentsMessages;
  leaderboard: LeaderboardMessages;
  tournamentDetails: TournamentDetailsMessages;
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
      search: {
        label: "Search",
        placeholder: "Search tournaments, teams, players...",
        loading: "Searching...",
        noResults: "No matching results.",
        error: "Search is unavailable.",
        types: {
          tournament: "Tournament",
          announcement: "News",
          rule: "Rule",
          role: "Role",
          staff: "Staff",
          team: "Team",
          player: "Player",
        },
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

    home: {
      metadata: {
        title: "Ascendra",
        description: "Ascendra competitive gaming and tournament platform.",
      },
      hero: {
        label: "Ascendra tournament platform",
        title: "Compete in organized tournaments.",
        description:
          "Create teams, register for events, and track official results through one clean competitive platform.",
        primary: "Explore tournaments",
        secondary: "Create a team",
      },
      statuses: {
        tournamentOpen: "Tournament open",
        tournamentClosed: "Tournament closed",
        registrationOpen: "Registration open",
        registrationClosed: "Registration closed",
        upcoming: "Upcoming",
        ended: "Ended",
        cancelled: "Cancelled",
      },
      tournaments: {
        label: "Tournaments",
        title: "Latest tournaments",
        description:
          "Browse current events, check available approved slots, and open details before registering.",
        empty: "No tournaments available yet.",
        viewAll: "View all tournaments",
        viewDetails: "View details",
        approved: "approved",
        applicationSubmitted: "application submitted.",
        applicationsSubmitted: "applications submitted.",
      },
      flow: {
        label: "Flow",
        title: "Simple competition workflow",
        description:
          "From creating a team to earning official tournament points.",
        steps: [
          {
            title: "Create team",
            description: "Build your roster and invite players.",
          },
          {
            title: "Register",
            description: "Enter eligible teams into open tournaments.",
          },
          {
            title: "Admin review",
            description: "Applications are reviewed before approval.",
          },
          {
            title: "Compete",
            description: "Play official events with confirmed teams.",
          },
          {
            title: "Earn points",
            description: "Results update rankings and history.",
          },
        ],
      },
      playerHub: {
        label: "Player hub",
        loggedInTitle: "Your activity in one place.",
        guestTitle: "Teams, entries, and results.",
        loggedInDescription:
          "Open your profile to manage teams, invitations, registrations, and tournament history.",
        guestDescription:
          "Login with Discord to create teams, register for tournaments, and follow your progress.",
        openProfile: "Open profile",
        loginWithDiscord: "Login with Discord",
        viewTournaments: "View tournaments",
        stats: {
          teams: "Teams",
          invites: "Invites",
          entries: "Entries",
          points: "Points",
          results: "Results",
          best: "Best",
        },
      },
    },

    community: {
      metadata: {
        title: "Community | Ascendra",
        description: "Ascendra community hub.",
      },
      hero: {
        label: "Ascendra community",
        title: "Community hub",
        description:
          "Everything around the Ascendra community in one clean place: purpose, rules, roles, staff, and platform activity.",
        primary: "View tournaments",
        secondary: "Read rules",
      },
      stats: {
        rules: "Rules",
        roles: "Roles",
        staff: "Staff",
        tournaments: "Tournaments",
        results: "Results",
      },
      directory: {
        label: "Directory",
        title: "Community pages",
        open: "Open",
        links: [
          {
            href: "/about",
            label: "About",
            title: "Platform purpose",
            description:
              "Learn what Ascendra is built for and how the platform supports organized competitive play.",
          },
          {
            href: "/rules",
            label: "Rules",
            title: "Community rules",
            description:
              "Read the active rules that keep tournaments and community activity fair and clear.",
          },
          {
            href: "/roles",
            label: "Roles",
            title: "Public roles",
            description:
              "View the roles used inside the community and understand what each role means.",
          },
          {
            href: "/staff",
            label: "Staff",
            title: "Staff team",
            description:
              "See the people helping manage Ascendra, events, and community operations.",
          },
          {
            href: "/stats",
            label: "Stats",
            title: "Platform stats",
            description:
              "Follow useful numbers from tournaments, results, rankings, and game activity.",
          },
        ],
      },
      flow: {
        label: "How it works",
        title: "Clean community flow",
        steps: [
          {
            number: "01",
            title: "Join",
            description:
              "Login with Discord and connect your Ascendra profile.",
          },
          {
            number: "02",
            title: "Team up",
            description: "Create or join a team and prepare for tournaments.",
          },
          {
            number: "03",
            title: "Register",
            description: "Submit a team application for open tournaments.",
          },
          {
            number: "04",
            title: "Compete",
            description: "Play approved events and earn official points.",
          },
        ],
      },
      quickAccess: {
        label: "Quick access",
        title: "Ready to compete?",
        description:
          "Open tournaments, create your team, and follow rankings from the same platform.",
        profile: "Open profile",
        leaderboard: "Leaderboard",
      },
    },

    news: {
      metadata: {
        title: "News | Ascendra",
        description: "Ascendra announcements and updates.",
      },
      hero: {
        label: "Ascendra updates",
        title: "News",
        description:
          "Official announcements, tournament updates, and community notes.",
      },
      stats: {
        published: "Published",
        important: "Important",
        categories: "Categories",
      },
      labels: {
        featured: "Featured update",
        important: "Important",
        latest: "Latest updates",
        publishedAnnouncements: "Published announcements",
        noOtherAnnouncements: "No other announcements published.",
      },
      empty: {
        title: "No announcements yet",
        description: "Published announcements will appear here.",
      },
    },

    tournaments: {
      metadata: {
        title: "Tournaments | Ascendra",
        description: "Ascendra tournaments and events.",
      },
      hero: {
        label: "Ascendra events",
        title: "Tournaments",
        description:
          "Register, follow active events, and view completed tournament history.",
      },
      statuses: {
        tournamentOpen: "Tournament open",
        tournamentClosed: "Tournament closed",
        registrationOpen: "Registration open",
        registrationClosed: "Registration closed",
        upcoming: "Upcoming",
        ended: "Ended",
        cancelled: "Cancelled",
      },
      stats: {
        tournaments: "Tournaments",
        open: "Open",
        applications: "Applications",
        approved: "Approved",
      },
      sections: {
        active: "Active tournaments",
        archive: "Tournament archive",
      },
      labels: {
        tournamentSingular: "tournament",
        tournamentPlural: "tournaments",
        approved: "approved",
        prize: "Prize",
        team: "Team",
        slotLeft: "slot left",
        slotsLeft: "slots left",
        application: "application",
        applications: "applications",
        resultSaved: "result saved",
        resultsSaved: "results saved",
        details: "Details",
        currentlyAccept: "tournament currently accepts team applications.",
        currentlyAcceptPlural:
          "tournaments currently accept team applications.",
      },
      empty: {
        noTournamentsTitle: "No tournaments yet",
        noTournamentsDescription:
          "Events will appear here when they are published.",
        noActive: "No active tournaments right now.",
        noArchived: "No archived tournaments yet.",
      },
    },

    leaderboard: {
      metadata: {
        title: "Leaderboard | Ascendra",
        description: "Ascendra tournament points and standings.",
      },
      hero: {
        label: "Competitive standings",
        title: "Leaderboard",
        description:
          "Track the strongest players and teams by official tournament points.",
      },
      types: {
        playerRanking: "Player ranking",
        teamRanking: "Team ranking",
      },
      filters: {
        overall: "Overall",
      },
      headings: {
        players: "Players",
        teams: "Teams",
        overallStandings: "Overall standings",
        gameStandings: "standings",
        rankedBy: "Ranked by points, results, then best placement.",
      },
      stats: {
        players: "Players",
        teams: "Teams",
        totalPoints: "Total points",
        results: "Results",
        topPlayer: "Top player",
        topTeam: "Top team",
      },
      table: {
        playerRanking: "Player ranking",
        teamRanking: "Team ranking",
        standings: "Standings",
        rank: "Rank",
        player: "Player",
        team: "Team",
        role: "Role",
        game: "Game",
        leader: "Leader",
        members: "Members",
        results: "Results",
        best: "Best",
        points: "Points",
        ledBy: "Led by",
        noRankedPlayers: "No ranked players yet.",
        noRankedTeams: "No ranked teams yet.",
        resultSingular: "result",
        resultPlural: "results",
        memberSingular: "member",
        memberPlural: "members",
        pointsSuffix: "pts",
      },
      empty: {
        title: "No tournament points yet",
        overallDescription:
          "Rankings will appear here when official results are added.",
        gameDescription: "No points have been awarded for this game yet.",
        action: "View tournaments",
      },
      fallback: {
        unknownPlayer: "Unknown player",
        none: "-",
      },
    },

    tournamentDetails: {
      metadata: {
        title: "Tournament Details | Ascendra",
        description: "Tournament details and registration.",
      },
      statuses: {
        open: "Open",
        upcoming: "Upcoming",
        closed: "Closed",
        ended: "Ended",
        cancelled: "Cancelled",
        registrationOpen: "Registration open",
        registrationClosed: "Registration closed",
        registered: "Waiting review",
        approved: "Approved",
        rejected: "Rejected",
      },
      labels: {
        backToTournaments: "Back to tournaments",
        date: "Date",
        prize: "Prize",
        team: "Team",
        slotsLeft: "Slots left",
        approved: "approved",
        applicationSubmitted: "application submitted.",
        applicationsSubmitted: "applications submitted.",
        registration: "Registration",
        registerYourTeam: "Register your team",
        teams: "Teams",
        applications: "Applications",
        noTeamsRegistered: "No teams registered yet.",
        players: "players",
        player: "player",
        results: "Results",
        finalStandings: "Final standings",
        points: "points",
        unavailableReasons: {
          wrongGame: "Wrong game",
          needsMorePlayer: "Needs 1 more player",
          needsMorePlayers: "Needs {count} more players",
          pendingInvites: "Pending invites",
          notEligible: "Not eligible",
        },
      },
      panel: {
        chooseTeam: "Choose team",
        selectTeam: "Select team",
        registering: "Registering...",
        registerTeam: "Register team",
        cancelling: "Cancelling...",
        cancelRegistration: "Cancel registration",
        confirmation: "Confirmation",
        cancelRegistrationTitle: "Cancel registration?",
        cancelRegistrationDescription: "Cancel {teamName}'s registration?",
        keepRegistration: "Keep registration",
        currentRegistrationStatus: "Current registration status",
        approvedByAdmin:
          "Approved by admin. Contact an admin if changes are needed.",
        tournamentEnded: "Tournament ended",
        tournamentEndedDescription:
          "Registration is closed for this tournament.",
        loginRequired: "Login required",
        loginRequiredDescription: "Login with Discord to register a team.",
        loginWithDiscord: "Login with Discord",
        discordRequired: "Discord membership required",
        discordRequiredDescription:
          "Join Ascendra Discord and refresh your login.",
        joinDiscord: "Join Discord",
        discordInviteNotConfigured: "Discord invite not configured",
        refreshLogin: "Refresh login",
        registrationClosed: "Registration closed",
        registrationClosedDescription:
          "This tournament is not accepting registrations.",
        tournamentFull: "Tournament full",
        tournamentFullDescription: "Approved slots are full.",
        noEligibleTeams: "No eligible teams",
        noEligibleTeamsDescription: "No team is ready for this tournament.",
        manageTeams: "Manage teams",
        unavailableTeams: "Unavailable teams",
        requirements: "Requirements",
        requirementSameGame: "Same game as the tournament.",
        requirementAtLeast: "At least {count} player(s).",
        requirementNoPending: "No pending team invites.",
        tournamentStatus: "Tournament status",
      },
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
      search: {
        label: "البحث",
        placeholder: "ابحث في البطولات والفرق واللاعبين...",
        loading: "جار البحث...",
        noResults: "لا توجد نتائج مطابقة.",
        error: "تعذر تحميل نتائج البحث.",
        types: {
          tournament: "بطولة",
          announcement: "خبر",
          rule: "قاعدة",
          role: "دور",
          staff: "فريق العمل",
          team: "فريق",
          player: "لاعب",
        },
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

    home: {
      metadata: {
        title: "Ascendra",
        description: "منصة Ascendra للألعاب التنافسية وإدارة البطولات.",
      },
      hero: {
        label: "منصة Ascendra للبطولات",
        title: "نافس ضمن بطولات منظّمة.",
        description:
          "أنشئ فريقك، سجّل في البطولات، وتابع النتائج الرسمية من خلال منصة تنافسية واضحة واحترافية.",
        primary: "استكشف البطولات",
        secondary: "إنشاء فريق",
      },
      statuses: {
        tournamentOpen: "البطولة مفتوحة",
        tournamentClosed: "البطولة مغلقة",
        registrationOpen: "التسجيل مفتوح",
        registrationClosed: "التسجيل مغلق",
        upcoming: "قادمة",
        ended: "منتهية",
        cancelled: "ملغاة",
      },
      tournaments: {
        label: "البطولات",
        title: "أحدث البطولات",
        description:
          "تصفّح البطولات الحالية، راجع عدد المقاعد المقبولة، وافتح التفاصيل قبل التسجيل.",
        empty: "لا توجد بطولات متاحة حاليًا.",
        viewAll: "عرض جميع البطولات",
        viewDetails: "عرض التفاصيل",
        approved: "مقبول",
        applicationSubmitted: "طلب تم إرساله.",
        applicationsSubmitted: "طلبات تم إرسالها.",
      },
      flow: {
        label: "آلية المشاركة",
        title: "مسار تنافسي واضح وبسيط",
        description: "من إنشاء الفريق إلى كسب النقاط الرسمية في البطولات.",
        steps: [
          {
            title: "إنشاء فريق",
            description: "كوّن قائمتك وادعُ اللاعبين للانضمام إلى فريقك.",
          },
          {
            title: "التسجيل",
            description: "سجّل الفرق المؤهلة في البطولات المفتوحة.",
          },
          {
            title: "مراجعة الإدارة",
            description: "تتم مراجعة طلبات المشاركة قبل الموافقة النهائية.",
          },
          {
            title: "المنافسة",
            description: "شارك في الأحداث الرسمية مع الفرق المؤكدة.",
          },
          {
            title: "كسب النقاط",
            description: "تُحدّث النتائج لوحة المتصدرين وسجل المشاركات.",
          },
        ],
      },
      playerHub: {
        label: "مركز اللاعب",
        loggedInTitle: "نشاطك في مكان واحد.",
        guestTitle: "الفرق، التسجيلات، والنتائج.",
        loggedInDescription:
          "افتح ملفك الشخصي لإدارة الفرق والدعوات والتسجيلات وسجل البطولات.",
        guestDescription:
          "سجّل الدخول عبر Discord لإنشاء الفرق والتسجيل في البطولات ومتابعة تقدمك.",
        openProfile: "فتح الملف الشخصي",
        loginWithDiscord: "تسجيل الدخول عبر Discord",
        viewTournaments: "عرض البطولات",
        stats: {
          teams: "الفرق",
          invites: "الدعوات",
          entries: "التسجيلات",
          points: "النقاط",
          results: "النتائج",
          best: "أفضل مركز",
        },
      },
    },

    community: {
      metadata: {
        title: "المجتمع | Ascendra",
        description: "مركز مجتمع Ascendra.",
      },
      hero: {
        label: "مجتمع Ascendra",
        title: "مركز المجتمع",
        description:
          "كل ما يتعلق بمجتمع Ascendra في مكان واحد: هدف المنصة، القواعد، الأدوار، الفريق، ونشاط المنصة.",
        primary: "عرض البطولات",
        secondary: "قراءة القواعد",
      },
      stats: {
        rules: "القواعد",
        roles: "الأدوار",
        staff: "الفريق",
        tournaments: "البطولات",
        results: "النتائج",
      },
      directory: {
        label: "الدليل",
        title: "صفحات المجتمع",
        open: "فتح",
        links: [
          {
            href: "/about",
            label: "حول",
            title: "هدف المنصة",
            description:
              "تعرّف على فكرة Ascendra وكيف تدعم المنصة المنافسات المنظمة.",
          },
          {
            href: "/rules",
            label: "القواعد",
            title: "قواعد المجتمع",
            description:
              "اطّلع على القواعد النشطة التي تحافظ على عدالة البطولات ووضوح نشاط المجتمع.",
          },
          {
            href: "/roles",
            label: "الأدوار",
            title: "الأدوار العامة",
            description:
              "تعرّف على الأدوار المستخدمة داخل المجتمع ومعنى كل دور.",
          },
          {
            href: "/staff",
            label: "الفريق",
            title: "فريق الإدارة",
            description:
              "تعرّف على الأشخاص الذين يساعدون في إدارة Ascendra والفعاليات والمجتمع.",
          },
          {
            href: "/stats",
            label: "الإحصائيات",
            title: "إحصائيات المنصة",
            description:
              "تابع أرقامًا مفيدة حول البطولات والنتائج والترتيب ونشاط الألعاب.",
          },
        ],
      },
      flow: {
        label: "كيف تعمل المنصة",
        title: "مسار مجتمع واضح",
        steps: [
          {
            number: "01",
            title: "انضم",
            description: "سجّل الدخول عبر Discord واربط ملفك بمنصة Ascendra.",
          },
          {
            number: "02",
            title: "كوّن فريقك",
            description: "أنشئ فريقًا أو انضم إلى فريق واستعد للبطولات.",
          },
          {
            number: "03",
            title: "سجّل",
            description: "أرسل طلب مشاركة الفريق في البطولات المفتوحة.",
          },
          {
            number: "04",
            title: "نافس",
            description: "شارك في الأحداث المقبولة واكسب النقاط الرسمية.",
          },
        ],
      },
      quickAccess: {
        label: "وصول سريع",
        title: "جاهز للمنافسة؟",
        description:
          "افتح البطولات، أنشئ فريقك، وتابع لوحة المتصدرين من نفس المنصة.",
        profile: "فتح الملف الشخصي",
        leaderboard: "لوحة المتصدرين",
      },
    },

    news: {
      metadata: {
        title: "الأخبار | Ascendra",
        description: "إعلانات وتحديثات Ascendra.",
      },
      hero: {
        label: "تحديثات Ascendra",
        title: "الأخبار",
        description: "الإعلانات الرسمية، تحديثات البطولات، وملاحظات المجتمع.",
      },
      stats: {
        published: "المنشور",
        important: "المهم",
        categories: "التصنيفات",
      },
      labels: {
        featured: "تحديث مميز",
        important: "مهم",
        latest: "آخر التحديثات",
        publishedAnnouncements: "الإعلانات المنشورة",
        noOtherAnnouncements: "لا توجد إعلانات أخرى منشورة.",
      },
      empty: {
        title: "لا توجد إعلانات حاليًا",
        description: "ستظهر الإعلانات المنشورة هنا.",
      },
    },

    tournaments: {
      metadata: {
        title: "البطولات | Ascendra",
        description: "بطولات وفعاليات Ascendra.",
      },
      hero: {
        label: "فعاليات Ascendra",
        title: "البطولات",
        description:
          "سجّل في البطولات، تابع الفعاليات النشطة، واستعرض سجل البطولات المكتملة.",
      },
      statuses: {
        tournamentOpen: "البطولة مفتوحة",
        tournamentClosed: "البطولة مغلقة",
        registrationOpen: "التسجيل مفتوح",
        registrationClosed: "التسجيل مغلق",
        upcoming: "قادمة",
        ended: "منتهية",
        cancelled: "ملغاة",
      },
      stats: {
        tournaments: "البطولات",
        open: "المفتوحة",
        applications: "الطلبات",
        approved: "المقبولة",
      },
      sections: {
        active: "البطولات النشطة",
        archive: "أرشيف البطولات",
      },
      labels: {
        tournamentSingular: "بطولة",
        tournamentPlural: "بطولات",
        approved: "مقبول",
        prize: "الجائزة",
        team: "الفريق",
        slotLeft: "مقعد متبقٍ",
        slotsLeft: "مقاعد متبقية",
        application: "طلب",
        applications: "طلبات",
        resultSaved: "نتيجة محفوظة",
        resultsSaved: "نتائج محفوظة",
        details: "التفاصيل",
        currentlyAccept: "بطولة تقبل طلبات الفرق حاليًا.",
        currentlyAcceptPlural: "بطولات تقبل طلبات الفرق حاليًا.",
      },
      empty: {
        noTournamentsTitle: "لا توجد بطولات حاليًا",
        noTournamentsDescription: "ستظهر الفعاليات هنا عند نشرها.",
        noActive: "لا توجد بطولات نشطة حاليًا.",
        noArchived: "لا توجد بطولات مؤرشفة حاليًا.",
      },
    },

    leaderboard: {
      metadata: {
        title: "لوحة المتصدرين | Ascendra",
        description: "نقاط وترتيب بطولات Ascendra.",
      },
      hero: {
        label: "الترتيب التنافسي",
        title: "لوحة المتصدرين",
        description:
          "تابع أقوى اللاعبين والفرق حسب النقاط الرسمية في البطولات.",
      },
      types: {
        playerRanking: "ترتيب اللاعبين",
        teamRanking: "ترتيب الفرق",
      },
      filters: {
        overall: "الإجمالي",
      },
      headings: {
        players: "اللاعبون",
        teams: "الفرق",
        overallStandings: "الترتيب العام",
        gameStandings: "ترتيب",
        rankedBy: "يتم الترتيب حسب النقاط، ثم النتائج، ثم أفضل مركز.",
      },
      stats: {
        players: "اللاعبون",
        teams: "الفرق",
        totalPoints: "إجمالي النقاط",
        results: "النتائج",
        topPlayer: "أفضل لاعب",
        topTeam: "أفضل فريق",
      },
      table: {
        playerRanking: "ترتيب اللاعبين",
        teamRanking: "ترتيب الفرق",
        standings: "الترتيب",
        rank: "المركز",
        player: "اللاعب",
        team: "الفريق",
        role: "الدور",
        game: "اللعبة",
        leader: "القائد",
        members: "الأعضاء",
        results: "النتائج",
        best: "أفضل",
        points: "النقاط",
        ledBy: "بقيادة",
        noRankedPlayers: "لا يوجد لاعبون في الترتيب حاليًا.",
        noRankedTeams: "لا توجد فرق في الترتيب حاليًا.",
        resultSingular: "نتيجة",
        resultPlural: "نتائج",
        memberSingular: "عضو",
        memberPlural: "أعضاء",
        pointsSuffix: "نقطة",
      },
      empty: {
        title: "لا توجد نقاط بطولات حاليًا",
        overallDescription: "سيظهر الترتيب هنا عند إضافة النتائج الرسمية.",
        gameDescription: "لم يتم منح أي نقاط لهذه اللعبة حتى الآن.",
        action: "عرض البطولات",
      },
      fallback: {
        unknownPlayer: "لاعب غير معروف",
        none: "-",
      },
    },
    tournamentDetails: {
      metadata: {
        title: "تفاصيل البطولة | Ascendra",
        description: "تفاصيل البطولة والتسجيل.",
      },
      statuses: {
        open: "مفتوحة",
        upcoming: "قادمة",
        closed: "مغلقة",
        ended: "منتهية",
        cancelled: "ملغاة",
        registrationOpen: "التسجيل مفتوح",
        registrationClosed: "التسجيل مغلق",
        registered: "بانتظار المراجعة",
        approved: "مقبول",
        rejected: "مرفوض",
      },
      labels: {
        backToTournaments: "العودة إلى البطولات",
        date: "التاريخ",
        prize: "الجائزة",
        team: "الفريق",
        slotsLeft: "المقاعد المتبقية",
        approved: "مقبول",
        applicationSubmitted: "طلب تم إرساله.",
        applicationsSubmitted: "طلبات تم إرسالها.",
        registration: "التسجيل",
        registerYourTeam: "تسجيل فريقك",
        teams: "الفرق",
        applications: "طلبات المشاركة",
        noTeamsRegistered: "لا توجد فرق مسجلة حاليًا.",
        players: "لاعبين",
        player: "لاعب",
        results: "النتائج",
        finalStandings: "الترتيب النهائي",
        points: "نقطة",
        unavailableReasons: {
          wrongGame: "اللعبة غير مطابقة",
          needsMorePlayer: "يحتاج إلى لاعب إضافي واحد",
          needsMorePlayers: "يحتاج إلى {count} لاعبين إضافيين",
          pendingInvites: "توجد دعوات معلقة",
          notEligible: "غير مؤهل",
        },
      },
      panel: {
        chooseTeam: "اختر الفريق",
        selectTeam: "اختر فريقًا",
        registering: "جارٍ التسجيل...",
        registerTeam: "تسجيل الفريق",
        cancelling: "جارٍ الإلغاء...",
        cancelRegistration: "إلغاء التسجيل",
        confirmation: "تأكيد",
        cancelRegistrationTitle: "إلغاء التسجيل؟",
        cancelRegistrationDescription: "هل تريد إلغاء تسجيل فريق {teamName}؟",
        keepRegistration: "الإبقاء على التسجيل",
        currentRegistrationStatus: "حالة التسجيل الحالية",
        approvedByAdmin:
          "تمت الموافقة من الإدارة. تواصل مع الإدارة إذا كانت هناك حاجة إلى تعديل.",
        tournamentEnded: "انتهت البطولة",
        tournamentEndedDescription: "التسجيل مغلق لهذه البطولة.",
        loginRequired: "تسجيل الدخول مطلوب",
        loginRequiredDescription: "سجّل الدخول عبر Discord لتسجيل فريق.",
        loginWithDiscord: "تسجيل الدخول عبر Discord",
        discordRequired: "عضوية Discord مطلوبة",
        discordRequiredDescription:
          "انضم إلى Discord الخاص بـ Ascendra ثم حدّث تسجيل الدخول.",
        joinDiscord: "انضم إلى Discord",
        discordInviteNotConfigured: "رابط دعوة Discord غير مفعّل",
        refreshLogin: "تحديث تسجيل الدخول",
        registrationClosed: "التسجيل مغلق",
        registrationClosedDescription: "هذه البطولة لا تقبل تسجيلات حاليًا.",
        tournamentFull: "البطولة ممتلئة",
        tournamentFullDescription: "جميع المقاعد المقبولة ممتلئة.",
        noEligibleTeams: "لا توجد فرق مؤهلة",
        noEligibleTeamsDescription: "لا يوجد فريق جاهز لهذه البطولة.",
        manageTeams: "إدارة الفرق",
        unavailableTeams: "الفرق غير المتاحة",
        requirements: "المتطلبات",
        requirementSameGame: "يجب أن تكون لعبة الفريق مطابقة للبطولة.",
        requirementAtLeast: "يجب أن يحتوي الفريق على {count} لاعب على الأقل.",
        requirementNoPending: "يجب ألا توجد دعوات فريق معلقة.",
        tournamentStatus: "حالة البطولة",
      },
    },
  },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function getDictionary(locale: Locale): I18nMessages {
  return dictionaries[locale] || dictionaries[defaultLocale];
}

export function getTextDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}
