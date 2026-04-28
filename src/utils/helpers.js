export const todayStr = () => new Date().toISOString().split("T")[0];

export const genUUID = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { 
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8); 
  return v.toString(16); 
});

export const nameFromEmail = (email) => {
  if (!email) return "User";
  const [name] = email.split("@");
  return name || "User";
};

export const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

export const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export const fmt = (dStr) => {
  if (!dStr) return "-";
  try {
    return new Date(dStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dStr;
  }
};

export const calcFine = (dueDate, fineRate) => {
  if (!dueDate || !fineRate) return 0;
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * fineRate : 0;
};

export const genId = (prefix, list) => {
  if (!list || list.length === 0) return `${prefix}001`;
  const maxNum = Math.max(
    ...list.map((item) => {
      const num = parseInt(String(item.id).replace(prefix, ""), 10);
      return isNaN(num) ? 0 : num;
    })
  );
  return `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
};

export const validateStudentField = (key, value) => {
  const v = String(value || "").trim();
  switch (key) {
    case "name": return !v ? "Name is required" : "";
    case "rollNo": return !v ? "Roll No is required" : "";
    case "class": return !v ? "Class is required" : "";
    case "contact":
      if (!v) return "Contact is required";
      if (!/^\d{10}$/.test(v)) return "Must be 10 digits";
      return "";
    case "email":
      if (v && !/\S+@\S+\.\S+/.test(v)) return "Invalid email";
      return "";
    default: return "";
  }
};

export const validateBookField = (key, value) => {
  const v = String(value || "").trim();
  switch (key) {
    case "title": return !v ? "Title is required" : "";
    case "author": return !v ? "Author is required" : "";
    case "genre": return !v ? "Category is required" : "";
    case "isbn":
      if (v && !/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(v)) return "Invalid ISBN format";
      return "";
    case "year":
      if (v && (isNaN(v) || v < 1000 || v > new Date().getFullYear())) return "Invalid year";
      return "";
    case "total":
      if (!v || isNaN(v) || parseInt(v) < 1) return "Must be at least 1";
      return "";
    default: return "";
  }
};

export const fetchOrCreateProfile = async (authUser, supabase) => {
  if (!authUser) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
  if (error && error.code !== "PGRST116") {
    console.error("Profile fetch error:", error);
    return { error: "Database error: profiles table might be missing. Please run the SQL schema." };
  }
  let profile = data;
  if (!profile) {
    const metaRole = authUser?.user_metadata?.role;
    const { data: inserted, error: insErr } = await supabase.from("profiles").insert({
      id: authUser.id,
      name: nameFromEmail(authUser.email),
      role: metaRole || "librarian"
    }).select("*").single();
    profile = inserted;
    if (insErr) {
      console.error("Profile insert error:", insErr);
      return { error: "Failed to create profile. Ensure 'profiles' table exists." };
    }
  }
  if (!profile) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    username: nameFromEmail(authUser.email),
    name: profile.name || nameFromEmail(authUser.email),
    role: profile.role || "librarian",
  };
};
