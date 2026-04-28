import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send, AlertTriangle, CheckCircle, Gift } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine, todayStr } from "../../utils/helpers";

export default function FinesTab({ toast, setFineStatus, setFineSort, setFineSearch, fineSort, fineSearch, fineStatus, fineView, setFineView, t, theme, issues, students, books, fineFilters, setFineFilters, settings, calcFine, fmt, tab }) {
  return (
    <>
          {tab === "fines" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Fines</h2>
                <div className="flex gap-2">
                  {[
                    { key: "pending", label: "Pending" },
                    { key: "paid", label: "Paid" },
                    { key: "waived", label: "Waived" },
                    { key: "history", label: "History" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setFineView(item.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border ${t.border} ${
                        fineView === item.key
                          ? "bg-amber-500 text-black"
                          : `${t.card} ${t.sub}`
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const fineRows = issues
                  .map((i) => {
                    const fine = calcFine(i.dueDate, settings.fineRate);
                    if (fine <= 0) return null;
                    const student = students.find((s) => s.id === i.studentId);
                    const book = books.find((b) => b.id === i.bookId);
                    const status = fineStatus[i.id]?.status || "pending";
                    return {
                      issue: i,
                      fine,
                      status,
                      student,
                      book,
                    };
                  })
                  .filter(Boolean);

                const totals = fineRows.reduce(
                  (acc, r) => {
                    acc.total += r.fine;
                    if (r.status === "paid") acc.paid += r.fine;
                    if (r.status === "waived") acc.waived += r.fine;
                    if (r.status === "pending") acc.pending += r.fine;
                    return acc;
                  },
                  { total: 0, paid: 0, waived: 0, pending: 0 }
                );

                const filtered = fineRows.filter((r) => {
                  if (fineView !== "history" && fineView && r.status !== fineView) return false;
                  if (fineFilters.class && String(r.student?.class) !== String(fineFilters.class)) return false;
                  if (fineFilters.section && String(r.student?.section).toLowerCase() !== String(fineFilters.section).toLowerCase()) return false;
                  if (fineFilters.range !== "all") {
                    const days = (new Date() - new Date(r.issue.dueDate)) / 86400000;
                    if (fineFilters.range === "today" && days > 1) return false;
                    if (fineFilters.range === "7" && days > 7) return false;
                    if (fineFilters.range === "30" && days > 30) return false;
                    if (fineFilters.range === "year" && new Date(r.issue.dueDate).getFullYear() !== new Date().getFullYear()) return false;
                  }
                  const q = fineSearch.trim().toLowerCase();
                  if (!q) return true;
                  return [
                    r.issue.id,
                    r.student?.name,
                    r.student?.id,
                    r.book?.title,
                    r.book?.id,
                  ]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q));
                });

                const sorted = [...filtered].sort((a, b) => {
                  if (fineSort === "amountAsc") return a.fine - b.fine;
                  if (fineSort === "amountDesc") return b.fine - a.fine;
                  if (fineSort === "oldest") return new Date(a.issue.dueDate) - new Date(b.issue.dueDate);
                  if (fineSort === "newest") return new Date(b.issue.dueDate) - new Date(a.issue.dueDate);
                  return 0;
                });

                const byStudent = sorted.reduce((acc, r) => {
                  const key = r.student?.name || "Unknown";
                  acc[key] = (acc[key] || 0) + r.fine;
                  return acc;
                }, {});
                const chartData = Object.entries(byStudent)
                  .map(([name, amount]) => ({ name, amount }))
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 6);
                const maxAmt = Math.max(1, ...chartData.map((d) => d.amount));

                return (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard label="Total Fine" value={`Rs ${totals.total}`} sub="All" icon={IndianRupee} color="red" theme={theme} />
                      <StatCard label="Pending" value={`Rs ${totals.pending}`} sub="To collect" icon={AlertTriangle} color="amber" theme={theme} />
                      <StatCard label="Paid" value={`Rs ${totals.paid}`} sub="Collected" icon={CheckCircle} color="green" theme={theme} />
                      <StatCard label="Waived" value={`Rs ${totals.waived}`} sub="Waived" icon={Gift} color="blue" theme={theme} />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-xs font-bold ${t.sub}`}>Top Fine Holders</h3>
                          <span className={`text-[11px] ${t.muted}`}>Top 6</span>
                        </div>
                        <div className="h-44 flex items-end gap-3">
                          {chartData.map((d) => (
                            <div key={d.name} className="flex-1 flex flex-col items-center gap-2">
                              <span className={`text-[10px] ${t.muted}`}>Rs {d.amount}</span>
                              <div
                                className="w-full rounded-xl bg-gradient-to-t from-rose-500/70 to-rose-300/40"
                                style={{ height: `${Math.max(18, 24 + Math.sqrt(d.amount / maxAmt) * 80)}px` }}
                              />
                              <span className={`text-[10px] ${t.muted}`}>
                                {d.name.split(" ")[0]}
                              </span>
                            </div>
                          ))}
                          {chartData.length === 0 && (
                            <p className={`text-xs ${t.muted}`}>No fines yet.</p>
                          )}
                        </div>
                      </div>
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4 space-y-3`}>
                        <Inp
                          theme={theme}
                          placeholder="Search fine records..."
                          value={fineSearch}
                          onChange={(e) => setFineSearch(e.target.value)}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Sel
                            theme={theme}
                            className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                            style={{
                              color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                              backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                            }}
                            value={fineFilters.class}
                            onChange={(e) => setFineFilters((p) => ({ ...p, class: e.target.value }))}
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
                            value={fineFilters.section}
                            onChange={(e) => setFineFilters((p) => ({ ...p, section: e.target.value }))}
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
                            value={fineFilters.range}
                            onChange={(e) => setFineFilters((p) => ({ ...p, range: e.target.value }))}
                          >
                            <option value="all">All time</option>
                            <option value="today">Today</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="year">This year</option>
                          </Sel>
                          <Sel
                            theme={theme}
                            className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                            style={{
                              color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                              backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                            }}
                            value={fineSort}
                            onChange={(e) => setFineSort(e.target.value)}
                          >
                            <option value="amountDesc">Amount: High to Low</option>
                            <option value="amountAsc">Amount: Low to High</option>
                            <option value="oldest">Oldest Due</option>
                            <option value="newest">Newest Due</option>
                          </Sel>
                        </div>
                        <button
                          onClick={() => {
                            setFineSearch("");
                            setFineFilters({ range: "all", class: "", section: "" });
                            setFineSort("amountDesc");
                          }}
                          className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                        >
                          Clear filters
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className={`w-full text-sm ${t.text}`}>
                        <thead className={`${t.th}`}>
                          <tr>
                            <th className="p-2 text-left">Issue ID</th>
                            <th className="p-2 text-left">Student</th>
                            <th className="p-2 text-left">Book</th>
                            <th className="p-2 text-left">Due</th>
                            {fineView === "history" && <th className="p-2 text-left">Returned</th>}
                            <th className="p-2 text-left">Amount</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((r) => (
                            <tr key={r.issue.id} className={`border-t ${t.tr}`}>
                              <td className="p-2 font-semibold">{r.issue.id}</td>
                              <td className="p-2">{r.student?.name || "-"}</td>
                              <td className="p-2">{r.book?.title || "-"}</td>
                              <td className="p-2">{fmt(r.issue.dueDate)}</td>
                              {fineView === "history" && <td className="p-2">{fmt(r.issue.returnDate)}</td>}
                              <td className="p-2">Rs {r.fine}</td>
                              <td className="p-2">
                                <Badge color={r.status === "paid" ? "green" : r.status === "waived" ? "blue" : "amber"}>
                                  {r.status}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="flex flex-wrap gap-2">
                                  {r.status === "pending" && (
                                    <button
                                      onClick={() =>
                                        setFineStatus((prev) => ({
                                          ...prev,
                                          [r.issue.id]: { status: "paid", paidAt: todayStr() },
                                        }))
                                      }
                                      className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                  {r.status === "pending" && (
                                    <button
                                      onClick={() =>
                                        setFineStatus((prev) => ({
                                          ...prev,
                                          [r.issue.id]: { status: "waived", paidAt: todayStr() },
                                        }))
                                      }
                                      className="px-2 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold"
                                    >
                                      Waive
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      const win = window.open("", "_blank", "width=420,height=520");
                                      if (!win) return;
                                      win.document.write(`
                                        <html>
                                          <head>
                                            <title>Fine Receipt</title>
                                            <style>
                                              body { font-family: Arial, sans-serif; margin: 24px; }
                                              .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; }
                                              .title { font-size: 14px; font-weight: 700; margin: 0 0 6px 0; }
                                              .line { font-size: 11px; margin: 2px 0; }
                                            </style>
                                          </head>
                                          <body>
                                            <div class="card">
                                              <p class="title">Fine Receipt</p>
                                              <p class="line">Issue: ${r.issue.id}</p>
                                              <p class="line">Student: ${r.student?.name || "-"}</p>
                                              <p class="line">Book: ${r.book?.title || "-"}</p>
                                              <p class="line">Due: ${fmt(r.issue.dueDate)}</p>
                                              <p class="line">Amount: Rs ${r.fine}</p>
                                              <p class="line">Status: ${r.status}</p>
                                            </div>
                                            <script>window.print();</script>
                                          </body>
                                        </html>
                                      `);
                                      win.document.close();
                                    }}
                                    className={`px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-xs font-bold`}
                                  >
                                    Receipt
                                  </button>
                                  <button
                                    onClick={() => toast("Reminder sent", "success")}
                                    className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-500 text-xs font-bold"
                                  >
                                    Reminder
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {sorted.length === 0 && (
                            <tr>
                              <td className={`p-3 ${t.muted}`} colSpan={7}>
                                No fine records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </section>
          )}
    </>
  );
}
