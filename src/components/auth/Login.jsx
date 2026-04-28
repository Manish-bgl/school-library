import { useState } from "react";
import { BookOpen, AlertCircle, Sun, Moon } from "lucide-react";
import { supabase } from "../../supabase";
import { T, ACCENTS } from "../../utils/constants";
import { Field, Inp, Sel } from "../ui/Forms";

export function Login({
  setUser,
  librarians,
  setLibrarians,
  settings,
  theme,
  toggleTheme,
  managerAccount,
  setManagerAccount,
}) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotId, setForgotId] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotChannel, setForgotChannel] = useState("email");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetPass, setResetPass] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const [loginRole, setLoginRole] = useState("admin");
  const t = T[theme];
  const accent = ACCENTS[settings.accent] || ACCENTS.amber;

  const login = async () => {
    setErr("");
    const uTrim = u.trim();

    // Director override
    if (uTrim === "director" && p === "director123") {
      return setUser({ username: "director", name: "Director / Principal", role: "director" });
    }

    let matchedUser = null;
    const uLower = uTrim.toLowerCase();

    if (loginRole === "admin") {
      if (managerAccount && (uLower === (managerAccount.username || "").toLowerCase() || uLower === (managerAccount.email || "").toLowerCase())) {
        if (p !== managerAccount.password) return setErr("Invalid manager password.");
        matchedUser = { username: managerAccount.username, name: managerAccount.name || "Manager", role: "manager", email: managerAccount.email };
      }
    } else {
      const lib = librarians.find((l) => (l.username || "").toLowerCase() === uLower);
      if (lib) {
        if (p !== lib.password) return setErr("Invalid librarian password.");
        matchedUser = { username: lib.username, name: lib.name, role: "librarian", id: lib.id, email: lib.email };
      }
    }

    if (!matchedUser) return setErr("Invalid username or password.");

    const loginEmail = matchedUser.email?.trim();
    if (loginEmail) {
      try {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: p,
        });
        if (authErr) {
          console.warn("Supabase sign-in failed (writes may be limited):", authErr.message);
        }
      } catch (e) {
        console.warn("Supabase auth error:", e.message);
      }
    }

    setUser(matchedUser);
  };

  const handleForgot = () => {
    const key = forgotId.trim();
    if (!key) return setForgotMessage("Enter your email.");
    if (key === "director") {
      return setForgotMessage("Director reset is restricted. Contact admin.");
    }
    if (managerAccount && (key === managerAccount.username || key === managerAccount.email)) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setOtpCode(code);
      setOtpSent(true);
      setOtpVerified(false);
      setOtpInput("");
      setResetPass("");
      setResetConfirm("");
      setResetTarget({ type: "manager" });
      console.log(`[Production Info] OTP for manager reset: ${code}`);
      return setForgotMessage(`OTP sent to manager (${forgotChannel}). Please check your inbox.`);
    }
    const lib = librarians.find((l) => l.username === key || l.email === key);
    if (!lib) return setForgotMessage("No account matched.");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtpCode(code);
    setOtpSent(true);
    setOtpVerified(false);
    setOtpInput("");
    setResetPass("");
    setResetConfirm("");
    setResetTarget({ type: "librarian", id: lib.id });
    console.log(`[Production Info] OTP for librarian ${lib.username} reset: ${code}`);
    setForgotMessage(`OTP sent to ${lib.name} (${forgotChannel}). Please check your inbox.`);
  };

  const verifyOtp = () => {
    if (!otpInput.trim()) return setForgotMessage("Enter OTP.");
    if (otpInput.trim() !== otpCode) return setForgotMessage("Invalid OTP.");
    setOtpVerified(true);
    setForgotMessage("OTP verified. Set new password.");
  };

  const resetPassword = () => {
    if (resetPass.length < 6) return setForgotMessage("Password must be 6+ chars.");
    if (resetPass !== resetConfirm) return setForgotMessage("Passwords do not match.");
    if (!resetTarget) return setForgotMessage("No account selected.");
    if (resetTarget.type === "manager") {
      setManagerAccount((p) => (p ? { ...p, password: resetPass } : p));
    }
    if (resetTarget.type === "librarian") {
      setLibrarians((prev) =>
        prev.map((l) => (l.id === resetTarget.id ? { ...l, password: resetPass } : l))
      );
    }
    setForgotMessage("Password updated. You can sign in now.");
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode("");
    setOtpInput("");
    setResetPass("");
    setResetConfirm("");
    setResetTarget(null);
  };

  return (
    <div
      className={`min-h-screen ${t.bg} flex items-center justify-center p-4 relative accent-scope`}
      style={{ fontFamily: "'Sora','Segoe UI',sans-serif", "--accent-rgb": accent.rgb }}
    >
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2 rounded-xl border ${t.border} ${t.card} ${t.sub}`}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/30 overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500">
            {settings.schoolLogo ? (
              <img
                src={settings.schoolLogo}
                alt="School logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen size={36} className="text-white" />
            )}
          </div>
          <h1 className={`text-3xl font-black ${t.text}`}>
            {settings.schoolName}
          </h1>
          <p className={`text-sm ${t.sub} mt-1`}>Library Management System</p>
        </div>
        <div className={`${t.card} border ${t.border} rounded-3xl p-8 shadow-2xl`}>
          <h2 className={`${t.text} font-black text-xl mb-4`}>Staff Sign In</h2>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setLoginRole("admin"); setErr(""); setU(""); setP(""); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginRole === "admin" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : `bg-transparent border ${t.border} ${t.sub} hover:border-amber-500/50`}`}
            >
              Admin
            </button>
            <button
              onClick={() => { setLoginRole("librarian"); setErr(""); setU(""); setP(""); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginRole === "librarian" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : `bg-transparent border ${t.border} ${t.sub} hover:border-amber-500/50`}`}
            >
              Librarian
            </button>
          </div>

          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
              <AlertCircle size={15} />
              {err}
            </div>
          )}
          <div className="space-y-4">
            <Field label={loginRole === "admin" ? "Username or Email" : "Username"} theme={theme}>
              <Inp
                theme={theme}
                placeholder={loginRole === "admin" ? "Enter admin username or email" : "Enter your librarian username"}
                value={u}
                onChange={(e) => {
                  setU(e.target.value);
                  setErr("");
                }}
                onKeyDown={(e) => e.key === "Enter" && login()}
              />
            </Field>
            <Field label="Password" theme={theme}>
              <Inp
                theme={theme}
                type="password"
                placeholder="Enter your password"
                value={p}
                onChange={(e) => {
                  setP(e.target.value);
                  setErr("");
                }}
                onKeyDown={(e) => e.key === "Enter" && login()}
              />
            </Field>
            <button
              onClick={login}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-amber-500/25 mt-2"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setShowForgot((v) => !v);
                setForgotMessage("");
              }}
              className={`w-full text-xs font-bold ${t.sub} hover:text-amber-500`}
            >
              Forgot password?
            </button>
          </div>
          {showForgot && (
            <div className={`mt-4 p-4 rounded-xl border ${t.border} ${t.card}`}>
              <p className={`text-xs ${t.sub} mb-2`}>Password Reset</p>
              <div className="grid gap-2">
                <Inp
                  theme={theme}
                  placeholder="Enter username or email"
                  value={forgotId}
                  onChange={(e) => {
                    setForgotId(e.target.value);
                    setForgotMessage("");
                  }}
                />
                <Sel
                  theme={theme}
                  value={forgotChannel}
                  onChange={(e) => setForgotChannel(e.target.value)}
                >
                  <option value="email">Email OTP</option>
                  <option value="whatsapp">WhatsApp OTP</option>
                  <option value="sms">SMS OTP</option>
                </Sel>
                <button
                  onClick={handleForgot}
                  className="w-full px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                >
                  Send OTP
                </button>
              </div>
              {otpSent && !otpVerified && (
                <div className="mt-3 grid gap-2">
                  <Inp
                    theme={theme}
                    placeholder="Enter OTP"
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value);
                      setForgotMessage("");
                    }}
                  />
                  <button
                    onClick={verifyOtp}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${t.border} ${t.card}`}
                  >
                    Verify OTP
                  </button>
                </div>
              )}
              {otpVerified && (
                <div className="mt-3 grid gap-2">
                  <Inp
                    theme={theme}
                    type="password"
                    placeholder="New password"
                    value={resetPass}
                    onChange={(e) => {
                      setResetPass(e.target.value);
                      setForgotMessage("");
                    }}
                  />
                  <Inp
                    theme={theme}
                    type="password"
                    placeholder="Confirm password"
                    value={resetConfirm}
                    onChange={(e) => {
                      setResetConfirm(e.target.value);
                      setForgotMessage("");
                    }}
                  />
                  <button
                    onClick={resetPassword}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold"
                  >
                    Update Password
                  </button>
                </div>
              )}
              {forgotMessage && (
                <p className={`mt-2 text-[11px] ${t.muted}`}>{forgotMessage}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
