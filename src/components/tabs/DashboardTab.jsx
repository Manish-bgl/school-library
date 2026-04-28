import React from "react";
import { BookOpen, Users, RotateCcw, IndianRupee, Activity, Clock, TrendingUp, UserCheck, BarChart2 } from "lucide-react";
import { StatCard } from "../ui";

export default function DashboardTab({ 
  t, 
  theme, 
  stats, 
  log, 
  dashboardFocus, 
  weeklyIssued, 
  setTab, 
  setStudentModalOpen, 
  setBookModalOpen 
}) {
  return (
    <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5">
        <button onClick={() => setTab("books")} className="text-left">
          <StatCard label="Books" value={stats.totalBooks} sub="Total stock" icon={BookOpen} color="blue" theme={theme} />
        </button>
        <button onClick={() => setTab("students")} className="text-left">
          <StatCard label="Students" value={stats.totalStudents} sub="Active members" icon={Users} color="teal" theme={theme} />
        </button>
        <button onClick={() => setTab("issues")} className="text-left">
          <StatCard label="Issued" value={stats.issued} sub="Not returned" icon={RotateCcw} color="amber" theme={theme} />
        </button>
        <button onClick={() => setTab("fines")} className="text-left">
          <StatCard label="Total Fine" value={`Rs ${stats.totalFine}`} sub="Overdue" icon={IndianRupee} color="red" theme={theme} />
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <div className="space-y-4">
          <h3 className={`text-sm font-bold ${t.text} flex items-center gap-2`}>
            <Activity size={18} className="text-amber-500" /> Recent Activity
          </h3>
          <div className={`rounded-2xl border ${t.border} overflow-hidden ${t.card}`}>
            {log.slice(0, 4).map((entry, idx) => (
              <div key={entry.id} className={`p-4 ${idx !== 0 ? `border-t ${t.border}` : ''} ${t.hover}`}>
                <p className={`text-sm font-medium ${t.text}`}>{entry.action}</p>
                <p className={`text-xs mt-1 flex items-center gap-1 ${t.muted}`}>
                  <Clock size={12} /> {entry.time} · {entry.user}
                </p>
              </div>
            ))}
            {log.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">No recent activity</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className={`text-sm font-bold ${t.text} flex items-center gap-2`}>
            <TrendingUp size={18} className="text-emerald-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setTab("issues")}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${t.border} ${t.hover} transition-colors ${t.card}`}
            >
              <RotateCcw size={24} className="text-amber-500 mb-2" />
              <span className={`text-sm font-bold ${t.text}`}>Issue Book</span>
            </button>
            <button 
              onClick={() => setStudentModalOpen(true)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${t.border} ${t.hover} transition-colors ${t.card}`}
            >
              <UserCheck size={24} className="text-teal-500 mb-2" />
              <span className={`text-sm font-bold ${t.text}`}>Add Student</span>
            </button>
            <button 
              onClick={() => setBookModalOpen(true)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${t.border} ${t.hover} transition-colors ${t.card}`}
            >
              <BookOpen size={24} className="text-blue-500 mb-2" />
              <span className={`text-sm font-bold ${t.text}`}>Add Book</span>
            </button>
            <button 
              onClick={() => setTab("reports")}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${t.border} ${t.hover} transition-colors ${t.card}`}
            >
              <BarChart2 size={24} className="text-purple-500 mb-2" />
              <span className={`text-sm font-bold ${t.text}`}>View Reports</span>
            </button>
          </div>
        </div>
      </div>

      {!dashboardFocus && (
        <div className="mt-5">
          <h3 className={`text-xs font-bold ${t.sub} mb-2`}>Weekly Issued Graph</h3>
          <div className={`p-4 rounded-2xl border ${t.border} ${t.card} shadow-lg shadow-emerald-500/10`}>
            {(() => {
              const maxCount = Math.max(1, ...weeklyIssued.map((d) => d.count));
              return (
                <div className="h-40 flex items-end gap-3">
                  {weeklyIssued.map((d) => {
                    const isPeak = d.count === maxCount;
                    return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                      <span className={`text-[10px] ${t.muted}`}>{d.count}</span>
                      <div
                        className={`w-full rounded-xl bg-gradient-to-t ${
                          isPeak ? "from-amber-500/80 to-amber-300/50" : "from-emerald-500/70 to-emerald-300/40"
                        }`}
                        style={{ height: `${Math.max(16, 22 + Math.sqrt(d.count / maxCount) * 74)}px` }}
                        title={`${d.count} issued`}
                      />
                      <span className={`text-[10px] ${t.muted}`}>{d.day.slice(5)}</span>
                    </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
