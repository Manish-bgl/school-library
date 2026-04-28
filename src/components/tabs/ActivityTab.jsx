import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine } from "../../utils/helpers";

export default function ActivityTab({ books, students, issues, setActivityDateFrom, activityDateFrom, setActivityRange, activityRange, setActivityFilter, activityFilter, setActivitySearch, activitySearch, activityView, setActivityView, t, theme, log, stats, user, tab }) {
  return (
    <>
          {tab === "activity" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Activity Log</h2>
                <div className="flex gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "librarian", label: "Librarians" },
                    { key: "student", label: "Students" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActivityView(item.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border ${t.border} ${
                        activityView === item.key
                          ? "bg-amber-500 text-black"
                          : `${t.card} ${t.sub}`
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <Inp
                  theme={theme}
                  placeholder="Search activity..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                />
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="issue">Issue</option>
                  <option value="return">Return</option>
                  <option value="fine">Fine</option>
                  <option value="book">Book</option>
                  <option value="login">Login</option>
                </Sel>
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={activityRange}
                  onChange={(e) => setActivityRange(e.target.value)}
                >
                  <option value="all">All time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="60">Last 2 months</option>
                </Sel>
                <Inp
                  theme={theme}
                  type="datetime-local"
                  value={activityDateFrom}
                  onChange={(e) => setActivityDateFrom(e.target.value)}
                />
              </div>

              {(() => {
                const librarianEvents = log.map((l) => ({
                  id: `log-${l.id}`,
                  role: "librarian",
                  actor: l.user,
                  action: l.action,
                  time: l.time,
                  type: l.action.toLowerCase().includes("fine")
                    ? "fine"
                    : l.action.toLowerCase().includes("issued")
                    ? "issue"
                    : l.action.toLowerCase().includes("returned")
                    ? "return"
                    : l.action.toLowerCase().includes("login")
                    ? "login"
                    : "book",
                }));

                const studentEvents = issues.flatMap((i) => {
                  const student = students.find((s) => s.id === i.studentId);
                  const book = books.find((b) => b.id === i.bookId);
                  const items = [
                    {
                      id: `stu-${i.id}-issue`,
                      role: "student",
                      actor: student?.name || "Student",
                      action: `Borrowed '${book?.title || "-"}'`,
                      time: `${i.issueDate} 10:00`,
                      type: "issue",
                    },
                  ];
                  if (i.returnDate) {
                    items.push({
                      id: `stu-${i.id}-return`,
                      role: "student",
                      actor: student?.name || "Student",
                      action: `Returned '${book?.title || "-"}'`,
                      time: `${i.returnDate} 16:00`,
                      type: "return",
                    });
                  }
                  return items;
                });

                const allEvents = [...librarianEvents, ...studentEvents]
                  .sort((a, b) => (a.time < b.time ? 1 : -1));

                const q = activitySearch.trim().toLowerCase();
                const filtered = allEvents.filter((e) => {
                  if (activityView !== "all" && e.role !== activityView) return false;
                  if (activityFilter !== "all" && e.type !== activityFilter) return false;
                  if (activityRange !== "all") {
                    const days = (new Date() - new Date(e.time)) / 86400000;
                    if (days > Number(activityRange)) return false;
                  }
                  if (activityDateFrom) {
                    const fromDate = new Date(activityDateFrom);
                    const eventDate = new Date(e.time);
                    if (eventDate < fromDate) return false;
                  }
                  if (!q) return true;
                  return [e.actor, e.action, e.time]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q));
                });

                return (
                  <div className="mt-4 space-y-3 relative">
                    <div className={`absolute left-3 top-0 bottom-0 w-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />
                    {filtered.map((e) => (
                      <div key={e.id} className="relative pl-8">
                        <div className={`absolute left-2.5 top-3 w-2.5 h-2.5 rounded-full ${
                          e.role === "student" ? "bg-sky-500" : "bg-emerald-500"
                        }`} />
                        <div className={`p-3 rounded-xl border ${t.border} flex items-center justify-between gap-3`}>
                          <div>
                            <p className={`text-sm ${t.text}`}>{e.action}</p>
                            <p className={`text-xs ${t.muted}`}>{e.actor} Ã‚Â· {e.time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge color={e.role === "student" ? "blue" : "green"}>
                              {e.role === "student" ? "Student" : "Librarian"}
                            </Badge>
                            <Badge color={e.type === "issue" ? "amber" : e.type === "return" ? "green" : e.type === "fine" ? "red" : "blue"}>
                              {e.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 && (
                      <p className={`text-xs ${t.muted}`}>No activity found.</p>
                    )}
                  </div>
                );
              })()}
            </section>
          )}
    </>
  );
}
