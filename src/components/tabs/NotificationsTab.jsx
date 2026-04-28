import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine } from "../../utils/helpers";

export default function NotificationsTab({ t, theme, testNotifyReason, setTestNotifyReason, settings }) {
  const tab = "notifications";
  return (
    <>
          {tab === "notifications" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className={`text-sm font-bold ${t.text}`}>Notifications & Alerts</h2>
                  <p className={`text-xs ${t.sub} mt-1`}>Manage active system alerts and run bulk campaigns.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="space-y-4">
                  <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                    <h3 className={`text-xs font-bold flex items-center gap-2 ${t.text}`}>
                      <Bell size={16} className="text-amber-500" /> Active System Alerts
                    </h3>
                    <div className="mt-4 space-y-3">
                      {issues.filter(i => calcFine(i.dueDate, settings.fineRate) > 0).slice(0, 3).map(i => {
                        const student = students.find(s => s.id === i.studentId);
                        const book = books.find(b => b.id === i.bookId);
                        return (
                          <div key={`alert-overdue-${i.id}`} className={`p-3 rounded-xl border border-red-500/20 bg-red-500/5`}>
                            <p className="text-sm font-bold text-red-500">Overdue: {student?.name || i.studentId}</p>
                            <p className={`text-xs mt-1 ${t.text}`}>Has not returned "{book?.title || i.bookId}"</p>
                            <p className={`text-xs mt-1 font-mono ${t.sub}`}>Due: {fmt(i.dueDate)} Ã‚Â· Fine: Rs {calcFine(i.dueDate, settings.fineRate)}</p>
                          </div>
                        );
                      })}
                      {books.filter(b => b.available <= (settings.lowStockThreshold || 0)).slice(0, 3).map(b => (
                        <div key={`alert-stock-${b.id}`} className={`p-3 rounded-xl border border-amber-500/20 bg-amber-500/5`}>
                          <p className="text-sm font-bold text-amber-500">Low Stock: {b.title}</p>
                          <p className={`text-xs mt-1 ${t.text}`}>Only {b.available} copies available in library.</p>
                        </div>
                      ))}
                      {issues.filter(i => calcFine(i.dueDate, settings.fineRate) > 0).length === 0 && books.filter(b => b.available <= (settings.lowStockThreshold || 0)).length === 0 && (
                        <div className={`p-4 text-center text-xs ${t.muted} border border-dashed rounded-xl ${t.border}`}>
                          <CheckCircle size={24} className="mx-auto mb-2 text-emerald-500 opacity-50" />
                          All caught up! No active alerts.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                    <h3 className={`text-xs font-bold flex items-center gap-2 ${t.text}`}>
                      <Send size={16} className="text-blue-500" /> Quick Notification
                    </h3>
                    <div className="mt-3 grid gap-3">
                      <Field label="Notification Type" theme={theme}>
                        <Sel
                          theme={theme}
                          value={testNotifyReason}
                          onChange={(e) => setTestNotifyReason(e.target.value)}
                        >
                          <option value="dueReminder">Due Date Reminder</option>
                          <option value="overdueNotice">Overdue Notice</option>
                          <option value="newArrival">New Book Arrival</option>
                          <option value="cardRenewal">Card Renewal</option>
                          <option value="fineReceipt">Fine Receipt</option>
                        </Sel>
                      </Field>
                      <Field label="Recipient (Email / Phone)" theme={theme}>
                        <Inp theme={theme} placeholder="student@example.com / +91xxxx" />
                      </Field>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors">
                          Send Notification
                        </button>
                        <button className={`px-4 py-2 rounded-xl text-xs font-bold border ${t.border} ${t.hover} transition-colors`}>
                          Preview Template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">

                  <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                    <h3 className={`text-xs font-bold ${t.sub}`}>Bulk Campaigns</h3>
                    <div className="mt-3 grid gap-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Class" theme={theme}>
                          <Sel theme={theme} value={bulkClass} onChange={(e) => setBulkClass(e.target.value)}>
                            <option value="">All Classes</option>
                            {classOptions.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </Sel>
                        </Field>
                        <Field label="Section" theme={theme}>
                          <Sel theme={theme} value={bulkSection} onChange={(e) => setBulkSection(e.target.value)}>
                            <option value="">All Sections</option>
                            {sectionOptions.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </Sel>
                        </Field>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Overdue Fine Above" theme={theme}>
                          <Sel
                            theme={theme}
                            value={bulkFineThreshold}
                            onChange={(e) => setBulkFineThreshold(Number(e.target.value) || 0)}
                          >
                            {[10, 25, 50, 75, 100].map((v) => (
                              <option key={v} value={v}>Rs {v}+</option>
                            ))}
                          </Sel>
                        </Field>
                        <Field label="New Arrivals Window" theme={theme}>
                          <Sel
                            theme={theme}
                            value={newArrivalWindow}
                            onChange={(e) => setNewArrivalWindow(Number(e.target.value) || 0)}
                          >
                            {[7, 14, 30].map((d) => (
                              <option key={d} value={d}>Last {d} days</option>
                            ))}
                          </Sel>
                        </Field>
                      </div>
                      <div className={`p-3 rounded-xl border ${t.border} text-xs ${t.sub}`}>
                        Overdue target: <span className="text-amber-500 font-bold">{overdueTargets.length}</span> students
                        <span className={`ml-2 ${t.muted}`}>| New arrivals: {books.slice(0, 6).length} latest books</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            toast(
                              overdueTargets.length
                                ? `Overdue notice queued for ${overdueTargets.length} students.`
                                : "No overdue students match this filter.",
                              overdueTargets.length ? "success" : "info"
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                        >
                          Send Overdue Notice
                        </button>
                        <button
                          onClick={() =>
                            toast(
                              bulkStudents.length
                                ? `New arrivals sent to ${bulkStudents.length} students.`
                                : "No students match this filter.",
                              bulkStudents.length ? "success" : "info"
                            )
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-bold border ${t.border} ${t.card}`}
                        >
                          Notify New Books
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
    </>
  );
}
