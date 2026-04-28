import { T } from "../../utils/constants";

export function Inp({ theme, ...props }) {
  const t = T[theme];
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all outline-none ${t.inp} ${
        props.className || ""
      }`}
    />
  );
}

export function Sel({ theme, className = "", whiteInDark = true, children, ...props }) {
  const t = T[theme];
  const isDark = theme === "dark";
  const bg = isDark ? (whiteInDark ? "bg-white text-black" : "bg-white/5 text-white") : "bg-white text-black";
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all outline-none ${t.inp} ${bg} ${className}`}
    >
      {children}
    </select>
  );
}

export function Lbl({ theme, children }) {
  const t = T[theme];
  return <label className={`block text-xs font-bold ${t.sub} mb-2 uppercase tracking-wider`}>{children}</label>;
}

export function Field({ label, theme, children }) {
  return (
    <div>
      <Lbl theme={theme}>{label}</Lbl>
      {children}
    </div>
  );
}
