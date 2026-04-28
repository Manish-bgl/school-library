import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine } from "../../utils/helpers";

export default function SettingsTab({ setBackupText, backupText, handleLogoUpload, isDir, t, theme, activeSettingsTab, setActiveSettingsTab, settings, setSettings, toggleTheme, handleExportData, handleImportData, books, students, issues, tab, accent }) {
  return (
    <>
          {tab === "settings" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className={`text-sm font-bold ${t.text}`}>Settings</h2>
                  <p className={`text-xs ${t.sub} mt-1`}>
                    {isDir
                      ? "Branding, rules, alerts, and system tools."
                      : "Personal preferences and display options."}
                  </p>
                </div>
              </div>

              {isDir ? (
                <div className="mt-5">
                  <div className={`flex gap-2 border-b ${t.border} pb-4 mb-4 overflow-x-auto scrollbar-hide`}>
                    <button onClick={() => setActiveSettingsTab('general')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeSettingsTab === 'general' ? 'bg-emerald-500 text-black' : `border ${t.border} ${t.sub} hover:${t.text}`}`}>General & Branding</button>
                    <button onClick={() => setActiveSettingsTab('rules')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeSettingsTab === 'rules' ? 'bg-emerald-500 text-black' : `border ${t.border} ${t.sub} hover:${t.text}`}`}>Library Rules</button>
                    <button onClick={() => setActiveSettingsTab('notifications')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeSettingsTab === 'notifications' ? 'bg-emerald-500 text-black' : `border ${t.border} ${t.sub} hover:${t.text}`}`}>Alerts & Reminders</button>
                    <button onClick={() => setActiveSettingsTab('advanced')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeSettingsTab === 'advanced' ? 'bg-emerald-500 text-black' : `border ${t.border} ${t.sub} hover:${t.text}`}`}>Advanced & Backup</button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {activeSettingsTab === 'general' && (
                      <>
                        <div className={`${t.card} border ${t.border} rounded-2xl p-4 space-y-4`}>
                          <h3 className={`text-xs font-bold ${t.sub}`}>School Identity</h3>
                          <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                            <div
                              className={`p-3 rounded-xl border ${t.border} flex flex-col items-center gap-3 ${
                                theme === "dark" ? "bg-white/3" : "bg-slate-50"
                              }`}
                            >
                              <div className={`w-24 h-24 rounded-2xl border ${t.border} overflow-hidden flex items-center justify-center`}>
                                {settings.schoolLogo ? (
                                  <img
                                    src={settings.schoolLogo}
                                    alt="School logo"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className={`text-[10px] ${t.muted}`}>No logo</span>
                                )}
                              </div>
                              <label className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold cursor-pointer">
                                Upload Logo
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                                />
                              </label>
                              {settings.schoolLogo && (
                                <button
                                  onClick={() => setSettings((p) => ({ ...p, schoolLogo: "" }))}
                                  className={`text-[11px] ${t.sub} hover:text-red-400`}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid gap-3">
                              <Field label="School Name" theme={theme}>
                                <Inp
                                  theme={theme}
                                  value={settings.schoolName}
                                  onChange={(e) =>
                                    setSettings((p) => ({ ...p, schoolName: e.target.value }))
                                  }
                                />
                              </Field>
                              <Field label="School Address" theme={theme}>
                                <Inp
                                  theme={theme}
                                  value={settings.schoolAddress}
                                  onChange={(e) =>
                                    setSettings((p) => ({ ...p, schoolAddress: e.target.value }))
                                  }
                                />
                              </Field>
                            </div>
                          </div>
                        </div>

                        <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                          <h3 className={`text-xs font-bold ${t.sub}`}>Theme & Branding</h3>
                          <div className="mt-3 grid gap-3">
                            <div>
                              <Lbl theme={theme}>Accent Color</Lbl>
                              <Sel
                                theme={theme}
                                whiteInDark
                                value={settings.accent}
                                onChange={(e) =>
                                  setSettings((p) => ({ ...p, accent: e.target.value }))
                                }
                              >
                                <option value="amber">Amber</option>
                                <option value="emerald">Emerald</option>
                                <option value="sky">Sky</option>
                                <option value="rose">Rose</option>
                              </Sel>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {activeSettingsTab === 'rules' && (
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4 col-span-1 lg:col-span-2`}>
                        <h3 className={`text-xs font-bold ${t.sub}`}>Library Rules</h3>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                          <Field label="Fine Rate (per day)" theme={theme}>
                            <Sel
                              theme={theme}
                              whiteInDark
                              value={settings.fineRate}
                              onChange={(e) =>
                                setSettings((p) => ({ ...p, fineRate: Number(e.target.value) || 0 }))
                              }
                            >
                              {[1, 2, 5, 10].map((rate) => (
                                <option key={rate} value={rate}>Rs {rate}</option>
                              ))}
                            </Sel>
                          </Field>
                          <Field label="Issue Days" theme={theme}>
                            <Sel
                              theme={theme}
                              whiteInDark
                              value={settings.issueDays}
                              onChange={(e) =>
                                setSettings((p) => ({ ...p, issueDays: Number(e.target.value) || 0 }))
                              }
                            >
                              {[7, 14, 21, 30].map((days) => (
                                <option key={days} value={days}>{days} days</option>
                              ))}
                            </Sel>
                          </Field>
                          <Field label="Max Books per Student" theme={theme}>
                            <Sel
                              theme={theme}
                              whiteInDark
                              value={settings.maxBooks}
                              onChange={(e) =>
                                setSettings((p) => ({ ...p, maxBooks: Number(e.target.value) || 0 }))
                              }
                            >
                              {[1, 2, 3, 4, 5, 6].map((count) => (
                                <option key={count} value={count}>{count} books</option>
                              ))}
                            </Sel>
                          </Field>
                          <Field label="Low Stock Threshold" theme={theme}>
                            <Sel
                              theme={theme}
                              whiteInDark
                              value={settings.lowStockThreshold}
                              onChange={(e) =>
                                setSettings((p) => ({ ...p, lowStockThreshold: Number(e.target.value) || 0 }))
                              }
                            >
                              {[1, 2, 3, 4, 5].map((count) => (
                                <option key={count} value={count}>{count} copies</option>
                              ))}
                            </Sel>
                          </Field>
                        </div>
                      </div>
                    )}

                    {activeSettingsTab === 'notifications' && (
                      <>
                        <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                          <h3 className={`text-xs font-bold ${t.sub}`}>Notification Channels</h3>
                          <div className="mt-3 grid gap-2">
                            <button
                              onClick={() => setSettings((p) => ({ ...p, notifyEmail: !p.notifyEmail }))}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border ${t.border} ${
                                settings.notifyEmail ? "bg-emerald-500 text-black" : `${t.card} ${t.sub}`
                              } transition-colors`}
                            >
                              Email Alerts
                            </button>
                            <button
                              onClick={() => setSettings((p) => ({ ...p, notifyWhatsApp: !p.notifyWhatsApp }))}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border ${t.border} ${
                                settings.notifyWhatsApp ? "bg-emerald-500 text-black" : `${t.card} ${t.sub}`
                              } transition-colors`}
                            >
                              WhatsApp Alerts
                            </button>
                            <button
                              onClick={() => setSettings((p) => ({ ...p, notifySms: !p.notifySms }))}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border ${t.border} ${
                                settings.notifySms ? "bg-emerald-500 text-black" : `${t.card} ${t.sub}`
                              } transition-colors`}
                            >
                              SMS Alerts
                            </button>
                          </div>
                        </div>

                        <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                          <h3 className={`text-xs font-bold ${t.sub}`}>Reminder Cadence & Quiet Hours</h3>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <Field label="Schedule" theme={theme}>
                              <Sel
                                theme={theme}
                                whiteInDark
                                value={settings.reminderCadence}
                                onChange={(e) =>
                                  setSettings((p) => ({ ...p, reminderCadence: e.target.value }))
                                }
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                              </Sel>
                            </Field>
                            <Field label="Remind Before Due" theme={theme}>
                              <Sel
                                theme={theme}
                                whiteInDark
                                value={settings.remindBefore}
                                onChange={(e) =>
                                  setSettings((p) => ({ ...p, remindBefore: Number(e.target.value) || 0 }))
                                }
                              >
                                {[1, 2, 3, 5, 7].map((d) => (
                                  <option key={d} value={d}>{d} days</option>
                                ))}
                              </Sel>
                            </Field>
                            <Field label="Quiet Start" theme={theme}>
                              <Inp
                                theme={theme}
                                type="time"
                                value={settings.quietStart}
                                onChange={(e) =>
                                  setSettings((p) => ({ ...p, quietStart: e.target.value }))
                                }
                              />
                            </Field>
                            <Field label="Quiet End" theme={theme}>
                              <Inp
                                theme={theme}
                                type="time"
                                value={settings.quietEnd}
                                onChange={(e) =>
                                  setSettings((p) => ({ ...p, quietEnd: e.target.value }))
                                }
                              />
                            </Field>
                          </div>
                        </div>
                      </>
                    )}

                    {activeSettingsTab === 'advanced' && (
                      <>
                        <div className={`${t.card} border ${t.border} rounded-2xl p-4 col-span-1 lg:col-span-2`}>
                          <h3 className={`text-xs font-bold ${t.sub}`}>Backup & Restore</h3>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="space-y-3">
                              <button
                                onClick={handleExportData}
                                className="w-full px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                              >
                                Export Backup JSON
                              </button>
                              <p className={`text-xs ${t.muted}`}>Download a complete copy of your library database (books, students, issues, settings).</p>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <Lbl theme={theme}>Import Backup JSON</Lbl>
                                <textarea
                                  value={backupText}
                                  onChange={(e) => setBackupText(e.target.value)}
                                  className={`w-full min-h-[80px] border rounded-xl px-3 py-2 text-xs outline-none ${t.inp}`}
                                  placeholder="Paste backup JSON here..."
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleImportData(backupText)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border ${t.border} ${t.card}`}
                                >
                                  Import from Text
                                </button>
                                <label className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold cursor-pointer">
                                  Import from File
                                  <input
                                    type="file"
                                    accept="application/json"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        const text = String(reader.result || "");
                                        setBackupText(text);
                                        handleImportData(text);
                                      };
                                      reader.readAsText(file);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                    <h3 className={`text-xs font-bold ${t.sub}`}>Librarian Preferences</h3>
                    <div className="mt-3 grid gap-3">
                      <div>
                        <Lbl theme={theme}>Accent Color</Lbl>
                        <Sel
                          theme={theme}
                          whiteInDark
                          value={settings.accent}
                          onChange={(e) =>
                            setSettings((p) => ({ ...p, accent: e.target.value }))
                          }
                        >
                          <option value="amber">Amber</option>
                          <option value="emerald">Emerald</option>
                          <option value="sky">Sky</option>
                          <option value="rose">Rose</option>
                        </Sel>
                      </div>
                    </div>
                  </div>
                  <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                    <h3 className={`text-xs font-bold ${t.sub}`}>Quick Tools</h3>
                    <div className="mt-3 grid gap-2 text-xs">
                      <p className={t.sub}>Use Notifications tab for bulk reminders and alerts.</p>
                      <p className={t.sub}>Contact admin for policy or backup changes.</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
    </>
  );
}
