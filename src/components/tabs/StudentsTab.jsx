import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine } from "../../utils/helpers";

export default function StudentsTab({ t, theme, students, studentSearch, setStudentSearch, studentFilters, setStudentFilters, setStudentModalOpen, setSelectedStudent, handleDeleteStudent, handlePrintIdCard }) {
  const tab = "students";
  return (
    <>
          {tab === "students" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Students</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStudentImportOpen(true)}
                    className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                  >
                    Import CSV
                  </button>
                  <button
                    onClick={() => setStudentModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                  >
                    Add Student
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Inp
                  theme={theme}
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={studentFilters.class}
                  onChange={(e) => setStudentFilters((p) => ({ ...p, class: e.target.value }))}
                >
                  <option value="">All Classes</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Sel>
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={studentFilters.section}
                  onChange={(e) => setStudentFilters((p) => ({ ...p, section: e.target.value }))}
                >
                  <option value="">All Sections</option>
                  {["A", "B", "C", "D", "E"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Sel>
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={studentFilters.status}
                  onChange={(e) => setStudentFilters((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </Sel>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className={`w-full text-sm ${t.text}`}>
                  <thead className={`${t.th}`}>
                    <tr>
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Class</th>
                      <th className="p-2 text-left">Contact</th>
                      <th className="p-2 text-left">Last Visit</th>
                      <th className="p-2 text-left">Issued</th>
                      <th className="p-2 text-left">Fine</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter((s) => {
                        const q = studentSearch.trim().toLowerCase();
                        if (studentFilters.class && String(s.class) !== String(studentFilters.class)) return false;
                        if (studentFilters.section && String(s.section).toLowerCase() !== String(studentFilters.section).toLowerCase()) return false;
                        if (studentFilters.status && s.status !== studentFilters.status) return false;
                        if (!q) return true;
                        return [s.id, s.name, s.rollNo, s.class, s.section, s.contact, s.email]
                          .filter(Boolean)
                          .some((v) => String(v).toLowerCase().includes(q));
                      })
                      .map((s) => {
                        const activeCount = issues.filter((i) => i.studentId === s.id && !i.returnDate).length;
                        const fine = getStudentFine(s.id);
                        return (
                          <tr key={s.id} className={`border-t ${t.tr}`}>
                            <td className="p-2 font-semibold">{s.displayId || s.id}</td>
                            <td className="p-2">{s.name}</td>
                            <td className="p-2">{s.class}{s.section}</td>
                            <td className="p-2">{s.contact}</td>
                            <td className="p-2">{getStudentActivity(s.id)}</td>
                            <td className="p-2">
                              <div className="w-28">
                                <div className={`h-2 rounded-full ${t.border} border`}> 
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${Math.min(100, (activeCount / settings.maxBooks) * 100)}%` }}
                                  />
                                </div>
                                <p className={`text-[10px] ${t.muted} mt-1`}>{activeCount}/{settings.maxBooks} issued</p>
                              </div>
                            </td>
                            <td className="p-2">{fine > 0 ? `Rs ${fine}` : ""}</td>
                            <td className="p-2">
                              <Badge color={s.status === "Active" ? "green" : "red"}>
                                {s.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => setSelectedStudent(s)}
                                  className={`px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-xs font-bold`}
                                >
                                  Profile
                                </button>
                                <button
                                  onClick={() => openCard(s)}
                                  className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-500 text-xs font-bold"
                                >
                                  Card
                                </button>
                                <a
                                  href={`tel:${s.contact}`}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-bold"
                                >
                                  Call
                                </a>
                                <a
                                  href={`https://wa.me/${String(s.contact || "").replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold"
                                >
                                  WhatsApp
                                </a>
                                {s.email && (
                                  <a
                                    href={`mailto:${s.email}`}
                                    className="px-2 py-1 rounded-lg bg-slate-500/15 text-slate-600 text-xs font-bold"
                                  >
                                    Email
                                  </a>
                                )}
                                <button
                                  onClick={() => handleToggleStudentStatus(s)}
                                  className={`px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-xs font-bold`}
                                >
                                  {s.status === "Active" ? "Suspend" : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
    </>
  );
}
