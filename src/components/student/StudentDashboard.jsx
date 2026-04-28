import { BookOpen, Sun, Moon, LogOut, RotateCcw, IndianRupee } from "lucide-react";
import { T, ACCENTS } from "../../utils/constants";
import { StatCard } from "../ui";
import { fmt, calcFine } from "../../utils/helpers";

export function StudentDashboard({ student, issues, books, settings, onBack, theme, toggleTheme }) {
  const t = T[theme];
  const accent = ACCENTS[settings.accent] || ACCENTS.amber;
  const studentIssues = issues.filter((i) => i.studentId === student.id);
  const totalFine = studentIssues.reduce(
    (sum, i) => sum + calcFine(i.dueDate, settings.fineRate),
    0
  );

  return (
    <div
      className={`min-h-screen ${t.bg} accent-scope`}
      style={{ fontFamily: "'Sora','Segoe UI',sans-serif", "--accent-rgb": accent.rgb }}
    >
      <header className={`h-16 ${t.sidebar} border-b ${t.border} flex items-center justify-between px-5`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className={`text-sm font-bold ${t.text}`}>{settings.schoolName}</p>
            <p className={`text-xs ${t.muted}`}>Student Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border ${t.border} ${t.card} ${t.sub}`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={onBack}
            className={`p-2 rounded-xl border ${t.border} ${t.card} ${t.sub}`}
            title="Back"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-5 space-y-5">
        <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={`text-sm ${t.sub}`}>Student</p>
              <h2 className={`text-xl font-black ${t.text}`}>{student.name}</h2>
              <p className={`text-xs ${t.muted}`}>ID: {student.id} · Roll: {student.rollNo}</p>
            </div>
            <div className="flex gap-4">
              <StatCard label="Issued" value={studentIssues.length} sub="Active" icon={RotateCcw} color="amber" theme={theme} />
              <StatCard label="Total Fine" value={`Rs ${totalFine}`} sub="Due" icon={IndianRupee} color="red" theme={theme} />
            </div>
          </div>
        </section>

        <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
          <h3 className={`text-sm font-bold ${t.text}`}>Library Card</h3>
          <div className="mt-4">
            <div className={`w-[340px] max-w-full rounded-xl border ${t.border} ${t.card} p-4 shadow-sm`}>
              <p className={`text-xs ${t.sub}`}>{settings.schoolName}</p>
              <p className={`text-base font-black ${t.text}`}>Library Card</p>
              <div className="mt-3 text-xs">
                <p className={t.text}>Name: {student.name}</p>
                <p className={t.text}>ID: {student.id}</p>
                <p className={t.text}>Class: {student.class}{student.section}</p>
                <p className={t.text}>Parent: {student.contact}</p>
              </div>
              <div className="mt-3 rounded-lg border border-dashed border-slate-400/40 p-2 text-center text-xs font-mono text-slate-500">
                ||| {student.id} |||
              </div>
            </div>
          </div>
        </section>

        <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
          <h3 className={`text-sm font-bold ${t.text}`}>Issued Books</h3>
          <div className="mt-4 overflow-x-auto">
            <table className={`w-full text-sm ${t.text}`}>
              <thead className={t.th}>
                <tr>
                  <th className="p-2 text-left">Book</th>
                  <th className="p-2 text-left">Issue Date</th>
                  <th className="p-2 text-left">Due Date</th>
                  <th className="p-2 text-left">Fine</th>
                </tr>
              </thead>
              <tbody>
                {studentIssues.map((i) => {
                  const book = books.find((b) => b.id === i.bookId);
                  const fine = calcFine(i.dueDate, settings.fineRate);
                  return (
                    <tr key={i.id} className={`border-t ${t.tr}`}>
                      <td className="p-2">{book?.title || "-"}</td>
                      <td className="p-2">{fmt(i.issueDate)}</td>
                      <td className="p-2">{fmt(i.dueDate)}</td>
                      <td className="p-2">Rs {fine}</td>
                    </tr>
                  );
                })}
                {studentIssues.length === 0 && (
                  <tr>
                    <td className={`p-3 ${t.muted}`} colSpan={4}>
                      No issued books.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
