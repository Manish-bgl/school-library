import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine } from "../../utils/helpers";

export default function IssuesTab({ t, theme, issues, books, students, issueFilters, setIssueFilters, scanType, setScanType, scannerActive, setScannerActive, videoRef, issueStudentId, setIssueStudentId, issueBookId, setIssueBookId, isScanned, handleIssueBook, handleReturnBook }) {
  const tab = "issues";
  return (
    <>
          {tab === "issues" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <h2 className={`text-sm font-bold ${t.text}`}>Issue & Return</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <div className={`rounded-2xl border ${t.border} p-3 ${t.card}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-xs font-bold ${t.sub}`}>Camera Scan</p>
                    <span className={`text-[11px] ${t.muted}`}>
                      {scanMode ? `Scanning: ${scanMode}` : "Idle"}
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-dashed border-slate-400/40 bg-black/5">
                    <video ref={videoRef} className="w-full h-44 object-cover" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setScanMode("auto")}
                      className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
                    >
                      Auto Scan
                    </button>
                    <button
                      onClick={() => setScanMode("student")}
                      className="px-3 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold"
                    >
                      Scan Student QR
                    </button>
                    <button
                      onClick={() => setScanMode("book")}
                      className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                    >
                      Scan Book Barcode
                    </button>
                    {scanMode && (
                      <button
                        onClick={() => { stopScan(); setScanStudent(""); setScanBook(""); }}
                        className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/25 animate-pulse hover:animate-none hover:bg-red-600 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        Stop Scanner
                      </button>
                    )}
                  </div>
                  <p className={`mt-2 text-[11px] ${t.muted}`}>
                    Student card uses QR. Book label uses barcode. Keep 10-15cm distance and good light.
                  </p>
                </div>
                <div className={`rounded-2xl border ${t.border} p-3 ${t.card}`}>
                  <p className={`text-xs font-bold ${t.sub} mb-2`}>Scan Inputs</p>
                  <div className="grid gap-3">
                    <div>
                      <Lbl theme={theme}>Student QR / ID</Lbl>
                      <Inp
                        theme={theme}
                        placeholder="Scan student QR or type ID"
                        value={scanStudent}
                        onChange={(e) => setScanStudent(e.target.value)}
                      />
                    </div>
                    <div>
                      <Lbl theme={theme}>Book Barcode / ID</Lbl>
                      <Inp
                        theme={theme}
                        placeholder="Scan book barcode or type ID"
                        value={scanBook}
                        onChange={(e) => setScanBook(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleScanIssue}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
                      >
                        Issue
                      </button>
                      <button
                        onClick={handleScanReturn}
                        className="px-4 py-2 rounded-xl bg-slate-200 text-slate-900 text-xs font-bold"
                      >
                        Return
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { key: "history", label: "History" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setIssueView(item.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border ${t.border} ${
                      issueView === item.key
                        ? "bg-amber-500 text-black"
                        : `${t.card} ${t.sub}`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {issueView === "history" && (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto_auto]">
                  <Inp
                    theme={theme}
                    placeholder="Quick search history..."
                    value={issueHistorySearch}
                    onChange={(e) => setIssueHistorySearch(e.target.value)}
                  />
                  <Sel
                    theme={theme}
                    className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                    style={{
                      color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                      backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                    }}
                    value={issueHistoryFilters.status}
                    onChange={(e) =>
                      setIssueHistoryFilters((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="all">All</option>
                    <option value="issued">Issued</option>
                    <option value="returned">Returned</option>
                  </Sel>
                  <Sel
                    theme={theme}
                    className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                    style={{
                      color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                      backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                    }}
                    value={issueHistoryFilters.range}
                    onChange={(e) =>
                      setIssueHistoryFilters((p) => ({ ...p, range: e.target.value }))
                    }
                  >
                    <option value="all">All time</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="year">This year</option>
                  </Sel>
                  <Inp
                    theme={theme}
                    type="datetime-local"
                    value={issueHistoryFilters.from}
                    onChange={(e) =>
                      setIssueHistoryFilters((p) => ({ ...p, from: e.target.value }))
                    }
                  />
                  <button
                    onClick={() => {
                      setIssueHistorySearch("");
                      setIssueHistoryFilters({ status: "all", range: "all", from: "", to: "" });
                    }}
                    className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                  >
                    Clear filters
                  </button>
                </div>
              )}
              {(() => {
                const studentId = parseStudentIdFromQr(scanStudent);
                const bookId = parseBookIdFromQr(scanBook);
                const student = students.find((s) => s.id === studentId);
                const book = books.find((b) => b.id === bookId);
                if (!student && !book) return null;
                return (
                  <div className={`mt-3 p-3 rounded-xl border ${t.border} text-xs ${t.sub}`}>
                    <div className="flex flex-wrap gap-3">
                      {student && (
                        <span>
                          Student: <strong className={t.text}>{student.name}</strong> ({student.id})
                        </span>
                      )}
                      {book && (
                        <span>
                          Book: <strong className={t.text}>{book.title}</strong> Ã‚Â· Available {book.available}/{book.total}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="mt-4 overflow-x-auto">
                <table className={`w-full text-sm ${t.text}`}>
                  <thead className={`${t.th}`}>
                    <tr>
                      <th className="p-2 text-left">Issue ID</th>
                      <th className="p-2 text-left">Student</th>
                      <th className="p-2 text-left">Book</th>
                      <th className="p-2 text-left">Due</th>
                      {issueView === "history" && <th className="p-2 text-left">Returned</th>}
                      {issueView === "history" && <th className="p-2 text-left">Fine</th>}
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const baseList = issueView === "issue" ? issues.filter((i) => !i.returnDate) : issues;
                      const q = issueHistorySearch.trim().toLowerCase();
                      const list =
                        issueView === "history"
                          ? baseList.filter((i) => {
                              if (issueHistoryFilters.status === "issued" && i.returnDate) return false;
                              if (issueHistoryFilters.status === "returned" && !i.returnDate) return false;
                              const refDate = i.returnDate || i.issueDate;
                              if (issueHistoryFilters.range !== "all") {
                                const days = (new Date() - new Date(refDate)) / 86400000;
                                if (issueHistoryFilters.range === "yesterday") {
                                  if (days < 1 || days >= 2) return false;
                                } else if (issueHistoryFilters.range === "year") {
                                  if (new Date(refDate).getFullYear() !== new Date().getFullYear()) return false;
                                } else if (days > Number(issueHistoryFilters.range)) {
                                  return false;
                                }
                              }
                              if (issueHistoryFilters.from) {
                                const fromDate = new Date(issueHistoryFilters.from);
                                if (new Date(refDate) < fromDate) return false;
                              }
                              if (issueHistoryFilters.to) {
                                const toDate = new Date(issueHistoryFilters.to);
                                if (new Date(refDate) > toDate) return false;
                              }
                              if (!q) return true;
                              const student = students.find((s) => s.id === i.studentId);
                              const book = books.find((b) => b.id === i.bookId);
                              return [
                                i.id,
                                student?.name,
                                student?.id,
                                book?.title,
                                book?.id,
                              ]
                                .filter(Boolean)
                                .some((v) => String(v).toLowerCase().includes(q));
                            })
                          : baseList;
                      return list.map((i) => {
                      const student = students.find((s) => s.id === i.studentId);
                      const book = books.find((b) => b.id === i.bookId);
                      const fine = i.returnDate
                        ? Math.max(
                            0,
                            Math.floor(
                              (new Date(i.returnDate) - new Date(i.dueDate)) / 86400000
                            ) * settings.fineRate
                          )
                        : 0;
                      return (
                        <tr key={i.id} className={`border-t ${t.tr}`}>
                          <td className="p-2 font-semibold">{i.displayId || i.id}</td>
                          <td className="p-2">{student?.name || "-"}</td>
                          <td className="p-2">{book?.title || "-"}</td>
                          <td className="p-2">{fmt(i.dueDate)}</td>
                          {issueView === "history" && <td className="p-2">{fmt(i.returnDate)}</td>}
                          {issueView === "history" && <td className="p-2">{fine > 0 ? `Rs ${fine}` : ""}</td>}
                          <td className="p-2">
                            <Badge color={i.returnDate ? "green" : "amber"}>
                              {i.returnDate ? "Returned" : "Issued"}
                            </Badge>
                          </td>
                        </tr>
                      );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </section>
          )}
    </>
  );
}
