import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine } from "../../utils/helpers";

export default function BooksTab({ t, theme, books, bookSearch, setBookSearch, bookFilters, setBookFilters, setBookModalOpen, setBookFormData, handleDeleteBook, user }) {
  const tab = "books";
  return (
    <>
          {tab === "books" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Books</h2>
                <button
                  onClick={() => setBookModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                >
                  Add Book
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sel
                    theme={theme}
                    className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                    style={{
                      color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                      backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                    }}
                    value={bookFilters.format}
                    onChange={(e) =>
                      setBookFilters((p) => ({ ...p, format: e.target.value }))
                    }
                  >
                    <option value="">All Formats</option>
                    <option value="Hardcover">Hardcover</option>
                    <option value="Paperback">Paperback</option>
                    <option value="eBook">eBook</option>
                  </Sel>
                  <Sel
                    theme={theme}
                    className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                    style={{
                      color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                      backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                    }}
                    value={bookFilters.language}
                    onChange={(e) =>
                      setBookFilters((p) => ({ ...p, language: e.target.value }))
                    }
                  >
                    <option value="">All Languages</option>
                    {[...new Set(books.map((b) => b.language).filter(Boolean))].map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </Sel>
                  <label className={`text-xs ${t.sub} flex items-center gap-2`}>
                    <input
                      type="checkbox"
                      checked={bookFilters.availableOnly}
                      onChange={(e) =>
                        setBookFilters((p) => ({ ...p, availableOnly: e.target.checked }))
                      }
                    />
                    Available only
                  </label>
                </div>
                <div className="w-full max-w-xs">
                  <Inp
                    theme={theme}
                    placeholder="Search books..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Inp
                  theme={theme}
                  placeholder="Filter by author"
                  value={bookFilters.author}
                  onChange={(e) => setBookFilters((p) => ({ ...p, author: e.target.value }))}
                />
                <Inp
                  theme={theme}
                  placeholder="Filter by publisher"
                  value={bookFilters.publisher}
                  onChange={(e) => setBookFilters((p) => ({ ...p, publisher: e.target.value }))}
                />
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={bookFilters.year}
                  onChange={(e) => setBookFilters((p) => ({ ...p, year: e.target.value }))}
                >
                  <option value="">All Years</option>
                  {[...new Set(books.map((b) => b.year).filter(Boolean))]
                    .sort((a, b) => b - a)
                    .map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                </Sel>
                <Inp
                  theme={theme}
                  placeholder="Filter by tag"
                  value={bookFilters.tag}
                  onChange={(e) => setBookFilters((p) => ({ ...p, tag: e.target.value }))}
                />
              </div>
              <div className="mt-4 space-y-6">
                {(() => {
                  const q = bookSearch.trim().toLowerCase();
                  const authorQuery = bookFilters.author.trim().toLowerCase();
                  const publisherQuery = bookFilters.publisher.trim().toLowerCase();
                  const tagQuery = bookFilters.tag.trim().toLowerCase();
                  const suggestionMap = new Map();
                  const addSuggestion = (type, label) => {
                    if (!label) return;
                    const key = `${type}:${String(label).toLowerCase()}`;
                    if (suggestionMap.has(key)) return;
                    suggestionMap.set(key, { type, label });
                  };
                  if (q) {
                    books.forEach((b) => {
                      if (b.title?.toLowerCase().includes(q)) addSuggestion("search", b.title);
                      if (b.author?.toLowerCase().includes(q)) addSuggestion("search", b.author);
                      if (b.publisher?.toLowerCase().includes(q)) addSuggestion("search", b.publisher);
                      (b.tags || []).forEach((t) => {
                        if (String(t).toLowerCase().includes(q)) addSuggestion("search", t);
                      });
                    });
                  }
                  if (authorQuery) {
                    [...new Set(books.map((b) => b.author).filter(Boolean))]
                      .filter((a) => String(a).toLowerCase().includes(authorQuery))
                      .forEach((a) => addSuggestion("author", a));
                  }
                  if (publisherQuery) {
                    [...new Set(books.map((b) => b.publisher).filter(Boolean))]
                      .filter((p) => String(p).toLowerCase().includes(publisherQuery))
                      .forEach((p) => addSuggestion("publisher", p));
                  }
                  if (tagQuery) {
                    [...new Set(books.flatMap((b) => b.tags || []))]
                      .filter((t) => String(t).toLowerCase().includes(tagQuery))
                      .forEach((t) => addSuggestion("tag", t));
                  }
                  const suggestions = Array.from(suggestionMap.values()).slice(0, 8);
                  const filtered = books.filter((b) => {
                    if (bookFilters.format && b.format !== bookFilters.format) return false;
                    if (bookFilters.language && b.language !== bookFilters.language) return false;
                    if (bookFilters.year && String(b.year) !== String(bookFilters.year)) return false;
                    if (authorQuery && !String(b.author).toLowerCase().includes(authorQuery)) return false;
                    if (publisherQuery && !String(b.publisher).toLowerCase().includes(publisherQuery)) return false;
                    if (tagQuery) {
                      const tags = (b.tags || []).map((t) => String(t).toLowerCase());
                      if (!tags.some((t) => t.includes(tagQuery))) return false;
                    }
                    if (bookFilters.availableOnly && b.available <= 0) return false;
                    if (!q) return true;
                    return [
                      b.title,
                      b.author,
                      b.genre,
                      b.publisher,
                      b.id,
                      b.isbn,
                      (b.tags || []).join(" "),
                    ]
                      .filter(Boolean)
                      .some((v) => String(v).toLowerCase().includes(q));
                  });
                  const issueCounts = (issues || []).reduce((acc, i) => {
                    acc[i.bookId] = (acc[i.bookId] || 0) + 1;
                    return acc;
                  }, {});
                  const topIssued = [...filtered]
                    .map((b) => ({ ...b, issueCount: issueCounts[b.id] || 0 }))
                    .sort((a, b) => b.issueCount - a.issueCount)
                    .slice(0, 5);
                  const byGenre = filtered.reduce((acc, b) => {
                    const g = b.genre || "Other";
                    acc[g] = acc[g] || [];
                    acc[g].push(b);
                    return acc;
                  }, {});
                  const genres = Object.keys(byGenre);
                  if (genres.length === 0) {
                    return (
                      <p className={`text-xs ${t.muted}`}>No books match your search.</p>
                    );
                  }
                  return (
                    <>
                      {suggestions.length > 0 && (
                        <div className={`p-3 rounded-xl border ${t.border} ${t.card}`}>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.map((s) => (
                              <button
                                key={`${s.type}-${s.label}`}
                                onClick={() => {
                                  if (s.type === "author") {
                                    setBookFilters((p) => ({ ...p, author: s.label }));
                                  } else if (s.type === "publisher") {
                                    setBookFilters((p) => ({ ...p, publisher: s.label }));
                                  } else if (s.type === "tag") {
                                    setBookFilters((p) => ({ ...p, tag: s.label }));
                                  } else {
                                    setBookSearch(s.label);
                                  }
                                }}
                                className={`px-3 py-1 rounded-full text-[11px] border ${t.border} ${t.sub}`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {topIssued.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-xs font-bold ${t.sub}`}>Top 5 Most Issued</h3>
                          </div>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {topIssued.map((b) => (
                              <div
                                key={b.id}
                                className={`min-w-[220px] ${t.card} border ${t.border} rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10`}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedBook(b)}
                                onKeyDown={(e) => e.key === "Enter" && setSelectedBook(b)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <p className={`text-xs font-bold ${t.sub}`}>{b.displayId || b.id}</p>
                                  <Badge color="amber">{b.issueCount} issues</Badge>
                                </div>
                                <p className={`text-sm font-black ${t.text}`}>{b.title}</p>
                                <p className={`text-xs ${t.muted}`}>{b.author}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {genres.map((genre) => (
                  <div key={genre}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-xs font-bold ${t.sub}`}>{genre}</h3>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {byGenre[genre].map((b) => (
                        <div
                          key={b.id}
                          className={`min-w-[220px] ${t.card} border ${t.border} rounded-2xl p-4 pb-12 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 relative group`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedBook(b)}
                          onKeyDown={(e) => e.key === "Enter" && setSelectedBook(b)}
                        >
                          <div className="h-28 rounded-xl bg-gradient-to-br from-amber-500/20 via-sky-500/10 to-emerald-500/20 overflow-hidden mb-3">
                            <div
                              className={`h-full w-full flex items-center justify-center text-3xl font-black transition-transform duration-300 group-hover:scale-105 ${
                                theme === "dark" ? "text-slate-200/40" : "text-slate-700/40"
                              }`}
                            >
                              {b.title?.slice(0, 1) || "B"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                              <BookOpen size={16} />
                            </div>
                            <p className={`text-xs font-bold ${t.sub}`}>{b.displayId || b.id}</p>
                          </div>
                          <p className={`text-sm font-black ${t.text}`}>{b.title}</p>
                          <p className={`text-xs ${t.muted}`}>{b.author}</p>
                          <div className="mt-3 text-xs space-y-1">
                            <p className={t.sub}>Publisher: {b.publisher || "-"}</p>
                            <p className={t.sub}>Year: {b.year}</p>
                            <p className={t.sub}>Language: {b.language || "-"}</p>
                            <p className={t.sub}>Format: {b.format || "-"}</p>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${t.border} ${t.sub}`}>
                              <MapPin size={12} />
                              Shelf {b.shelf || "-"} Ã‚Â· Aisle {b.aisle || "-"}
                            </div>
                          </div>
                          {b.tags?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {b.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] border ${t.border} ${t.sub}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <span className={`${t.muted}`}>Available</span>
                            <span className={`font-bold ${t.text}`}>{b.available}/{b.total}</span>
                          </div>
                          <div className="absolute left-3 right-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTab("issues");
                                toast("Open Issue & Return panel", "success");
                              }}
                              className="flex-1 px-2 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold"
                            >
                              Issue
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast("Reservation marked", "success");
                              }}
                              className="flex-1 px-2 py-1 rounded-lg bg-amber-500 text-black text-[11px] font-bold"
                            >
                              Reserve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBook(b);
                              }}
                              className={`flex-1 px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-[11px] font-bold`}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </section>
          )}
    </>
  );
}
