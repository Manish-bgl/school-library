export const T = {
  dark: {
    bg: "bg-[#070b12]",
    sidebar: "bg-[#0b0f1a]",
    card: "bg-[#0f1623]",
    border: "border-white/8",
    text: "text-white",
    sub: "text-gray-400",
    muted: "text-gray-600",
    hover: "hover:bg-white/5",
    inp: "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-amber-500/60",
    th: "bg-white/3 text-gray-400",
    tr: "border-white/5 hover:bg-white/3",
    modal: "bg-[#0f1623]",
    badge: "bg-white/10",
  },
  light: {
    bg: "bg-[var(--light-bg)]",
    sidebar: "bg-[var(--light-sidebar)]",
    card: "bg-[var(--light-card)]",
    border: "border-slate-500",
    text: "text-[var(--light-text)]",
    sub: "text-[var(--light-sub)]",
    muted: "text-[var(--light-muted)]",
    hover: "hover:bg-slate-200",
    inp: "bg-slate-100 border-slate-400 text-slate-900 placeholder-slate-500 focus:border-amber-500/60 focus:bg-white",
    th: "bg-slate-200 text-slate-700",
    tr: "border-slate-300 hover:bg-slate-100",
    modal: "bg-white",
    badge: "bg-slate-200",
  },
};

export const ACCENTS = {
  amber: { rgb: "245 158 11" },
  emerald: { rgb: "16 185 129" },
  sky: { rgb: "14 165 233" },
  rose: { rgb: "244 63 94" },
};

export const SEED_BOOKS = [];
export const SEED_STUDENTS = [];
export const SEED_ISSUES = [];
export const SEED_LIBRARIANS = [];
export const SEED_LOG = [];

export const SEED_SETTINGS = {
  schoolName: "Kendriya Vidyalaya",
  schoolAddress: "Sector 5, New Delhi - 110001",
  schoolLogo: "",
  fineRate: 2,
  maxBooks: 3,
  issueDays: 14,
  lowStockThreshold: 2,
  reminderCadence: "weekly",
  notifyEmail: true,
  notifyWhatsApp: false,
  notifyInApp: true,
  notifySms: false,
  remindBefore: 2,
  overdueEvery: 3,
  quietStart: "21:00",
  quietEnd: "07:00",
  accent: "amber",
};
