import { useState } from "react";
import { BookOpen, AlertCircle, Sun, Moon } from "lucide-react";
import { supabase } from "../../supabase";
import { T, ACCENTS } from "../../utils/constants";
import { Field, Inp } from "../ui/Forms";

export function ManagerRegister({ onRegister, settings, setSettings, theme, toggleTheme }) {
  const [form, setForm] = useState({
    schoolName: settings.schoolName || "",
    schoolAddress: settings.schoolAddress || "",
    managerName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [err, setErr] = useState("");
  const t = T[theme];
  const accent = ACCENTS[settings.accent] || ACCENTS.amber;

  const update = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErr("");
  };

  const submit = async () => {
    if (!form.schoolName.trim()) return setErr("School name is required.");
    if (!form.managerName.trim()) return setErr("Manager name is required.");
    if (!form.email.trim()) return setErr("Email is required for Supabase registration.");
    if (form.password.length < 6) return setErr("Password must be 6+ chars.");
    if (form.password !== form.confirm) return setErr("Passwords do not match.");
    
    try {
      setErr("");
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });
      
      if (authError) throw authError;
      
      const userId = authData?.user?.id;
      if (!userId) throw new Error("Registration failed: Could not get user ID.");

      // 2. Insert into profiles table
      const profileData = {
        id: userId,
        username: form.username.trim() || form.email.trim().split('@')[0],
        name: form.managerName.trim(),
        role: 'manager'
      };
      
      const { error: profileError } = await supabase.from('profiles').upsert([profileData]);
      if (profileError) {
         console.warn("Could not insert profile (RLS issue?):", profileError.message);
      }

      setSettings((p) => ({
        ...p,
        schoolName: form.schoolName.trim(),
        schoolAddress: form.schoolAddress.trim(),
      }));
      
      onRegister({
        username: form.username.trim() || form.email.trim().split('@')[0],
        password: form.password,
        name: form.managerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      setErr(error.message);
    }
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
      <div className="w-full max-w-3xl grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <div className={`${t.card} border ${t.border} rounded-3xl p-6 shadow-2xl`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <p className={`text-xs ${t.sub}`}>First Time Setup</p>
              <h2 className={`text-xl font-black ${t.text}`}>Register Manager</h2>
            </div>
          </div>
          <p className={`mt-4 text-sm ${t.sub}`}>
            Set up your school library with a manager account. This is required only once.
          </p>
          <div className="mt-5 space-y-3 text-xs">
            <div className={`p-3 rounded-xl border ${t.border} ${t.card}`}>
              <p className={`font-bold ${t.text}`}>Step 1</p>
              <p className={t.sub}>Enter school details.</p>
            </div>
            <div className={`p-3 rounded-xl border ${t.border} ${t.card}`}>
              <p className={`font-bold ${t.text}`}>Step 2</p>
              <p className={t.sub}>Create manager login credentials.</p>
            </div>
            <div className={`p-3 rounded-xl border ${t.border} ${t.card}`}>
              <p className={`font-bold ${t.text}`}>Step 3</p>
              <p className={t.sub}>Log in and start managing the library.</p>
            </div>
          </div>
        </div>

        <div className={`${t.card} border ${t.border} rounded-3xl p-6 shadow-2xl`}>
          <h3 className={`${t.text} font-black text-lg mb-4`}>Registration Form</h3>
          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
              <AlertCircle size={15} />
              {err}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="School Name" theme={theme}>
              <Inp
                theme={theme}
                value={form.schoolName}
                onChange={(e) => update("schoolName", e.target.value)}
              />
            </Field>
            <Field label="School Address" theme={theme}>
              <Inp
                theme={theme}
                value={form.schoolAddress}
                onChange={(e) => update("schoolAddress", e.target.value)}
              />
            </Field>
            <Field label="Manager Name" theme={theme}>
              <Inp
                theme={theme}
                value={form.managerName}
                onChange={(e) => update("managerName", e.target.value)}
              />
            </Field>

            <Field label="Email" theme={theme}>
              <Inp
                theme={theme}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
            <Field label="Phone" theme={theme}>
              <Inp
                theme={theme}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
            <Field label="Password" theme={theme}>
              <Inp
                theme={theme}
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </Field>
            <Field label="Confirm Password" theme={theme}>
              <Inp
                theme={theme}
                type="password"
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={submit}
              className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold"
            >
              Create Manager Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
