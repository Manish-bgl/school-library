import { Printer } from "lucide-react";
import { T } from "../../utils/constants";

export function StudentCard({ student, qrDataUrl, schoolName, theme, onPrint }) {
  const t = T[theme];
  return (
    <div className={`${t.card} border ${t.border} rounded-2xl p-5`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${t.text}`}>Student ID Card</h3>
        <button
          onClick={onPrint}
          className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
        >
          Print Card
        </button>
      </div>
      <div className="mt-4">
        <div className={`w-[320px] h-[200px] max-w-full rounded-xl border ${t.border} ${t.card} p-4 shadow-sm`}>
          <p className={`text-xs ${t.sub}`}>{schoolName}</p>
          <p className={`text-base font-black ${t.text}`}>Library Card</p>
          <div className="mt-3 grid grid-cols-[1fr_96px] gap-3 items-start">
            <div className="text-xs">
              <p className={t.text}>Name: {student.name}</p>
              <p className={t.text}>ID: {student.id}</p>
              <p className={t.text}>Roll: {student.rollNo}</p>
              <p className={t.text}>Class: {student.class}{student.section}</p>
              <p className={t.text}>Parent: {student.contact}</p>
            </div>
            <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-400/40 p-1">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Student QR" className="w-20 h-20" />
              ) : (
                <span className={`text-[10px] ${t.muted}`}>QR Loading</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

