import type { Locale } from "@/lib/i18n";

export type ProfileMessages = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    discordId: string;
    member: string;
    notMember: string;
    teams: string;
    team: string;
    points: string;
    invites: string;
    invite: string;
  };
  tabLabels: {
    overview: string;
    teams: string;
    history: string;
    matches: string;
    achievements: string;
    account: string;
  };
  sections: {
    invitations: string;
    teamInvitations: string;
    pendingInvitation: string;
    pendingInvitations: string;
    noPendingInvitations: string;
    myTeams: string;
    teamOverview: string;
    noTeamsTitle: string;
    noTeamsDescription: string;
    createTeam: string;
    startNewTeam: string;
    createTeamMeta: string;
    discordRequiredMeta: string;
    progress: string;
    tournamentHistory: string;
    noTournamentResults: string;
    performanceEyebrow: string;
    pointHistoryTitle: string;
    noTournamentData: string;
    recentMatchesEyebrow: string;
    matchHistoryTitle: string;
    noResultsYet: string;
    fullRecordEyebrow: string;
    tournamentHistoryTitle: string;
    achievementsEyebrow: string;
    achievementsTitle: string;
    comingSoon: string;
    comingSoonDesc: string;
    tableColTournament: string;
    tableColTeam: string;
    tableColPlace: string;
    tableColPts: string;
    tableColDate: string;
    noActivityDesc: string;
    browseTournaments: string;
    accountTitle: string;
    connectedAccountsDesc: string;
    discordAccountTitle: string;
    discordSubtitle: string;
    privacyTitle: string;
    privacyDesc: string;
    preferencesTitle: string;
    preferencesDesc: string;
    securityTitle: string;
    signOutDesc: string;
  };
  labels: {
    by: string;
    members: string;
    member: string;
    leader: string;
    open: string;
    accept: string;
    decline: string;
    teamName: string;
    teamNamePlaceholder: string;
    game: string;
    selectGame: string;
    teamGame: string;
    createTeam: string;
    ascendraDiscordRequired: string;
    discordRequiredDescription: string;
    results: string;
    result: string;
    best: string;
    pts: string;
    ptsLabel: string;
    discord: string;
    linkedAccounts: string;
    connectedGameAccounts: string;
    riotAccount: string;
    steamAccount: string;
    steamSubtitle: string;
    linked: string;
    connected: string;
    connect: string;
    unlink: string;
    unlinking: string;
    unlinkAccountConfirmTitle: string;
    unlinkAccountConfirmDescription: string;
    unlinkAccountConfirmButton: string;
    confirmationEyebrow: string;
    cancelLabel: string;
    faceitAccount: string;
    faceitSubtitle: string;
    faceitHelp: string;
    faceitConnectedHelp: string;
    faceitConnecting: string;
    faceitSkillLevel: string;
    faceitNicknamePlaceholder: string;
    acceptTitle: string;
    declineTitle: string;
    joinTeamTemplate: string;
    declineTeamTemplate: string;
    acceptingLabel: string;
    decliningLabel: string;
    creatingLabel: string;
    createTeamDialogTitle: string;
    createTeamDialogDesc: string;
    signOut: string;
  };
  statuses: {
    active: string;
    pending: string;
    rejected: string;
    member: string;
    notMember: string;
  };
  activeMatches: {
    heading: string;
    empty: string;
    tournament: string;
    yourTeam: string;
    opponent: string;
    scheduledTime: string;
    faceitRoom: string;
    available: string;
    notAvailableYet: string;
    checkedIn: string;
    notCheckedIn: string;
    openMatch: string;
    openFaceitRoom: string;
    tbd: string;
    round: string;
    match: string;
    browseTournaments: string;
  };
};

