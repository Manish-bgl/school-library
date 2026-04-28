import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine } from "../../utils/helpers";

export default function LibrariansTab({ t, theme, librarians, user, handleAddLibrarian, handleDeleteLibrarian, newLibrarian, setNewLibrarian }) {
  const tab = "librarians";
  return (
    <>
          {tab === "librarians" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Librarians</h2>
                <button
                  onClick={() => {
                    setLibrarianEditId(null);
                    setNewLibrarian({
                      name: "",
                      username: "",
                      password: "",
                      email: "",
                      phone: "",
                      role: "",
                      status: "Active",
                    });
                    setLibrarianModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                >
                  Add Librarian
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Inp
                  theme={theme}
                  placeholder="Search librarians..."
                  value={librarianSearch}
                  onChange={(e) => setLibrarianSearch(e.target.value)}
                />
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={librarianFilters.role}
                  onChange={(e) => setLibrarianFilters((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="">All Roles</option>
                  {["Admin", "Staff", "Issuer", "Viewer"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Sel>
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={librarianFilters.status}
                  onChange={(e) => setLibrarianFilters((p) => ({ ...p, status: e.target.value }))}
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
                      <th className="p-2 text-left">Role</th>
                      <th className="p-2 text-left">Last Login</th>
                      <th className="p-2 text-left">Actions</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Quick</th>
                    </tr>
                  </thead>
                  <tbody>
                    {librarians
                      .filter((l) => {
                        const q = librarianSearch.trim().toLowerCase();
                        if (librarianFilters.status && l.status !== librarianFilters.status) return false;
                        if (librarianFilters.role && l.role !== librarianFilters.role) return false;
                        if (!q) return true;
                        return [l.id, l.name, l.username, l.email, l.phone]
                          .filter(Boolean)
                          .some((v) => String(v).toLowerCase().includes(q));
                      })
                      .map((l) => (
                        <tr key={l.id} className={`border-t ${t.tr}`}>
                          <td className="p-2 font-semibold">{l.id}</td>
                          <td className="p-2">
                            <div className="font-bold">{l.name}</div>
                            {l.username && <div className={`text-[10px] ${t.muted} mt-0.5`}>@{l.username}</div>}
                          </td>
                          <td className="p-2">{l.role || "-"}</td>
                          <td className="p-2">{l.lastLogin || "-"}</td>
                          <td className="p-2">{l.actionsCount ?? 0}</td>
                          <td className="p-2">
                            <Badge color={l.status === "Active" ? "green" : "red"}>{l.status}</Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setCardLibrarian(l)}
                                className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-500 text-xs font-bold"
                              >
                                ID Card
                              </button>
                              <a
                                href={`tel:${l.phone}`}
                                className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-bold"
                              >
                                Call
                              </a>
                              {l.phone && (
                                <a
                                  href={`https://wa.me/${String(l.phone).replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold"
                                >
                                  WhatsApp
                                </a>
                              )}
                              {l.email && (
                                <a
                                  href={`mailto:${l.email}`}
                                  className="px-2 py-1 rounded-lg bg-slate-500/15 text-slate-600 text-xs font-bold"
                                >
                                  Email
                                </a>
                              )}
                              <button
                                onClick={() =>
                                  setLibrarians((prev) =>
                                    prev.map((x) =>
                                      x.id === l.id
                                        ? { ...x, status: x.status === "Active" ? "Suspended" : "Active" }
                                        : x
                                    )
                                  )
                                }
                                className={`px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-xs font-bold`}
                              >
                                {l.status === "Active" ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
    </>
  );
}
