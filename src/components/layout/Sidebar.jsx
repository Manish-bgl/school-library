import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  GraduationCap,
  RotateCcw,
  IndianRupee,
  Bell,
  UserCheck,
  BarChart2,
  Activity,
  Settings,
} from "lucide-react";
import { T } from "../../utils/constants";

export function Sidebar({ user, tab, setTab, open, theme, settings }) {
  const t = T[theme];
  const isDir = user?.role === "director" || user?.role === "manager";
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "books", label: "Books", icon: BookOpen },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "issues", label: "Issue & Return", icon: RotateCcw },
    { id: "fines", label: "Fines", icon: IndianRupee },
    { id: "notifications", label: "Notifications", icon: Bell },
    ...(isDir
      ? [
          { id: "librarians", label: "Librarians", icon: UserCheck },
          { id: "reports", label: "Reports", icon: BarChart2 },
          { id: "activity", label: "Activity Log", icon: Activity },
        ]
      : []),
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <aside
      className={`${open ? "w-56" : "w-14"} ${t.sidebar} border-r ${
        t.border
      } flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}
    >
      <div
        className={`h-16 flex items-center ${
          open ? "px-4 gap-3" : "justify-center"
        } border-b ${t.border}`}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
          <BookMarked size={15} className="text-white" />
        </div>
        {open && (
          <div>
            <p className={`font-black text-xs ${t.text} leading-tight`}>
              {settings.schoolName}
            </p>
            <p className={`text-xs ${t.muted}`}>Library</p>
          </div>
        )}
      </div>
      {open && (
        <div
          className={`mx-3 my-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
            isDir ? "bg-amber-500/15 text-amber-500" : "bg-blue-500/15 text-blue-400"
          }`}
        >
          {isDir ? "Director Access" : "Librarian Access"}
        </div>
      )}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`w-full flex items-center ${
                open ? "gap-3 px-3" : "justify-center"
              } py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : `${t.sub} ${t.hover}`
              }`}
            >
              <Icon size={17} className="shrink-0" />
              {open && <span>{n.label}</span>}
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