export const profileMessages: Record<Locale, ProfileMessages> = {
  en: {
    metadata: {
      title: "Profile ",
      description: "Manage your Ascendra profile, invitations, and teams.",
    },
    hero: {
      label: "Player profile",
      discordId: "Discord ID",
      member: "Member",
      notMember: "Not member",
      teams: "teams",
      team: "team",
      points: "Ranking points",
      invites: "invites",
      invite: "invite",
    },
    tabLabels: {
      overview: "Overview",
      teams: "Teams",
      history: "History",
      matches: "Matches",
      achievements: "Achievements",
      account: "Account",
    },
    sections: {
      invitations: "Invitations",
      teamInvitations: "Team invitations",
      pendingInvitation: "pending invitation",
      pendingInvitations: "pending invitations",
      noPendingInvitations: "No pending invitations.",
      myTeams: "My teams",
      teamOverview: "Team overview",
      noTeamsTitle: "No teams yet",
      noTeamsDescription: "Create your first team from the section below.",
      createTeam: "Create team",
      startNewTeam: "Start a new team",
      createTeamMeta: "Create a team for a specific game.",
      discordRequiredMeta: "Discord membership required.",
      progress: "Progress",
      tournamentHistory: "Tournament history",
      noTournamentResults: "No tournament results yet.",
      performanceEyebrow: "PERFORMANCE",
      pointHistoryTitle: "POINT HISTORY",
      noTournamentData: "No tournament data yet.",
      recentMatchesEyebrow: "RECENT MATCHES",
      matchHistoryTitle: "MATCH HISTORY",
      noResultsYet: "No results yet.",
      fullRecordEyebrow: "FULL RECORD",
      tournamentHistoryTitle: "TOURNAMENT HISTORY",
      achievementsEyebrow: "PLAYER ACHIEVEMENTS",
      achievementsTitle: "ACHIEVEMENTS",
      comingSoon: "COMING SOON",
      comingSoonDesc: "Achievements will be unlocked as you compete in tournaments.",
      tableColTournament: "Tournament",
      tableColTeam: "Team",
      tableColPlace: "Place",
      tableColPts: "PTS",
      tableColDate: "Date",
      noActivityDesc: "Compete in a tournament to start building your record.",
      browseTournaments: "Browse tournaments",
      accountTitle: "Account & Settings",
      connectedAccountsDesc: "Connect your gaming platforms to your Ascendra account.",
      discordAccountTitle: "Discord",
      discordSubtitle: "Login provider · Ascendra community",
      privacyTitle: "Privacy & Visibility",
      privacyDesc: "Control who can see your profile data.",
      preferencesTitle: "Preferences",
      preferencesDesc: "Language, appearance, and your profile link.",
      securityTitle: "Security",
      signOutDesc: "You are currently signed in on this device.",
    },
    labels: {
      by: "by",
      members: "members",
      member: "member",
      leader: "Leader",
      open: "Open",
      accept: "Accept",
      decline: "Decline",
      teamName: "Team name",
      teamNamePlaceholder: "Example: Ascendra Wolves",
      game: "Game",
      selectGame: "Select game",
      teamGame: "Team game",
      createTeam: "Create team",
      ascendraDiscordRequired: "Ascendra Discord required",
      discordRequiredDescription:
        "Join the Discord server and refresh your login to create or join teams.",
      results: "Results",
      result: "result",
      best: "Best",
      pts: "pts",
      ptsLabel: "PTS",
      discord: "Discord",
      linkedAccounts: "Linked Accounts",
      connectedGameAccounts: "Connected Game Accounts",
      riotAccount: "Riot Account",
      steamAccount: "Steam Account",
      steamSubtitle: "Dota 2 · Counter-Strike 2 · and more",
      linked: "Linked",
      connected: "Connected",
      connect: "Connect",
      unlink: "Unlink",
      unlinking: "Unlinking...",
      unlinkAccountConfirmTitle: "Unlink account?",
      unlinkAccountConfirmDescription:
        "Are you sure you want to unlink your {provider} account?",
      unlinkAccountConfirmButton: "Unlink account",
      confirmationEyebrow: "Confirmation",
      cancelLabel: "Cancel",
      faceitAccount: "FACEIT Account",
      faceitSubtitle: "Counter-Strike 2 account verification",
      faceitHelp:
        "Connect Steam first. FACEIT must belong to the same Steam account.",
      faceitConnectedHelp:
        "FACEIT is linked and verified against your Steam account.",
      faceitConnecting: "Connecting...",
      faceitSkillLevel: "Skill Level",
      faceitNicknamePlaceholder: "FACEIT nickname",
      acceptTitle: "Accept team invitation?",
      declineTitle: "Decline team invitation?",
      joinTeamTemplate: "Join {team}? You will become a member of this team.",
      declineTeamTemplate: "Decline the invitation to join {team}?",
      acceptingLabel: "Accepting...",
      decliningLabel: "Declining...",
      creatingLabel: "Creating...",
      createTeamDialogTitle: "Create team?",
      createTeamDialogDesc: "Create this team with the selected game. You will become the team leader.",
      signOut: "Sign out",
    },
    statuses: {
      active: "Active",
      pending: "Pending",
      rejected: "Rejected",
      member: "Member",
      notMember: "Not member",
    },
    activeMatches: {
      heading: "My active matches",
      empty: "You do not have active tournament matches yet.",
      tournament: "Tournament",
      yourTeam: "Your team",
      opponent: "Opponent",
      scheduledTime: "Scheduled time",
      faceitRoom: "FACEIT room",
      available: "Available",
      notAvailableYet: "Not available yet",
      checkedIn: "Checked in",
      notCheckedIn: "Not checked in",
      openMatch: "Open match",
      openFaceitRoom: "Open FACEIT room",
      tbd: "TBD",
      round: "Round",
      match: "Match",
      browseTournaments: "Browse tournaments",
    },
  },

  ar: {
    metadata: {
      title: "الملف الشخصي | Ascendra",
      description: "إدارة ملفك في Ascendra والدعوات والفرق.",
    },
    hero: {
      label: "الملف الشخصي للاعب",
      discordId: "معرّف Discord",
      member: "عضو",
      notMember: "غير عضو",
      teams: "فرق",
      team: "فريق",
      points: "نقاط التصنيف",
      invites: "دعوات",
      invite: "دعوة",
    },
    tabLabels: {
      overview: "نظرة عامة",
      teams: "الفرق",
      history: "السجل",
      matches: "المباريات",
      achievements: "الإنجازات",
      account: "الحساب",
    },
    sections: {
      invitations: "الدعوات",
      teamInvitations: "دعوات الفرق",
      pendingInvitation: "دعوة معلقة",
      pendingInvitations: "دعوات معلقة",
      noPendingInvitations: "لا توجد دعوات معلقة.",
      myTeams: "فرقي",
      teamOverview: "نظرة عامة على الفرق",
      noTeamsTitle: "لا توجد فرق بعد",
      noTeamsDescription: "أنشئ فريقك الأول من القسم الموجود بالأسفل.",
      createTeam: "إنشاء فريق",
      startNewTeam: "بدء فريق جديد",
      createTeamMeta: "أنشئ فريقًا للعبة محددة.",
      discordRequiredMeta: "عضوية Discord مطلوبة.",
      progress: "التقدم",
      tournamentHistory: "سجل البطولات",
      noTournamentResults: "لا توجد نتائج بطولات حاليًا.",
      performanceEyebrow: "الأداء",
      pointHistoryTitle: "سجل النقاط",
      noTournamentData: "لا توجد بيانات بطولات بعد.",
      recentMatchesEyebrow: "المباريات الأخيرة",
      matchHistoryTitle: "سجل المباريات",
      noResultsYet: "لا توجد نتائج بعد.",
      fullRecordEyebrow: "السجل الكامل",
      tournamentHistoryTitle: "سجل البطولات",
      achievementsEyebrow: "إنجازات اللاعب",
      achievementsTitle: "الإنجازات",
      comingSoon: "قريبًا",
      comingSoonDesc: "ستُفتح الإنجازات مع مشاركتك في البطولات.",
      tableColTournament: "البطولة",
      tableColTeam: "الفريق",
      tableColPlace: "المركز",
      tableColPts: "النقاط",
      tableColDate: "التاريخ",
      noActivityDesc: "شارك في بطولة لبدء بناء سجلك.",
      browseTournaments: "تصفح البطولات",
      accountTitle: "الحساب والإعدادات",
      connectedAccountsDesc: "اربط منصات الألعاب بحسابك في Ascendra.",
      discordAccountTitle: "Discord",
      discordSubtitle: "مزود تسجيل الدخول · مجتمع Ascendra",
      privacyTitle: "الخصوصية والظهور",
      privacyDesc: "تحكم في من يمكنه رؤية بيانات ملفك الشخصي.",
      preferencesTitle: "التفضيلات",
      preferencesDesc: "اللغة والمظهر ورابط ملفك الشخصي.",
      securityTitle: "الأمان",
      signOutDesc: "أنت مسجل الدخول حاليًا على هذا الجهاز.",
    },
    labels: {
      by: "بواسطة",
      members: "أعضاء",
      member: "عضو",
      leader: "القائد",
      open: "فتح",
      accept: "قبول",
      decline: "رفض",
      teamName: "اسم الفريق",
      teamNamePlaceholder: "مثال: Ascendra Wolves",
      game: "اللعبة",
      selectGame: "اختر اللعبة",
      teamGame: "لعبة الفريق",
      createTeam: "إنشاء فريق",
      ascendraDiscordRequired: "Discord الخاص بـ Ascendra مطلوب",
      discordRequiredDescription:
        "انضم إلى خادم Discord ثم حدّث تسجيل الدخول لإنشاء الفرق أو الانضمام إليها.",
      results: "النتائج",
      result: "نتيجة",
      best: "أفضل مركز",
      pts: "نقطة",
      ptsLabel: "نقطة",
      discord: "Discord",
      linkedAccounts: "الحسابات المرتبطة",
      connectedGameAccounts: "حسابات الألعاب المرتبطة",
      riotAccount: "حساب Riot",
      steamAccount: "حساب Steam",
      steamSubtitle: "Dota 2 · Counter-Strike 2 · والمزيد",
      linked: "تم الربط",
      connected: "مرتبط",
      connect: "ربط",
      unlink: "إلغاء الربط",
      unlinking: "جارٍ إلغاء الربط...",
      unlinkAccountConfirmTitle: "إلغاء ربط الحساب؟",
      unlinkAccountConfirmDescription:
        "هل أنت متأكد من إلغاء ربط حساب {provider}؟",
      unlinkAccountConfirmButton: "إلغاء الربط",
      confirmationEyebrow: "تأكيد",
      cancelLabel: "إلغاء",
      faceitAccount: "حساب FACEIT",
      faceitSubtitle: "التحقق من حساب Counter-Strike 2",
      faceitHelp:
        "اربط Steam أولًا قبل ربط FACEIT. يجب أن يكون حساب FACEIT مرتبطًا بنفس حساب Steam.",
      faceitConnectedHelp:
        "تم ربط FACEIT والتحقق من مطابقته مع حساب Steam.",
      faceitConnecting: "جارٍ الربط...",
      faceitSkillLevel: "المستوى",
      faceitNicknamePlaceholder: "اسم مستخدم FACEIT",
      acceptTitle: "قبول دعوة الفريق؟",
      declineTitle: "رفض دعوة الفريق؟",
      joinTeamTemplate: "الانضمام إلى {team}؟ ستصبح عضوًا في هذا الفريق.",
      declineTeamTemplate: "رفض دعوة الانضمام إلى {team}؟",
      acceptingLabel: "جارٍ القبول...",
      decliningLabel: "جارٍ الرفض...",
      creatingLabel: "جارٍ الإنشاء...",
      createTeamDialogTitle: "إنشاء فريق؟",
      createTeamDialogDesc: "إنشاء هذا الفريق مع اللعبة المختارة. ستصبح قائد الفريق.",
      signOut: "تسجيل الخروج",
    },
    statuses: {
      active: "نشط",
      pending: "قيد المراجعة",
      rejected: "مرفوض",
      member: "عضو",
      notMember: "غير عضو",
    },
    activeMatches: {
      heading: "مبارياتي النشطة",
      empty: "لا توجد لديك مباريات نشطة حاليًا.",
      tournament: "البطولة",
      yourTeam: "فريقك",
      opponent: "الخصم",
      scheduledTime: "وقت المباراة",
      faceitRoom: "غرفة FACEIT",
      available: "متوفرة",
      notAvailableYet: "غير متوفرة بعد",
      checkedIn: "تم تسجيل الحضور",
      notCheckedIn: "لم يتم تسجيل الحضور",
      openMatch: "فتح المباراة",
      openFaceitRoom: "فتح غرفة FACEIT",
      tbd: "غير محدد",
      round: "جولة",
      match: "مباراة",
      browseTournaments: "تصفح البطولات",
    },
  },
};
