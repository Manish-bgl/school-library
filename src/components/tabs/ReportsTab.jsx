import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine } from "../../utils/helpers";

export default function ReportsTab({ t, theme, stats, reportFilters, setReportFilters, issues, students, books }) {
  const tab = "reports";
  return (
    <>
          {tab === "reports" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Reports</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => toast("Export CSV coming soon", "success")}
                    className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => toast("Export PDF coming soon", "success")}
                    className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                  >
                    Export PDF
                  </button>
                </div>
              </div>

              {(() => {
                const rangeDays = reportFilters.range === "year" ? 365 : Number(reportFilters.range);
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - rangeDays);

                const filteredIssues = issues.filter((i) => {
                  const issueDate = new Date(i.issueDate);
                  if (reportFilters.range !== "all" && issueDate < fromDate) return false;
                  if (reportFilters.class || reportFilters.section) {
                    const student = students.find((s) => s.id === i.studentId);
                    if (reportFilters.class && String(student?.class) !== String(reportFilters.class)) return false;
                    if (reportFilters.section && String(student?.section).toLowerCase() !== String(reportFilters.section).toLowerCase()) return false;
                  }
                  if (reportFilters.category) {
                    const book = books.find((b) => b.id === i.bookId);
                    if (String(book?.genre) !== String(reportFilters.category)) return false;
                  }
                  return true;
                });

                const issuedCount = filteredIssues.length;
                const returnedCount = filteredIssues.filter((i) => i.returnDate).length;
                const overdueCount = filteredIssues.filter((i) => !i.returnDate && new Date(i.dueDate) < new Date()).length;

                const fineCollected = filteredIssues.reduce((sum, i) => {
                  if (!i.returnDate) return sum;
                  const fine = Math.max(
                    0,
                    Math.floor((new Date(i.returnDate) - new Date(i.dueDate)) / 86400000) * settings.fineRate
                  );
                  return sum + fine;
                }, 0);

                const weekly = Array.from({ length: 7 }, (_, i) => {
                  const day = daysAgo(6 - i);
                  const issued = filteredIssues.filter((x) => x.issueDate === day).length;
                  const returned = filteredIssues.filter((x) => x.returnDate === day).length;
                  return { day, issued, returned };
                });
                const maxWeekly = Math.max(1, ...weekly.map((d) => Math.max(d.issued, d.returned)));

                const topBooks = filteredIssues.reduce((acc, i) => {
                  acc[i.bookId] = (acc[i.bookId] || 0) + 1;
                  return acc;
                }, {});
                const topIssuedBooks = Object.entries(topBooks)
                  .map(([bookId, count]) => ({
                    book: books.find((b) => b.id === bookId),
                    count,
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5);

                const fineTrend = Array.from({ length: 7 }, (_, i) => {
                  const day = daysAgo(6 - i);
                  const amount = filteredIssues
                    .filter((x) => x.returnDate === day)
                    .reduce((sum, x) => sum + Math.max(0, Math.floor((new Date(x.returnDate) - new Date(x.dueDate)) / 86400000) * settings.fineRate), 0);
                  return { day, amount };
                });
                const maxFine = Math.max(1, ...fineTrend.map((d) => d.amount));

                const lowStock = books.filter((b) => b.available <= settings.lowStockThreshold);
                const categoryCounts = books.reduce((acc, b) => {
                  const key = b.genre || "Other";
                  acc[key] = (acc[key] || 0) + (Number(b.total) || 0);
                  return acc;
                }, {});
                const popularCategories = Object.entries(categoryCounts)
                  .map(([genre, count]) => ({ genre, count }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5);

                return (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard label="Issued" value={issuedCount} sub="Filtered" icon={RotateCcw} color="amber" theme={theme} />
                      <StatCard label="Returned" value={returnedCount} sub="Filtered" icon={CheckCircle} color="green" theme={theme} />
                      <StatCard label="Overdue" value={overdueCount} sub="Pending" icon={AlertTriangle} color="red" theme={theme} />
                      <StatCard label="Fine Collected" value={`Rs ${fineCollected}`} sub="Returned" icon={IndianRupee} color="blue" theme={theme} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Sel
                        theme={theme}
                        className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                        style={{
                          color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                        }}
                        value={reportFilters.range}
                        onChange={(e) => setReportFilters((p) => ({ ...p, range: e.target.value }))}
                      >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="year">This year</option>
                        <option value="all">All time</option>
                      </Sel>
                      <Sel
                        theme={theme}
                        className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                        style={{
                          color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                        }}
                        value={reportFilters.class}
                        onChange={(e) => setReportFilters((p) => ({ ...p, class: e.target.value }))}
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
                        value={reportFilters.section}
                        onChange={(e) => setReportFilters((p) => ({ ...p, section: e.target.value }))}
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
                        value={reportFilters.category}
                        onChange={(e) => setReportFilters((p) => ({ ...p, category: e.target.value }))}
                      >
                        <option value="">All Categories</option>
                        {[...new Set(books.map((b) => b.genre).filter(Boolean))].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </Sel>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <h3 className={`text-xs font-bold ${t.sub} mb-3`}>Issued vs Returned (7 days)</h3>
                        <div className="h-44 flex items-end gap-3">
                          {weekly.map((d) => (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full flex items-end gap-1">
                                <div
                                  className="flex-1 rounded-lg bg-amber-500/70"
                                  style={{ height: `${Math.max(10, (d.issued / maxWeekly) * 120)}px` }}
                                  title={`Issued ${d.issued}`}
                                />
                                <div
                                  className="flex-1 rounded-lg bg-emerald-500/70"
                                  style={{ height: `${Math.max(10, (d.returned / maxWeekly) * 120)}px` }}
                                  title={`Returned ${d.returned}`}
                                />
                              </div>
                              <span className={`text-[10px] ${t.muted}`}>{d.day.slice(5)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <h3 className={`text-xs font-bold ${t.sub} mb-3`}>Fine Trend (7 days)</h3>
                        <div className="h-44 flex items-end gap-3">
                          {fineTrend.map((d) => (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                              <span className={`text-[10px] ${t.muted}`}>Rs {d.amount}</span>
                              <div
                                className="w-full rounded-xl bg-gradient-to-t from-rose-500/70 to-rose-300/40"
                                style={{ height: `${Math.max(10, (d.amount / maxFine) * 120)}px` }}
                              />
                              <span className={`text-[10px] ${t.muted}`}>{d.day.slice(5)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <h3 className={`text-xs font-bold ${t.sub} mb-3`}>Top 5 Most Issued Books</h3>
                        <div className="space-y-3">
                          {(() => {
                            const maxTop = Math.max(1, ...topIssuedBooks.map((b) => b.count));
                            return topIssuedBooks.map((b) => (
                              <div key={b.book?.id} className={`p-3 rounded-xl border ${t.border}`}>
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm font-bold ${t.text}`}>{b.book?.title || "-"}</p>
                                  <span className={`text-xs ${t.sub}`}>{b.count} issues</span>
                                </div>
                                <p className={`text-xs ${t.muted}`}>{b.book?.author || "-"}</p>
                                <div className="mt-2 h-2 rounded-full bg-white/10 border border-white/10">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-sky-500/80 to-emerald-400/70"
                                    style={{ width: `${Math.max(8, (b.count / maxTop) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ));
                          })()}
                          {topIssuedBooks.length === 0 && (
                            <p className={`text-xs ${t.muted}`}>No data available.</p>
                          )}
                        </div>
                      </div>
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <h3 className={`text-xs font-bold ${t.sub} mb-3`}>Quick Insights</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className={`p-3 rounded-xl border ${t.border}`}>
                            <p className={`text-xs ${t.sub}`}>Low Stock</p>
                            <p className={`text-xl font-black ${t.text}`}>{lowStock.length}</p>
                            <p className={`text-[11px] ${t.muted}`}>below threshold</p>
                          </div>
                          <div className={`p-3 rounded-xl border ${t.border}`}>
                            <p className={`text-xs ${t.sub}`}>Active Categories</p>
                            <p className={`text-xl font-black ${t.text}`}>{popularCategories.length}</p>
                            <p className={`text-[11px] ${t.muted}`}>top tracked</p>
                          </div>
                        </div>
                        <div className={`mt-3 p-3 rounded-xl border ${t.border}`}>
                          <p className={`text-xs ${t.sub} mb-2`}>Popular Categories</p>
                          <div className="space-y-2">
                            {(() => {
                              const maxCat = Math.max(1, ...popularCategories.map((c) => c.count));
                              return popularCategories.map((c) => (
                                <div key={c.genre} className="flex items-center gap-2">
                                  <span className={`text-[11px] ${t.sub} w-24 truncate`}>{c.genre}</span>
                                  <div className="flex-1 h-2 rounded-full bg-white/10 border border-white/10">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-300/50"
                                      style={{ width: `${Math.max(10, (c.count / maxCat) * 100)}%` }}
                                    />
                                  </div>
                                  <span className={`text-[11px] ${t.muted}`}>{c.count}</span>
                                </div>
                              ));
                            })()}
                            {popularCategories.length === 0 && (
                              <span className={`text-xs ${t.muted}`}>-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </section>
          )}
    </>
  );
}
