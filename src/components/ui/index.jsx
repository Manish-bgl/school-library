import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { T } from "../../utils/constants";

export function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold min-w-72 ${
            t.type === "success"
              ? "bg-emerald-600"
              : t.type === "error"
              ? "bg-red-600"
              : "bg-blue-600"
          }`}
        >
          {t.type === "error" ? (
            <XCircle size={18} />
          ) : t.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {t.message}
          <button
            onClick={() => remove(t.id)}
            className="ml-auto opacity-70 hover:opacity-100 p-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, wide, theme }) {
  const t = T[theme];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative ${wide ? "w-full max-w-4xl" : "w-full max-w-md"} ${
          t.modal
        } rounded-3xl shadow-2xl overflow-hidden border ${t.border} flex flex-col max-h-[90vh]`}
      >
        <div className={`p-4 border-b ${t.border} flex justify-between items-center bg-white/5`}>
          <h3 className={`font-black text-lg ${t.text}`}>{title}</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl hover:bg-white/10 ${t.sub} transition-colors`}
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ color, children }) {
  const colors = {
    green: "bg-emerald-500/15 text-emerald-500",
    red: "bg-red-500/15 text-red-500",
    amber: "bg-amber-500/15 text-amber-500",
    blue: "bg-sky-500/15 text-sky-500",
    gray: "bg-slate-500/15 text-slate-400",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-black ${
        colors[color] || colors.gray
      }`}
    >
      {children}
    </span>
  );
}

export function StatCard({ label, value, sub, icon: Icon, color, theme }) {
  const t = T[theme];
  return (
    <div
      className={`p-6 rounded-3xl border ${t.border} ${t.card} relative overflow-hidden group hover:border-${color}-500/50 transition-all`}
    >
      <div
        className={`absolute -right-6 -top-6 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl group-hover:bg-${color}-500/20 transition-all`}
      />
      <div className="flex justify-between items-start relative">
        <div>
          <p className={`text-sm font-bold ${t.sub} mb-1`}>{label}</p>
          <p className={`text-3xl font-black ${t.text}`}>{value}</p>
          {sub && <p className="text-xs text-emerald-500 mt-2 font-bold">{sub}</p>}
        </div>
        <div
          className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500 border border-${color}-500/20`}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

export function Pg({ total, page, perPage, setPage, theme }) {
  const t = T[theme];
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="flex gap-1 mt-4">
      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          onClick={() => setPage(i + 1)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
            page === i + 1
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
              : `bg-transparent border ${t.border} ${t.sub} hover:border-amber-500/50`
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
