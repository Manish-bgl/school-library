import { useEffect, useRef, useState } from "react";
import {
  BookOpen, Users, RotateCcw, AlertCircle, Plus, Search, Edit2, Trash2,
  CheckCircle, XCircle, Eye, Key, Activity, BarChart2, ChevronLeft, ChevronRight,
  Bell, Shield, BookMarked, UserCheck, TrendingUp, Clock, IndianRupee, X, Save,
  RefreshCw, Menu, Sun, Moon, Upload, Printer, AlertTriangle, BookX, GraduationCap,
  CreditCard, Settings, Gift, MapPin, Send, LogOut, LayoutDashboard
} from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "./supabase";
import JsBarcode from "jsbarcode";
import { BrowserMultiFormatReader } from "@zxing/browser";

import { T, ACCENTS, SEED_BOOKS, SEED_STUDENTS, SEED_ISSUES, SEED_LIBRARIANS, SEED_LOG, SEED_SETTINGS } from "./utils/constants";
import { todayStr, genUUID, nameFromEmail, daysFromNow, daysAgo, fmt, calcFine, genId, validateStudentField, validateBookField, fetchOrCreateProfile } from "./utils/helpers";
import { mapStudentToDB, mapStudentFromDB, mapBookToDB, mapBookFromDB, mapIssueToDB, mapIssueFromDB, resetCounters } from "./utils/mappers";
import { Toast, Modal, Badge, StatCard, Pg } from "./components/ui";
import { Inp, Sel, Lbl, Field } from "./components/ui/Forms";
import { ManagerRegister } from "./components/auth/ManagerRegister";
import { Login } from "./components/auth/Login";
import { Sidebar } from "./components/layout/Sidebar";
import { StudentDashboard } from "./components/student/StudentDashboard";
import { StudentCard } from "./components/student/StudentCard";
export default function App() {
  const useSupabaseAuth = false; // hybrid auth flow enabled
  const useSupabaseData = true;  // data storage via Supabase stays ON
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [managerAccount, setManagerAccount] = useState(null);
  const [managerReady, setManagerReady] = useState(true);


  const fetchAllData = async () => {
    if (!useSupabaseData) return;
    console.log("Syncing data from Supabase...");

    // Reset display counters so friendly IDs restart from 001
    resetCounters();

    // Fetch each table individually so one missing table doesn't block the rest
    try {
      const { data, error } = await supabase.from("books").select("*");
      if (!error && data?.length) setBooks(data.map(mapBookFromDB));
      else if (error) console.warn("books table:", error.message);
    } catch (e) { console.warn("books fetch failed:", e); }

    try {
      const { data, error } = await supabase.from("students").select("*");
      if (!error && data?.length) setStudents(data.map(mapStudentFromDB));
      else if (error) console.warn("students table:", error.message);
    } catch (e) { console.warn("students fetch failed:", e); }

    try {
      const { data, error } = await supabase.from("issues").select("*");
      if (!error && data?.length) setIssues(data.map(mapIssueFromDB));
      else if (error) console.warn("issues table:", error.message);
    } catch (e) { console.warn("issues fetch failed:", e); }

    try {
      const { data, error } = await supabase.from("librarians").select("*");
      if (!error && data?.length) setLibrarians(data.map(l => ({ ...l, dbId: l.id, joinDate: l.join_date || l.joinDate || "" })));
      else if (error) console.warn("librarians table:", error.message);
    } catch (e) { console.warn("librarians fetch failed:", e); }

    try {
      const { data, error } = await supabase.from("log").select("*");
      if (!error && data?.length) setLog(data);
      else if (error) console.warn("log table:", error.message);
    } catch (e) { console.warn("log fetch failed:", e); }

    try {
      const { data, error } = await supabase.from("settings").select("*").limit(1);
      if (!error && data?.[0]) setSettings(prev => ({ ...prev, ...data[0] }));
      else if (error) console.warn("settings table:", error.message);
    } catch (e) { console.warn("settings fetch failed:", e); }

    console.log("Data sync complete!");
  };

  // Auth listener Ã¢â‚¬â€ only runs when useSupabaseAuth is enabled
  useEffect(() => {
    if (!useSupabaseAuth) return;
    let active = true;
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const authUser = data?.session?.user;
      if (!active) return;
      if (!authUser) { setUser(null); return; }
      const profile = await fetchOrCreateProfile(authUser, supabase);
      if (active && profile) {
        fetchAllData();
        setUser(profile);
        console.log("Profile set! Dashboard should open.");
      }
    };
    initAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const authUser = session?.user;
      if (!authUser) { setUser(null); return; }
      const profile = await fetchOrCreateProfile(authUser, supabase);
      if (active && profile) {
        setUser(profile);
        console.log("Profile set! Dashboard should open.");
        fetchAllData();
      }
    });
    
    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [useSupabaseAuth]);

  // Fetch data from Supabase on mount (even without auth)
  useEffect(() => {
    if (!useSupabaseData) return;
    if (useSupabaseAuth) return; // auth effect handles it when auth is on
    fetchAllData();
  }, [useSupabaseData]);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [books, setBooks] = useState(SEED_BOOKS);
  const [students, setStudents] = useState(SEED_STUDENTS);
  const [issues, setIssues] = useState(SEED_ISSUES);
  const [librarians, setLibrarians] = useState(SEED_LIBRARIANS);
  const [log, setLog] = useState(SEED_LOG);
  const [settings, setSettings] = useState(SEED_SETTINGS);
  const [toasts, setToasts] = useState([]);
  const [backupText, setBackupText] = useState("");
  const [dashboardFocus, setDashboardFocus] = useState(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentImportOpen, setStudentImportOpen] = useState(false);
  const [cardStudent, setCardStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [cardQr, setCardQr] = useState("");
  const [bookBarcode, setBookBarcode] = useState("");
  const [scanStudent, setScanStudent] = useState("");
  const [scanBook, setScanBook] = useState("");
  const [scanMode, setScanMode] = useState(null);
  const [pendingReturn, setPendingReturn] = useState(null);
  const [fineStatus, setFineStatus] = useState({});
  const [fineView, setFineView] = useState("pending");
  const [fineSearch, setFineSearch] = useState("");
  const [fineFilters, setFineFilters] = useState({
    range: "all",
    class: "",
    section: "",
  });
  const [fineSort, setFineSort] = useState("amountDesc");
  const [activityView, setActivityView] = useState("all");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [activityDateFrom, setActivityDateFrom] = useState("");
  const [activityRange, setActivityRange] = useState("all");
  const [reportFilters, setReportFilters] = useState({
    range: "30",
    class: "",
    section: "",
    category: "",
  });
  const [issueView, setIssueView] = useState("history");
  const [issueHistorySearch, setIssueHistorySearch] = useState("");
  const [issueHistoryFilters, setIssueHistoryFilters] = useState({
    status: "all",
    range: "all",
    from: "",
    to: "",
  });
  const [newStudent, setNewStudent] = useState({
    id: "",
    rollNo: "",
    name: "",
    class: "",
    section: "",
    contact: "",
    email: "",
    address: "",
    status: "Active",
  });
  const [studentErrors, setStudentErrors] = useState({});
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilters, setStudentFilters] = useState({
    class: "",
    section: "",
    status: "",
  });
  const [studentImportText, setStudentImportText] = useState("");
  const [librarianSearch, setLibrarianSearch] = useState("");
  const [librarianFilters, setLibrarianFilters] = useState({
    status: "",
    role: "",
  });
  const [librarianEditId, setLibrarianEditId] = useState(null);
  const [cardLibrarian, setCardLibrarian] = useState(null);
  const [cardLibrarianQr, setCardLibrarianQr] = useState("");
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [showAdvancedBookFields, setShowAdvancedBookFields] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");
  const [bookSearch, setBookSearch] = useState("");
  const [bookFilters, setBookFilters] = useState({
    format: "",
    language: "",
    author: "",
    publisher: "",
    year: "",
    tag: "",
    availableOnly: false,
  });
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookHistoryFilter, setBookHistoryFilter] = useState({
    range: "all",
    status: "all",
  });
  const [newBook, setNewBook] = useState({
    id: "",
    title: "",
    author: "",
    genre: "",
    publisher: "",
    year: "",
    total: "",
    available: "",
    shelf: "",
    aisle: "",
    language: "",
    isbn: "",
    edition: "",
    format: "",
    tags: "",
  });
  const [librarianModalOpen, setLibrarianModalOpen] = useState(false);
  const [newLibrarian, setNewLibrarian] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    role: "",
    status: "Active",
  });
  const [testNotifyReason, setTestNotifyReason] = useState("dueReminder");
  const [bulkClass, setBulkClass] = useState("");
  const [bulkSection, setBulkSection] = useState("");
  const [bulkFineThreshold, setBulkFineThreshold] = useState(50);
  const [newArrivalWindow, setNewArrivalWindow] = useState(7);
  const videoRef = useRef(null);
  const scanReaderRef = useRef(null);
  const t = T[theme];
  const isDir = user?.role === "director" || user?.role === "manager";
  const accent = ACCENTS[settings.accent] || ACCENTS.amber;
  const accentStyle = { "--accent-rgb": accent.rgb };

  const toast = (message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3500);
  };

  const addLog = (action) =>
    setLog((p) => [
      {
        id: Date.now(),
        user: user?.username,
        action,
        time: new Date().toISOString().replace("T", " ").slice(0, 16),
      },
      ...p,
    ]);

  const getStudentActivity = (studentId) => {
    const related = issues.filter((i) => i.studentId === studentId);
    if (related.length === 0) return "-";
    const latest = related
      .map((i) => i.returnDate || i.issueDate)
      .sort()
      .slice(-1)[0];
    return fmt(latest);
  };

  const getStudentFine = (studentId) =>
    issues
      .filter((i) => i.studentId === studentId && !i.returnDate)
      .reduce((sum, i) => sum + calcFine(i.dueDate, settings.fineRate), 0);

  const validateStudentField = (field, value) => {
    const v = String(value || "").trim();
    if (["name", "rollNo", "class", "section", "contact"].includes(field) && !v) {
      return "Required";
    }
    if (field === "rollNo" && v && !/^[0-9]+$/.test(v)) return "Numbers only";
    if (field === "class" && v) {
      const num = Number(v);
      if (!Number.isInteger(num) || num < 1 || num > 12) return "1-12 only";
    }
    if (field === "section" && v && !/^[A-Ea-e]$/.test(v)) return "A-E only";
    if (field === "contact" && v && !/^[0-9]{8,15}$/.test(v)) return "8-15 digits";
    if (field === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Invalid email";
    return "";
  };

  const handleImportStudents = (csvText) => {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idx = (name) => header.indexOf(name);
    const next = lines.slice(1).map((line) => line.split(",").map((v) => v.trim()));
    const base = (students || []).length + 1;
    const created = next.map((row, i) => ({
      id: row[idx("id")] || `ST${String(base + i).padStart(3, "0")}`,
      rollNo: row[idx("rollno")] || row[idx("roll")] || "",
      name: row[idx("name")] || "",
      class: row[idx("class")] || "",
      section: row[idx("section")] || "",
      contact: row[idx("contact")] || row[idx("phone")] || "",
      email: row[idx("email")] || "",
      address: row[idx("address")] || "",
      status: row[idx("status")] || "Active",
    }));
    setStudents((prev) => [...created, ...prev]);
    toast("Students imported", "success");
  };

  const handleLogoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setSettings((p) => ({ ...p, schoolLogo: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const handleExportData = () => {
    const payload = {
      books,
      students,
      issues,
      librarians,
      log,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "library-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast("Backup downloaded.", "success");
  };

  const handleImportData = (raw) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.books) setBooks(parsed.books);
      if (parsed.students) setStudents(parsed.students);
      if (parsed.issues) setIssues(parsed.issues);
      if (parsed.librarians) setLibrarians(parsed.librarians);
      if (parsed.log) setLog(parsed.log);
      if (parsed.settings) setSettings(parsed.settings);
      toast("Backup imported successfully.", "success");
    } catch (err) {
      toast("Invalid backup JSON.", "error");
    }
  };

  const stopScan = () => {
    setScanMode(null);
    if (scanReaderRef.current) {
      scanReaderRef.current.stopContinuousDecode?.();
      scanReaderRef.current.reset?.();
      scanReaderRef.current = null;
    }
    // Stop the camera hardware (turns off the green light)
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lms_manager_account");
      if (raw) {
        const parsed = JSON.parse(raw);
        // If the cached manager doesn't have a password (old dummy data), wipe it so registration shows.
        if (!parsed.password) {
          localStorage.removeItem("lms_manager_account");
          setManagerAccount(null);
        } else {
          setManagerAccount(parsed);
        }
      }
    } catch {
      setManagerAccount(null);
    } finally {
      setManagerReady(true);
    }
  }, []);

  useEffect(() => {
    if (!managerReady) return;
    try {
      if (managerAccount) {
        localStorage.setItem("lms_manager_account", JSON.stringify(managerAccount));
      } else {
        localStorage.removeItem("lms_manager_account");
      }
    } catch {
      // ignore storage errors
    }
  }, [managerAccount, managerReady]);

  useEffect(() => {
    if (user) return;
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get("student");
    if (studentId) {
      setUser({ role: "student", studentId });
    }
  }, [user]);

  useEffect(() => {
    if (!cardStudent) return;
    const url = `${window.location.origin}?student=${encodeURIComponent(
      cardStudent.id
    )}`;
    QRCode.toDataURL(url, { margin: 1, width: 160 })
      .then((dataUrl) => setCardQr(dataUrl))
      .catch(() => setCardQr(""));
  }, [cardStudent]);

  useEffect(() => {
    if (!cardLibrarian) return;
    const payload = `librarian:${cardLibrarian.id}`;
    QRCode.toDataURL(payload, { margin: 1, width: 160 })
      .then((dataUrl) => setCardLibrarianQr(dataUrl))
      .catch(() => setCardLibrarianQr(""));
  }, [cardLibrarian]);

  useEffect(() => {
    if (!selectedBook) return;
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, selectedBook.barcodeId || selectedBook.id, {
        format: "CODE128",
        displayValue: true,
        height: 70,
        width: 2.5,
        fontSize: 12,
        margin: 10,
      });
      setBookBarcode(canvas.toDataURL("image/png"));
    } catch {
      setBookBarcode("");
    }
  }, [selectedBook]);

  useEffect(() => {
    const root = document.documentElement.style;
    if (theme === "dark") {
      document.body.style.backgroundColor = "#070b12";
      document.body.style.backgroundImage = "none";
      return;
    }
    const palettes = {
      amber: {
        bg: "#c3cbd9",
        sidebar: "#b9c3d4",
        card: "#d3dceb",
        input: "#dde5f2",
        modal: "#dde5f2",
        tint: "#f3e2c9",
      },
      emerald: {
        bg: "#c5d2d6",
        sidebar: "#b9c9cf",
        card: "#d2e0e5",
        input: "#dde9ee",
        modal: "#dde9ee",
        tint: "#d7efe3",
      },
      sky: {
        bg: "#c7d4e4",
        sidebar: "#bccde0",
        card: "#d4e3f3",
        input: "#dfeaf7",
        modal: "#dfeaf7",
        tint: "#d8edf7",
      },
      rose: {
        bg: "#d5cbd6",
        sidebar: "#cbbfcc",
        card: "#e2d8e4",
        input: "#e9e1eb",
        modal: "#e9e1eb",
        tint: "#f2d8dc",
      },
    };
    const palette = palettes[settings.accent] || palettes.amber;
    root.setProperty("--light-bg", palette.bg);
    root.setProperty("--light-sidebar", palette.sidebar);
    root.setProperty("--light-card", palette.card);
    root.setProperty("--light-input", palette.input);
    root.setProperty("--light-modal", palette.modal);
    document.body.style.backgroundColor = palette.bg;
    document.body.style.backgroundImage = `linear-gradient(135deg, ${palette.tint} 0%, ${palette.bg} 45%, ${palette.card} 100%)`;
  }, [theme, settings.accent]);

  const parseStudentIdFromQr = (value) => {
    const text = String(value || "").trim();
    if (!text) return "";
    if (text.includes("?student=")) {
      try {
        const url = new URL(text);
        return url.searchParams.get("student") || "";
      } catch {
        const match = text.match(/student=([^&]+)/i);
        return match ? decodeURIComponent(match[1]) : "";
      }
    }
    if (text.toLowerCase().startsWith("student:")) {
      return text.split(":")[1] || "";
    }
    return text;
  };

  const parseBookIdFromQr = (value) => {
    const text = String(value || "").trim();
    if (!text) return "";
    if (text.toLowerCase().startsWith("book:")) {
      return text.split(":")[1] || "";
    }
    return text;
  };

  useEffect(() => {
    if (!scanMode || !videoRef.current) return;
    const reader = new BrowserMultiFormatReader();
    scanReaderRef.current = reader;
    let active = true;

    reader
      .decodeFromVideoDevice(
        null,
        videoRef.current,
        (result) => {
          if (!active || !result) return;
          const text = result.getText();
          if (scanMode === "student") {
            setScanStudent(text);
            stopScan();
          } else if (scanMode === "book") {
            setScanBook(text);
            stopScan();
          } else {
            if (!scanStudent) {
              setScanStudent(text);
              setScanMode("book");
            } else {
              setScanBook(text);
              stopScan();
            }
          }
        }
      )
      .catch(() => {
        if (active) toast("Camera access blocked", "error");
      });

    return () => {
      active = false;
      reader.stopContinuousDecode?.();
      reader.reset?.();
      if (scanReaderRef.current === reader) {
        scanReaderRef.current = null;
      }
    };
  }, [scanMode, scanStudent]);

  const handleScanIssue = async () => {
    const studentId = parseStudentIdFromQr(scanStudent);
    const bookId = parseBookIdFromQr(scanBook);
    const student = students.find((s) => s.id === studentId);
    const book = books.find((b) => b.id === bookId);

    if (!student) {
      toast("Student not found", "error");
      return;
    }
    if (!book) {
      toast("Book not found", "error");
      return;
    }
    if (book.available <= 0) {
      toast("Book not available", "error");
      return;
    }
    const activeIssues = issues.filter((i) => i.studentId === student.id && !i.returnDate);
    if (activeIssues.length >= settings.maxBooks) {
      toast("Max books limit reached", "error");
      return;
    }

    const issue = {
      id: genId("IS", issues),
      displayId: genId("IS", issues),
      studentId: student.id,
      dbStudentId: student.dbId || student.id,  // UUID for Supabase
      bookId: book.id,
      dbBookId: book.dbId || book.id,            // UUID for Supabase
      issueDate: todayStr(),
      dueDate: daysFromNow(settings.issueDays),
      returnDate: "",
    };
    if (useSupabaseData) {
      const bookSupabaseId = book.dbId; // Must be a UUID Ã¢â‚¬â€ seed data (BK001) has no dbId
      // Only insert issue if book exists in Supabase (has a UUID dbId)
      if (bookSupabaseId) {
        const issuePayload = mapIssueToDB({ ...issue, dbBookId: bookSupabaseId, dbStudentId: student.dbId || undefined });
        const { data: iData, error: iErr } = await supabase.from("issues").insert(issuePayload).select().single();
        const { error: bErr } = await supabase.from("books").update({ available_copies: book.available - 1 }).eq("id", bookSupabaseId);
        if (iErr || bErr) { toast((iErr?.message || "") + " " + (bErr?.message || ""), "error"); console.error("Supabase Error Full:", iErr || bErr); return; }
        if (iData?.id) issue.dbId = iData.id;
      } else {
        console.info("Book not in Supabase (seed data), skipping DB write for issue.");
      }
    }
    setIssues((prev) => [issue, ...prev]);
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, available: b.available - 1 } : b))
    );
    toast("Book issued", "success");
    setScanBook("");
  };

  const finalizeReturn = async (match) => {
    if (useSupabaseData) {
      const issueSupabaseId = match.dbId;  // Must be UUID
      const bookToUpdate = books.find(b => b.id === match.bookId);
      const bookSupabaseId = bookToUpdate?.dbId;  // Must be UUID
      // Only update Supabase if both records have real UUIDs
      if (issueSupabaseId && bookSupabaseId) {
        const { error: iErr } = await supabase.from("issues").update({ return_date: todayStr() }).eq("id", issueSupabaseId);
        const { error: bErr } = await supabase.from("books").update({ available_copies: (bookToUpdate?.available || 0) + 1 }).eq("id", bookSupabaseId);
        if (iErr || bErr) { toast((iErr?.message || "") + " " + (bErr?.message || ""), "error"); console.error("Supabase Error Full:", iErr || bErr); return; }
      } else {
        console.info("Issue/book not in Supabase (seed data), skipping DB write for return.");
      }
    }
    setIssues((prev) =>
      prev.map((i) => (i.id === match.id ? { ...i, returnDate: todayStr() } : i))
    );
    setBooks((prev) =>
      prev.map((b) => (b.id === match.bookId ? { ...b, available: b.available + 1 } : b))
    );
    toast("Book returned", "success");
    setScanBook("");
  };

  const handleScanReturn = () => {
    const bookId = parseBookIdFromQr(scanBook);
    const studentId = parseStudentIdFromQr(scanStudent);
    const book = books.find((b) => b.id === bookId);

    if (!book) {
      toast("Book not found", "error");
      return;
    }
    const openIssues = issues.filter((i) => i.bookId === bookId && !i.returnDate);
    const match = studentId ? openIssues.find((i) => i.studentId === studentId) : openIssues[0];
    if (!match) {
      toast("No active issue found", "error");
      return;
    }
    const fine = calcFine(match.dueDate, settings.fineRate);
    if (fine > 0) {
      setPendingReturn({ issue: match, fine });
      return;
    }
    finalizeReturn(match);
  };

  if (!managerReady)
    return (
      <div className={`min-h-screen ${T[theme].bg} flex items-center justify-center`}>
        <div className={`${T[theme].card} border ${T[theme].border} rounded-2xl p-6 text-center`}>
          <p className={`${T[theme].text} font-bold`}>Preparing setup...</p>
        </div>
      </div>
    );

  if (!user)
    return (
      managerAccount ? (
        <Login
          setUser={setUser}
          librarians={librarians}
          settings={settings}
          theme={theme}
          toggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          managerAccount={managerAccount}
        />
      ) : (
        <ManagerRegister
          onRegister={(account) => {
            setManagerAccount(account);
            setUser({
              username: account.username,
              name: account.name || "Manager",
              role: "manager",
            });
          }}
          settings={settings}
          setSettings={setSettings}
          theme={theme}
          toggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        />
      )
    );

  if (user.role === "student") {
    const student = students.find((s) => s.id === user.studentId);
    if (!student) {
      return (
        <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
          <div className={`${t.card} border ${t.border} rounded-2xl p-6 text-center`}>
            <p className={`${t.text} font-bold`}>Student not found.</p>
            <button
              onClick={() => setUser(null)}
              className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-bold"
            >
              Back
            </button>
          </div>
        </div>
      );
    }
    return (
      <StudentDashboard
        student={student}
        issues={issues}
        books={books}
        settings={settings}
        onBack={() => setUser(null)}
        theme={theme}
        toggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />
    );
  }

  const stats = {
    totalBooks: (books || []).reduce((sum, b) => sum + (Number(b.total) || 0), 0),
    totalStudents: (students || []).length,
    issued: (issues || []).filter((i) => !i.returnDate).length,
    totalFine: (issues || []).reduce(
      (sum, i) => sum + calcFine(i.dueDate, settings.fineRate),
      0
    ),
  };

  const booksByCategory = books.reduce((acc, b) => {
    const key = b.genre || "Other";
    acc[key] = (acc[key] || 0) + (Number(b.total) || 0);
    return acc;
  }, {});

  const weeklyIssued = Array.from({ length: 7 }, (_, i) => {
    const day = daysAgo(6 - i);
    const count = issues.filter((iss) => iss.issueDate === day).length;
    return { day, count };
  });

  const openCard = (student) => {
    setCardStudent(student);
  };


  const handleToggleStudentStatus = async (s) => {
    const newStatus = s.status === "Active" ? "Suspended" : "Active";
    if (useSupabaseData) {
      const studentSupabaseId = s.dbId || s.id;
      const { error } = await supabase.from("students").update({ status: newStatus }).eq("id", studentSupabaseId);
      if (error) { toast(error.message + (error.details ? " - " + error.details : ""), "error"); console.error("Supabase Error Full:", error); return; }
    }
    setStudents((prev) =>
      prev.map((st) => (st.id === s.id ? { ...st, status: newStatus } : st))
    );
  };

  const handleAddStudent = async () => {
    const id = genId("ST", students);
    const rollNo = newStudent.rollNo.trim();
    const name = newStudent.name.trim();
    const cls = newStudent.class.trim();
    const section = newStudent.section.trim();
    const contact = newStudent.contact.trim();
    const email = newStudent.email.trim();

    const fields = { name, rollNo, class: cls, section, contact, email };
    const errs = Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, validateStudentField(k, v)])
    );
    setStudentErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      toast("Please fix highlighted fields", "error");
      return;
    }

    const student = {
      ...newStudent,
      id,
      displayId: genId("S", students),
      rollNo,
      name,
      class: cls,
      section,
      contact,
      email,
    };
    if (useSupabaseData) {
      const { data: sData, error } = await supabase.from("students").insert(mapStudentToDB(student)).select().single();
      if (error) { toast(error.message + (error.details ? " - " + error.details : ""), "error"); console.error("Supabase Error Full:", error); return; }
      if (sData?.id) student.dbId = sData.id;
    }
    setStudents((prev) => [student, ...prev]);
    setStudentModalOpen(false);
    setNewStudent({
      id: "",
      rollNo: "",
      name: "",
      class: "",
      section: "",
      contact: "",
      email: "",
      address: "",
      status: "Active",
    });
    setStudentErrors({});
    openCard(student);
    toast("Student added successfully", "success");
  };

  const printCard = () => {
    if (!cardStudent) return;
    const win = window.open("", "_blank", "width=520,height=420");
    if (!win) return;
    const student = cardStudent;
    const qr = cardQr || "";
    win.document.write(`
      <html>
        <head>
          <title>Student Card</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            .card { width: 320px; height: 200px; border: 1px solid #ddd; border-radius: 12px; padding: 14px; box-sizing: border-box; }
            .title { font-size: 14px; font-weight: 700; margin: 0; }
            .school { font-size: 10px; color: #666; margin: 0 0 6px 0; }
            .grid { display: grid; grid-template-columns: 1fr 96px; gap: 10px; }
            .line { font-size: 11px; margin: 2px 0; }
            .qr { width: 80px; height: 80px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; }
            img { width: 80px; height: 80px; }
          </style>
        </head>
        <body>
          <div class="card">
            <p class="school">${settings.schoolName}</p>
            <p class="title">Library Card</p>
            <div class="grid">
              <div>
                <p class="line">Name: ${student.name}</p>
                <p class="line">ID: ${student.id}</p>
                <p class="line">Roll: ${student.rollNo}</p>
                <p class="line">Class: ${student.class}${student.section}</p>
                <p class="line">Parent: ${student.contact}</p>
              </div>
              <div class="qr">${qr ? `<img src="${qr}" />` : ""}</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const printLibrarianCard = () => {
    if (!cardLibrarian) return;
    const win = window.open("", "_blank", "width=520,height=420");
    if (!win) return;
    const lib = cardLibrarian;
    const qr = cardLibrarianQr || "";
    win.document.write(`
      <html>
        <head>
          <title>Librarian Card</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            .card { width: 320px; height: 200px; border: 1px solid #ddd; border-radius: 12px; padding: 14px; box-sizing: border-box; }
            .title { font-size: 14px; font-weight: 700; margin: 0; }
            .school { font-size: 10px; color: #666; margin: 0 0 6px 0; }
            .grid { display: grid; grid-template-columns: 1fr 96px; gap: 10px; }
            .line { font-size: 11px; margin: 2px 0; }
            .qr { width: 80px; height: 80px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; }
            img { width: 80px; height: 80px; }
          </style>
        </head>
        <body>
          <div class="card">
            <p class="school">${settings.schoolName}</p>
            <p class="title">Library Staff Card</p>
            <div class="grid">
              <div>
                <p class="line">Name: ${lib.name}</p>
                <p class="line">ID: ${lib.id}</p>
                <p class="line">Role: ${lib.role || "-"}</p>
                <p class="line">Phone: ${lib.phone || "-"}</p>
              </div>
              <div class="qr">${qr ? `<img src="${qr}" />` : ""}</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleAddLibrarian = async () => {
    if (!newLibrarian.name.trim() || !newLibrarian.username.trim()) {
      toast("Name and username are required", "error");
      return;
    }
    if (!newLibrarian.phone.trim()) {
      toast("Phone is required", "error");
      return;
    }
    if (newLibrarian.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLibrarian.email)) {
      toast("Invalid email format", "error");
      return;
    }

    const base = {
      name: newLibrarian.name.trim(),
      username: newLibrarian.username.trim(),
      password: newLibrarian.password || "lib123",
      email: newLibrarian.email.trim(),
      phone: newLibrarian.phone.trim(),
      role: newLibrarian.role || "Staff",
      status: newLibrarian.status || "Active",
    };

    if (librarianEditId) {
      if (useSupabaseData) {
        // Use dbId (UUID) for update; librarianEditId may be text like L001
        const editLib = librarians.find(l => l.id === librarianEditId);
        const supabaseEditId = editLib?.dbId || librarianEditId;
        const { error } = await supabase.from("librarians").update(base).eq("id", supabaseEditId);
        if (error) { toast(error.message + (error.details ? " - " + error.details : ""), "error"); console.error("Supabase Error Full:", error); return; }
      }
      setLibrarians((prev) =>
        prev.map((l) =>
          l.id === librarianEditId
            ? { ...l, ...base, password: newLibrarian.password || l.password }
            : l
        )
      );
      toast("Librarian updated", "success");
    } else {
      const librarian = {
        id: genId("L", librarians),
        joinDate: todayStr(),
        lastLogin: "-",
        actionsCount: 0,
        ...base,
      };
      if (useSupabaseData) {
        // Insert only the DB-safe columns with a proper UUID
        const libPayload = {
          id: librarian.dbId || genUUID(),
          name: librarian.name,
          username: librarian.username,
          password: librarian.password,
          email: librarian.email,
          phone: librarian.phone,
          role: librarian.role,
          status: librarian.status,
          join_date: librarian.joinDate,
        };
        const { data: lData, error } = await supabase.from("librarians").insert(libPayload).select().single();
        if (error) { toast(error.message + (error.details ? " - " + error.details : ""), "error"); console.error("Supabase Error Full:", error); return; }
        if (lData?.id) librarian.dbId = lData.id;
      }
      setLibrarians((prev) => [librarian, ...prev]);
      toast("Librarian added successfully", "success");
    }

    setLibrarianModalOpen(false);
    setLibrarianEditId(null);
    setNewLibrarian({
      name: "",
      username: "",
      password: "",
      email: "",
      phone: "",
      role: "",
      status: "Active",
    });
  };

  const handleAddBook = async () => {
    if (!newBook.title.trim() || !newBook.author.trim() || !newBook.genre.trim()) {
      toast("Title, author, and category are required", "error");
      return;
    }
    const total = Number(newBook.total) || 0;
    const available = Number(newBook.available) || total;
    const book = {
      id: newBook.id.trim() || genId("BK", books),
      displayId: genId("BK", books),
      title: newBook.title.trim(),
      author: newBook.author.trim(),
      genre: newBook.genre.trim(),
      publisher: newBook.publisher.trim(),
      year: Number(newBook.year) || new Date().getFullYear(),
      total,
      available,
      shelf: newBook.shelf.trim(),
      aisle: newBook.aisle.trim(),
      damaged: 0,
      language: newBook.language.trim(),
      isbn: newBook.isbn.trim(),
      edition: newBook.edition.trim(),
      format: newBook.format.trim(),
      tags: newBook.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      barcodeId: (newBook.id.trim() || genId("BK", books)).trim(),
    };
    if (useSupabaseData) {
      const { data: bData, error } = await supabase.from("books").insert(mapBookToDB(book)).select().single();
      if (error) { toast(error.message + (error.details ? " - " + error.details : ""), "error"); console.error("Supabase Error Full:", error); return; }
      // Store the Supabase UUID so future updates use the correct primary key
      if (bData?.id) book.dbId = bData.id;
    }
    setBooks((prev) => [book, ...prev]);
    setBookModalOpen(false);
    setSelectedBook(book);
    setNewBook({
      id: "",
      title: "",
      author: "",
      genre: "",
      publisher: "",
      year: "",
      total: "",
      available: "",
      shelf: "",
      aisle: "",
      language: "",
      isbn: "",
      edition: "",
      format: "",
      tags: "",
    });
    toast("Book added. Barcode ready to print.", "success");
  };

  const classOptions = [...new Set(students.map((s) => s.class).filter(Boolean))].sort(
    (a, b) => Number(a) - Number(b)
  );
  const sectionOptions = [...new Set(students.map((s) => s.section).filter(Boolean))].sort();
  const bulkStudents = students.filter((s) => {
    if (s.status && s.status !== "Active") return false;
    if (bulkClass && s.class !== bulkClass) return false;
    if (bulkSection && s.section !== bulkSection) return false;
    return true;
  });
  const overdueStudentIds = new Set(
    issues
      .filter((i) => !i.returnDate)
      .filter((i) => calcFine(i.dueDate, settings.fineRate) > bulkFineThreshold)
      .map((i) => i.studentId)
  );
  const overdueTargets = bulkStudents.filter((s) => overdueStudentIds.has(s.id));

  return (
    <div
      className={`flex h-screen ${t.bg} overflow-hidden accent-scope`}
      style={{ fontFamily: "'Sora','Segoe UI',sans-serif", ...accentStyle }}
    >
      <Toast toasts={toasts} remove={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      <Sidebar
        user={user}
        tab={tab}
        setTab={setTab}
        open={sidebarOpen}
        theme={theme}
        settings={settings}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className={`h-16 ${t.sidebar} border-b ${t.border} flex items-center justify-between px-5 shrink-0`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className={`p-2 rounded-xl ${t.hover} ${t.sub}`}
            >
              <Menu size={17} />
            </button>
            <div>
              <p className={`text-sm font-bold ${t.text}`}>{settings.schoolName}</p>
              <p className={`text-xs ${t.muted}`}>Library Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className={`p-2 rounded-xl border ${t.border} ${t.card} ${t.sub}`}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
              className={`p-2 rounded-xl border ${t.border} ${t.card} ${t.sub}`}
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === "dashboard" && (
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
                          <Clock size={12} /> {entry.time} Ã‚Â· {entry.user}
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
          )}

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

          {tab === "students" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Students</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStudentImportOpen(true)}
                    className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                  >
                    Import CSV
                  </button>
                  <button
                    onClick={() => setStudentModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                  >
                    Add Student
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Inp
                  theme={theme}
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={studentFilters.class}
                  onChange={(e) => setStudentFilters((p) => ({ ...p, class: e.target.value }))}
                >
                  <option value="">All Classes</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Sel>
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={studentFilters.section}
                  onChange={(e) => setStudentFilters((p) => ({ ...p, section: e.target.value }))}
                >
                  <option value="">All Sections</option>
                  {["A", "B", "C", "D", "E"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Sel>
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={studentFilters.status}
                  onChange={(e) => setStudentFilters((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </Sel>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className={`w-full text-sm ${t.text}`}>
                  <thead className={`${t.th}`}>
                    <tr>
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Class</th>
                      <th className="p-2 text-left">Contact</th>
                      <th className="p-2 text-left">Last Visit</th>
                      <th className="p-2 text-left">Issued</th>
                      <th className="p-2 text-left">Fine</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter((s) => {
                        const q = studentSearch.trim().toLowerCase();
                        if (studentFilters.class && String(s.class) !== String(studentFilters.class)) return false;
                        if (studentFilters.section && String(s.section).toLowerCase() !== String(studentFilters.section).toLowerCase()) return false;
                        if (studentFilters.status && s.status !== studentFilters.status) return false;
                        if (!q) return true;
                        return [s.id, s.name, s.rollNo, s.class, s.section, s.contact, s.email]
                          .filter(Boolean)
                          .some((v) => String(v).toLowerCase().includes(q));
                      })
                      .map((s) => {
                        const activeCount = issues.filter((i) => i.studentId === s.id && !i.returnDate).length;
                        const fine = getStudentFine(s.id);
                        return (
                          <tr key={s.id} className={`border-t ${t.tr}`}>
                            <td className="p-2 font-semibold">{s.displayId || s.id}</td>
                            <td className="p-2">{s.name}</td>
                            <td className="p-2">{s.class}{s.section}</td>
                            <td className="p-2">{s.contact}</td>
                            <td className="p-2">{getStudentActivity(s.id)}</td>
                            <td className="p-2">
                              <div className="w-28">
                                <div className={`h-2 rounded-full ${t.border} border`}> 
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${Math.min(100, (activeCount / settings.maxBooks) * 100)}%` }}
                                  />
                                </div>
                                <p className={`text-[10px] ${t.muted} mt-1`}>{activeCount}/{settings.maxBooks} issued</p>
                              </div>
                            </td>
                            <td className="p-2">{fine > 0 ? `Rs ${fine}` : ""}</td>
                            <td className="p-2">
                              <Badge color={s.status === "Active" ? "green" : "red"}>
                                {s.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => setSelectedStudent(s)}
                                  className={`px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-xs font-bold`}
                                >
                                  Profile
                                </button>
                                <button
                                  onClick={() => openCard(s)}
                                  className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-500 text-xs font-bold"
                                >
                                  Card
                                </button>
                                <a
                                  href={`tel:${s.contact}`}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-bold"
                                >
                                  Call
                                </a>
                                <a
                                  href={`https://wa.me/${String(s.contact || "").replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold"
                                >
                                  WhatsApp
                                </a>
                                {s.email && (
                                  <a
                                    href={`mailto:${s.email}`}
                                    className="px-2 py-1 rounded-lg bg-slate-500/15 text-slate-600 text-xs font-bold"
                                  >
                                    Email
                                  </a>
                                )}
                                <button
                                  onClick={() => handleToggleStudentStatus(s)}
                                  className={`px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-xs font-bold`}
                                >
                                  {s.status === "Active" ? "Suspend" : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "issues" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <h2 className={`text-sm font-bold ${t.text}`}>Issue & Return</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <div className={`rounded-2xl border ${t.border} p-3 ${t.card}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-xs font-bold ${t.sub}`}>Camera Scan</p>
                    <span className={`text-[11px] ${t.muted}`}>
                      {scanMode ? `Scanning: ${scanMode}` : "Idle"}
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-dashed border-slate-400/40 bg-black/5">
                    <video ref={videoRef} className="w-full h-44 object-cover" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setScanMode("auto")}
                      className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
                    >
                      Auto Scan
                    </button>
                    <button
                      onClick={() => setScanMode("student")}
                      className="px-3 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold"
                    >
                      Scan Student QR
                    </button>
                    <button
                      onClick={() => setScanMode("book")}
                      className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                    >
                      Scan Book Barcode
                    </button>
                    {scanMode && (
                      <button
                        onClick={() => { stopScan(); setScanStudent(""); setScanBook(""); }}
                        className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/25 animate-pulse hover:animate-none hover:bg-red-600 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        Stop Scanner
                      </button>
                    )}
                  </div>
                  <p className={`mt-2 text-[11px] ${t.muted}`}>
                    Student card uses QR. Book label uses barcode. Keep 10-15cm distance and good light.
                  </p>
                </div>
                <div className={`rounded-2xl border ${t.border} p-3 ${t.card}`}>
                  <p className={`text-xs font-bold ${t.sub} mb-2`}>Scan Inputs</p>
                  <div className="grid gap-3">
                    <div>
                      <Lbl theme={theme}>Student QR / ID</Lbl>
                      <Inp
                        theme={theme}
                        placeholder="Scan student QR or type ID"
                        value={scanStudent}
                        onChange={(e) => setScanStudent(e.target.value)}
                      />
                    </div>
                    <div>
                      <Lbl theme={theme}>Book Barcode / ID</Lbl>
                      <Inp
                        theme={theme}
                        placeholder="Scan book barcode or type ID"
                        value={scanBook}
                        onChange={(e) => setScanBook(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleScanIssue}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
                      >
                        Issue
                      </button>
                      <button
                        onClick={handleScanReturn}
                        className="px-4 py-2 rounded-xl bg-slate-200 text-slate-900 text-xs font-bold"
                      >
                        Return
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { key: "history", label: "History" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setIssueView(item.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border ${t.border} ${
                      issueView === item.key
                        ? "bg-amber-500 text-black"
                        : `${t.card} ${t.sub}`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {issueView === "history" && (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto_auto]">
                  <Inp
                    theme={theme}
                    placeholder="Quick search history..."
                    value={issueHistorySearch}
                    onChange={(e) => setIssueHistorySearch(e.target.value)}
                  />
                  <Sel
                    theme={theme}
                    className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                    style={{
                      color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                      backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                    }}
                    value={issueHistoryFilters.status}
                    onChange={(e) =>
                      setIssueHistoryFilters((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="all">All</option>
                    <option value="issued">Issued</option>
                    <option value="returned">Returned</option>
                  </Sel>
                  <Sel
                    theme={theme}
                    className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                    style={{
                      color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                      backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                    }}
                    value={issueHistoryFilters.range}
                    onChange={(e) =>
                      setIssueHistoryFilters((p) => ({ ...p, range: e.target.value }))
                    }
                  >
                    <option value="all">All time</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="year">This year</option>
                  </Sel>
                  <Inp
                    theme={theme}
                    type="datetime-local"
                    value={issueHistoryFilters.from}
                    onChange={(e) =>
                      setIssueHistoryFilters((p) => ({ ...p, from: e.target.value }))
                    }
                  />
                  <button
                    onClick={() => {
                      setIssueHistorySearch("");
                      setIssueHistoryFilters({ status: "all", range: "all", from: "", to: "" });
                    }}
                    className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                  >
                    Clear filters
                  </button>
                </div>
              )}
              {(() => {
                const studentId = parseStudentIdFromQr(scanStudent);
                const bookId = parseBookIdFromQr(scanBook);
                const student = students.find((s) => s.id === studentId);
                const book = books.find((b) => b.id === bookId);
                if (!student && !book) return null;
                return (
                  <div className={`mt-3 p-3 rounded-xl border ${t.border} text-xs ${t.sub}`}>
                    <div className="flex flex-wrap gap-3">
                      {student && (
                        <span>
                          Student: <strong className={t.text}>{student.name}</strong> ({student.id})
                        </span>
                      )}
                      {book && (
                        <span>
                          Book: <strong className={t.text}>{book.title}</strong> Ã‚Â· Available {book.available}/{book.total}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="mt-4 overflow-x-auto">
                <table className={`w-full text-sm ${t.text}`}>
                  <thead className={`${t.th}`}>
                    <tr>
                      <th className="p-2 text-left">Issue ID</th>
                      <th className="p-2 text-left">Student</th>
                      <th className="p-2 text-left">Book</th>
                      <th className="p-2 text-left">Due</th>
                      {issueView === "history" && <th className="p-2 text-left">Returned</th>}
                      {issueView === "history" && <th className="p-2 text-left">Fine</th>}
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const baseList = issueView === "issue" ? issues.filter((i) => !i.returnDate) : issues;
                      const q = issueHistorySearch.trim().toLowerCase();
                      const list =
                        issueView === "history"
                          ? baseList.filter((i) => {
                              if (issueHistoryFilters.status === "issued" && i.returnDate) return false;
                              if (issueHistoryFilters.status === "returned" && !i.returnDate) return false;
                              const refDate = i.returnDate || i.issueDate;
                              if (issueHistoryFilters.range !== "all") {
                                const days = (new Date() - new Date(refDate)) / 86400000;
                                if (issueHistoryFilters.range === "yesterday") {
                                  if (days < 1 || days >= 2) return false;
                                } else if (issueHistoryFilters.range === "year") {
                                  if (new Date(refDate).getFullYear() !== new Date().getFullYear()) return false;
                                } else if (days > Number(issueHistoryFilters.range)) {
                                  return false;
                                }
                              }
                              if (issueHistoryFilters.from) {
                                const fromDate = new Date(issueHistoryFilters.from);
                                if (new Date(refDate) < fromDate) return false;
                              }
                              if (issueHistoryFilters.to) {
                                const toDate = new Date(issueHistoryFilters.to);
                                if (new Date(refDate) > toDate) return false;
                              }
                              if (!q) return true;
                              const student = students.find((s) => s.id === i.studentId);
                              const book = books.find((b) => b.id === i.bookId);
                              return [
                                i.id,
                                student?.name,
                                student?.id,
                                book?.title,
                                book?.id,
                              ]
                                .filter(Boolean)
                                .some((v) => String(v).toLowerCase().includes(q));
                            })
                          : baseList;
                      return list.map((i) => {
                      const student = students.find((s) => s.id === i.studentId);
                      const book = books.find((b) => b.id === i.bookId);
                      const fine = i.returnDate
                        ? Math.max(
                            0,
                            Math.floor(
                              (new Date(i.returnDate) - new Date(i.dueDate)) / 86400000
                            ) * settings.fineRate
                          )
                        : 0;
                      return (
                        <tr key={i.id} className={`border-t ${t.tr}`}>
                          <td className="p-2 font-semibold">{i.displayId || i.id}</td>
                          <td className="p-2">{student?.name || "-"}</td>
                          <td className="p-2">{book?.title || "-"}</td>
                          <td className="p-2">{fmt(i.dueDate)}</td>
                          {issueView === "history" && <td className="p-2">{fmt(i.returnDate)}</td>}
                          {issueView === "history" && <td className="p-2">{fine > 0 ? `Rs ${fine}` : ""}</td>}
                          <td className="p-2">
                            <Badge color={i.returnDate ? "green" : "amber"}>
                              {i.returnDate ? "Returned" : "Issued"}
                            </Badge>
                          </td>
                        </tr>
                      );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "fines" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Fines</h2>
                <div className="flex gap-2">
                  {[
                    { key: "pending", label: "Pending" },
                    { key: "paid", label: "Paid" },
                    { key: "waived", label: "Waived" },
                    { key: "history", label: "History" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setFineView(item.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border ${t.border} ${
                        fineView === item.key
                          ? "bg-amber-500 text-black"
                          : `${t.card} ${t.sub}`
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const fineRows = issues
                  .map((i) => {
                    const fine = calcFine(i.dueDate, settings.fineRate);
                    if (fine <= 0) return null;
                    const student = students.find((s) => s.id === i.studentId);
                    const book = books.find((b) => b.id === i.bookId);
                    const status = fineStatus[i.id]?.status || "pending";
                    return {
                      issue: i,
                      fine,
                      status,
                      student,
                      book,
                    };
                  })
                  .filter(Boolean);

                const totals = fineRows.reduce(
                  (acc, r) => {
                    acc.total += r.fine;
                    if (r.status === "paid") acc.paid += r.fine;
                    if (r.status === "waived") acc.waived += r.fine;
                    if (r.status === "pending") acc.pending += r.fine;
                    return acc;
                  },
                  { total: 0, paid: 0, waived: 0, pending: 0 }
                );

                const filtered = fineRows.filter((r) => {
                  if (fineView !== "history" && fineView && r.status !== fineView) return false;
                  if (fineFilters.class && String(r.student?.class) !== String(fineFilters.class)) return false;
                  if (fineFilters.section && String(r.student?.section).toLowerCase() !== String(fineFilters.section).toLowerCase()) return false;
                  if (fineFilters.range !== "all") {
                    const days = (new Date() - new Date(r.issue.dueDate)) / 86400000;
                    if (fineFilters.range === "today" && days > 1) return false;
                    if (fineFilters.range === "7" && days > 7) return false;
                    if (fineFilters.range === "30" && days > 30) return false;
                    if (fineFilters.range === "year" && new Date(r.issue.dueDate).getFullYear() !== new Date().getFullYear()) return false;
                  }
                  const q = fineSearch.trim().toLowerCase();
                  if (!q) return true;
                  return [
                    r.issue.id,
                    r.student?.name,
                    r.student?.id,
                    r.book?.title,
                    r.book?.id,
                  ]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q));
                });

                const sorted = [...filtered].sort((a, b) => {
                  if (fineSort === "amountAsc") return a.fine - b.fine;
                  if (fineSort === "amountDesc") return b.fine - a.fine;
                  if (fineSort === "oldest") return new Date(a.issue.dueDate) - new Date(b.issue.dueDate);
                  if (fineSort === "newest") return new Date(b.issue.dueDate) - new Date(a.issue.dueDate);
                  return 0;
                });

                const byStudent = sorted.reduce((acc, r) => {
                  const key = r.student?.name || "Unknown";
                  acc[key] = (acc[key] || 0) + r.fine;
                  return acc;
                }, {});
                const chartData = Object.entries(byStudent)
                  .map(([name, amount]) => ({ name, amount }))
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 6);
                const maxAmt = Math.max(1, ...chartData.map((d) => d.amount));

                return (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard label="Total Fine" value={`Rs ${totals.total}`} sub="All" icon={IndianRupee} color="red" theme={theme} />
                      <StatCard label="Pending" value={`Rs ${totals.pending}`} sub="To collect" icon={AlertTriangle} color="amber" theme={theme} />
                      <StatCard label="Paid" value={`Rs ${totals.paid}`} sub="Collected" icon={CheckCircle} color="green" theme={theme} />
                      <StatCard label="Waived" value={`Rs ${totals.waived}`} sub="Waived" icon={Gift} color="blue" theme={theme} />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-xs font-bold ${t.sub}`}>Top Fine Holders</h3>
                          <span className={`text-[11px] ${t.muted}`}>Top 6</span>
                        </div>
                        <div className="h-44 flex items-end gap-3">
                          {chartData.map((d) => (
                            <div key={d.name} className="flex-1 flex flex-col items-center gap-2">
                              <span className={`text-[10px] ${t.muted}`}>Rs {d.amount}</span>
                              <div
                                className="w-full rounded-xl bg-gradient-to-t from-rose-500/70 to-rose-300/40"
                                style={{ height: `${Math.max(18, 24 + Math.sqrt(d.amount / maxAmt) * 80)}px` }}
                              />
                              <span className={`text-[10px] ${t.muted}`}>
                                {d.name.split(" ")[0]}
                              </span>
                            </div>
                          ))}
                          {chartData.length === 0 && (
                            <p className={`text-xs ${t.muted}`}>No fines yet.</p>
                          )}
                        </div>
                      </div>
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4 space-y-3`}>
                        <Inp
                          theme={theme}
                          placeholder="Search fine records..."
                          value={fineSearch}
                          onChange={(e) => setFineSearch(e.target.value)}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Sel
                            theme={theme}
                            className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                            style={{
                              color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                              backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                            }}
                            value={fineFilters.class}
                            onChange={(e) => setFineFilters((p) => ({ ...p, class: e.target.value }))}
                          >
                            <option value="">All Classes</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </Sel>
                          <Sel
                            theme={theme}
                            className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                            style={{
                              color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                              backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                            }}
                            value={fineFilters.section}
                            onChange={(e) => setFineFilters((p) => ({ ...p, section: e.target.value }))}
                          >
                            <option value="">All Sections</option>
                            {["A", "B", "C", "D", "E"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </Sel>
                          <Sel
                            theme={theme}
                            className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                            style={{
                              color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                              backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                            }}
                            value={fineFilters.range}
                            onChange={(e) => setFineFilters((p) => ({ ...p, range: e.target.value }))}
                          >
                            <option value="all">All time</option>
                            <option value="today">Today</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="year">This year</option>
                          </Sel>
                          <Sel
                            theme={theme}
                            className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                            style={{
                              color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                              backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                            }}
                            value={fineSort}
                            onChange={(e) => setFineSort(e.target.value)}
                          >
                            <option value="amountDesc">Amount: High to Low</option>
                            <option value="amountAsc">Amount: Low to High</option>
                            <option value="oldest">Oldest Due</option>
                            <option value="newest">Newest Due</option>
                          </Sel>
                        </div>
                        <button
                          onClick={() => {
                            setFineSearch("");
                            setFineFilters({ range: "all", class: "", section: "" });
                            setFineSort("amountDesc");
                          }}
                          className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                        >
                          Clear filters
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className={`w-full text-sm ${t.text}`}>
                        <thead className={`${t.th}`}>
                          <tr>
                            <th className="p-2 text-left">Issue ID</th>
                            <th className="p-2 text-left">Student</th>
                            <th className="p-2 text-left">Book</th>
                            <th className="p-2 text-left">Due</th>
                            {fineView === "history" && <th className="p-2 text-left">Returned</th>}
                            <th className="p-2 text-left">Amount</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((r) => (
                            <tr key={r.issue.id} className={`border-t ${t.tr}`}>
                              <td className="p-2 font-semibold">{r.issue.id}</td>
                              <td className="p-2">{r.student?.name || "-"}</td>
                              <td className="p-2">{r.book?.title || "-"}</td>
                              <td className="p-2">{fmt(r.issue.dueDate)}</td>
                              {fineView === "history" && <td className="p-2">{fmt(r.issue.returnDate)}</td>}
                              <td className="p-2">Rs {r.fine}</td>
                              <td className="p-2">
                                <Badge color={r.status === "paid" ? "green" : r.status === "waived" ? "blue" : "amber"}>
                                  {r.status}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="flex flex-wrap gap-2">
                                  {r.status === "pending" && (
                                    <button
                                      onClick={() =>
                                        setFineStatus((prev) => ({
                                          ...prev,
                                          [r.issue.id]: { status: "paid", paidAt: todayStr() },
                                        }))
                                      }
                                      className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                  {r.status === "pending" && (
                                    <button
                                      onClick={() =>
                                        setFineStatus((prev) => ({
                                          ...prev,
                                          [r.issue.id]: { status: "waived", paidAt: todayStr() },
                                        }))
                                      }
                                      className="px-2 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold"
                                    >
                                      Waive
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      const win = window.open("", "_blank", "width=420,height=520");
                                      if (!win) return;
                                      win.document.write(`
                                        <html>
                                          <head>
                                            <title>Fine Receipt</title>
                                            <style>
                                              body { font-family: Arial, sans-serif; margin: 24px; }
                                              .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; }
                                              .title { font-size: 14px; font-weight: 700; margin: 0 0 6px 0; }
                                              .line { font-size: 11px; margin: 2px 0; }
                                            </style>
                                          </head>
                                          <body>
                                            <div class="card">
                                              <p class="title">Fine Receipt</p>
                                              <p class="line">Issue: ${r.issue.id}</p>
                                              <p class="line">Student: ${r.student?.name || "-"}</p>
                                              <p class="line">Book: ${r.book?.title || "-"}</p>
                                              <p class="line">Due: ${fmt(r.issue.dueDate)}</p>
                                              <p class="line">Amount: Rs ${r.fine}</p>
                                              <p class="line">Status: ${r.status}</p>
                                            </div>
                                            <script>window.print();</script>
                                          </body>
                                        </html>
                                      `);
                                      win.document.close();
                                    }}
                                    className={`px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-xs font-bold`}
                                  >
                                    Receipt
                                  </button>
                                  <button
                                    onClick={() => toast("Reminder sent", "success")}
                                    className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-500 text-xs font-bold"
                                  >
                                    Reminder
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {sorted.length === 0 && (
                            <tr>
                              <td className={`p-3 ${t.muted}`} colSpan={7}>
                                No fine records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </section>
          )}

          {tab === "librarians" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Librarians</h2>
                <button
                  onClick={() => {
                    setLibrarianEditId(null);
                    setNewLibrarian({
                      name: "",
                      username: "",
                      password: "",
                      email: "",
                      phone: "",
                      role: "",
                      status: "Active",
                    });
                    setLibrarianModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                >
                  Add Librarian
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Inp
                  theme={theme}
                  placeholder="Search librarians..."
                  value={librarianSearch}
                  onChange={(e) => setLibrarianSearch(e.target.value)}
                />
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={librarianFilters.role}
                  onChange={(e) => setLibrarianFilters((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="">All Roles</option>
                  {["Admin", "Staff", "Issuer", "Viewer"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Sel>
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={librarianFilters.status}
                  onChange={(e) => setLibrarianFilters((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </Sel>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className={`w-full text-sm ${t.text}`}>
                  <thead className={`${t.th}`}>
                    <tr>
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Role</th>
                      <th className="p-2 text-left">Last Login</th>
                      <th className="p-2 text-left">Actions</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Quick</th>
                    </tr>
                  </thead>
                  <tbody>
                    {librarians
                      .filter((l) => {
                        const q = librarianSearch.trim().toLowerCase();
                        if (librarianFilters.status && l.status !== librarianFilters.status) return false;
                        if (librarianFilters.role && l.role !== librarianFilters.role) return false;
                        if (!q) return true;
                        return [l.id, l.name, l.username, l.email, l.phone]
                          .filter(Boolean)
                          .some((v) => String(v).toLowerCase().includes(q));
                      })
                      .map((l) => (
                        <tr key={l.id} className={`border-t ${t.tr}`}>
                          <td className="p-2 font-semibold">{l.id}</td>
                          <td className="p-2">
                            <div className="font-bold">{l.name}</div>
                            {l.username && <div className={`text-[10px] ${t.muted} mt-0.5`}>@{l.username}</div>}
                          </td>
                          <td className="p-2">{l.role || "-"}</td>
                          <td className="p-2">{l.lastLogin || "-"}</td>
                          <td className="p-2">{l.actionsCount ?? 0}</td>
                          <td className="p-2">
                            <Badge color={l.status === "Active" ? "green" : "red"}>{l.status}</Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setCardLibrarian(l)}
                                className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-500 text-xs font-bold"
                              >
                                ID Card
                              </button>
                              <a
                                href={`tel:${l.phone}`}
                                className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-bold"
                              >
                                Call
                              </a>
                              {l.phone && (
                                <a
                                  href={`https://wa.me/${String(l.phone).replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold"
                                >
                                  WhatsApp
                                </a>
                              )}
                              {l.email && (
                                <a
                                  href={`mailto:${l.email}`}
                                  className="px-2 py-1 rounded-lg bg-slate-500/15 text-slate-600 text-xs font-bold"
                                >
                                  Email
                                </a>
                              )}
                              <button
                                onClick={() =>
                                  setLibrarians((prev) =>
                                    prev.map((x) =>
                                      x.id === l.id
                                        ? { ...x, status: x.status === "Active" ? "Suspended" : "Active" }
                                        : x
                                    )
                                  )
                                }
                                className={`px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-xs font-bold`}
                              >
                                {l.status === "Active" ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "reports" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Reports</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => toast("Export CSV coming soon", "success")}
                    className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => toast("Export PDF coming soon", "success")}
                    className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                  >
                    Export PDF
                  </button>
                </div>
              </div>

              {(() => {
                const rangeDays = reportFilters.range === "year" ? 365 : Number(reportFilters.range);
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - rangeDays);

                const filteredIssues = issues.filter((i) => {
                  const issueDate = new Date(i.issueDate);
                  if (reportFilters.range !== "all" && issueDate < fromDate) return false;
                  if (reportFilters.class || reportFilters.section) {
                    const student = students.find((s) => s.id === i.studentId);
                    if (reportFilters.class && String(student?.class) !== String(reportFilters.class)) return false;
                    if (reportFilters.section && String(student?.section).toLowerCase() !== String(reportFilters.section).toLowerCase()) return false;
                  }
                  if (reportFilters.category) {
                    const book = books.find((b) => b.id === i.bookId);
                    if (String(book?.genre) !== String(reportFilters.category)) return false;
                  }
                  return true;
                });

                const issuedCount = filteredIssues.length;
                const returnedCount = filteredIssues.filter((i) => i.returnDate).length;
                const overdueCount = filteredIssues.filter((i) => !i.returnDate && new Date(i.dueDate) < new Date()).length;

                const fineCollected = filteredIssues.reduce((sum, i) => {
                  if (!i.returnDate) return sum;
                  const fine = Math.max(
                    0,
                    Math.floor((new Date(i.returnDate) - new Date(i.dueDate)) / 86400000) * settings.fineRate
                  );
                  return sum + fine;
                }, 0);

                const weekly = Array.from({ length: 7 }, (_, i) => {
                  const day = daysAgo(6 - i);
                  const issued = filteredIssues.filter((x) => x.issueDate === day).length;
                  const returned = filteredIssues.filter((x) => x.returnDate === day).length;
                  return { day, issued, returned };
                });
                const maxWeekly = Math.max(1, ...weekly.map((d) => Math.max(d.issued, d.returned)));

                const topBooks = filteredIssues.reduce((acc, i) => {
                  acc[i.bookId] = (acc[i.bookId] || 0) + 1;
                  return acc;
                }, {});
                const topIssuedBooks = Object.entries(topBooks)
                  .map(([bookId, count]) => ({
                    book: books.find((b) => b.id === bookId),
                    count,
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5);

                const fineTrend = Array.from({ length: 7 }, (_, i) => {
                  const day = daysAgo(6 - i);
                  const amount = filteredIssues
                    .filter((x) => x.returnDate === day)
                    .reduce((sum, x) => sum + Math.max(0, Math.floor((new Date(x.returnDate) - new Date(x.dueDate)) / 86400000) * settings.fineRate), 0);
                  return { day, amount };
                });
                const maxFine = Math.max(1, ...fineTrend.map((d) => d.amount));

                const lowStock = books.filter((b) => b.available <= settings.lowStockThreshold);
                const categoryCounts = books.reduce((acc, b) => {
                  const key = b.genre || "Other";
                  acc[key] = (acc[key] || 0) + (Number(b.total) || 0);
                  return acc;
                }, {});
                const popularCategories = Object.entries(categoryCounts)
                  .map(([genre, count]) => ({ genre, count }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5);

                return (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard label="Issued" value={issuedCount} sub="Filtered" icon={RotateCcw} color="amber" theme={theme} />
                      <StatCard label="Returned" value={returnedCount} sub="Filtered" icon={CheckCircle} color="green" theme={theme} />
                      <StatCard label="Overdue" value={overdueCount} sub="Pending" icon={AlertTriangle} color="red" theme={theme} />
                      <StatCard label="Fine Collected" value={`Rs ${fineCollected}`} sub="Returned" icon={IndianRupee} color="blue" theme={theme} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Sel
                        theme={theme}
                        className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                        style={{
                          color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                        }}
                        value={reportFilters.range}
                        onChange={(e) => setReportFilters((p) => ({ ...p, range: e.target.value }))}
                      >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="year">This year</option>
                        <option value="all">All time</option>
                      </Sel>
                      <Sel
                        theme={theme}
                        className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                        style={{
                          color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                        }}
                        value={reportFilters.class}
                        onChange={(e) => setReportFilters((p) => ({ ...p, class: e.target.value }))}
                      >
                        <option value="">All Classes</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </Sel>
                      <Sel
                        theme={theme}
                        className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                        style={{
                          color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                        }}
                        value={reportFilters.section}
                        onChange={(e) => setReportFilters((p) => ({ ...p, section: e.target.value }))}
                      >
                        <option value="">All Sections</option>
                        {["A", "B", "C", "D", "E"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Sel>
                      <Sel
                        theme={theme}
                        className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                        style={{
                          color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                        }}
                        value={reportFilters.category}
                        onChange={(e) => setReportFilters((p) => ({ ...p, category: e.target.value }))}
                      >
                        <option value="">All Categories</option>
                        {[...new Set(books.map((b) => b.genre).filter(Boolean))].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </Sel>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <h3 className={`text-xs font-bold ${t.sub} mb-3`}>Issued vs Returned (7 days)</h3>
                        <div className="h-44 flex items-end gap-3">
                          {weekly.map((d) => (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full flex items-end gap-1">
                                <div
                                  className="flex-1 rounded-lg bg-amber-500/70"
                                  style={{ height: `${Math.max(10, (d.issued / maxWeekly) * 120)}px` }}
                                  title={`Issued ${d.issued}`}
                                />
                                <div
                                  className="flex-1 rounded-lg bg-emerald-500/70"
                                  style={{ height: `${Math.max(10, (d.returned / maxWeekly) * 120)}px` }}
                                  title={`Returned ${d.returned}`}
                                />
                              </div>
                              <span className={`text-[10px] ${t.muted}`}>{d.day.slice(5)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <h3 className={`text-xs font-bold ${t.sub} mb-3`}>Fine Trend (7 days)</h3>
                        <div className="h-44 flex items-end gap-3">
                          {fineTrend.map((d) => (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                              <span className={`text-[10px] ${t.muted}`}>Rs {d.amount}</span>
                              <div
                                className="w-full rounded-xl bg-gradient-to-t from-rose-500/70 to-rose-300/40"
                                style={{ height: `${Math.max(10, (d.amount / maxFine) * 120)}px` }}
                              />
                              <span className={`text-[10px] ${t.muted}`}>{d.day.slice(5)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <h3 className={`text-xs font-bold ${t.sub} mb-3`}>Top 5 Most Issued Books</h3>
                        <div className="space-y-3">
                          {(() => {
                            const maxTop = Math.max(1, ...topIssuedBooks.map((b) => b.count));
                            return topIssuedBooks.map((b) => (
                              <div key={b.book?.id} className={`p-3 rounded-xl border ${t.border}`}>
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm font-bold ${t.text}`}>{b.book?.title || "-"}</p>
                                  <span className={`text-xs ${t.sub}`}>{b.count} issues</span>
                                </div>
                                <p className={`text-xs ${t.muted}`}>{b.book?.author || "-"}</p>
                                <div className="mt-2 h-2 rounded-full bg-white/10 border border-white/10">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-sky-500/80 to-emerald-400/70"
                                    style={{ width: `${Math.max(8, (b.count / maxTop) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ));
                          })()}
                          {topIssuedBooks.length === 0 && (
                            <p className={`text-xs ${t.muted}`}>No data available.</p>
                          )}
                        </div>
                      </div>
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <h3 className={`text-xs font-bold ${t.sub} mb-3`}>Quick Insights</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className={`p-3 rounded-xl border ${t.border}`}>
                            <p className={`text-xs ${t.sub}`}>Low Stock</p>
                            <p className={`text-xl font-black ${t.text}`}>{lowStock.length}</p>
                            <p className={`text-[11px] ${t.muted}`}>below threshold</p>
                          </div>
                          <div className={`p-3 rounded-xl border ${t.border}`}>
                            <p className={`text-xs ${t.sub}`}>Active Categories</p>
                            <p className={`text-xl font-black ${t.text}`}>{popularCategories.length}</p>
                            <p className={`text-[11px] ${t.muted}`}>top tracked</p>
                          </div>
                        </div>
                        <div className={`mt-3 p-3 rounded-xl border ${t.border}`}>
                          <p className={`text-xs ${t.sub} mb-2`}>Popular Categories</p>
                          <div className="space-y-2">
                            {(() => {
                              const maxCat = Math.max(1, ...popularCategories.map((c) => c.count));
                              return popularCategories.map((c) => (
                                <div key={c.genre} className="flex items-center gap-2">
                                  <span className={`text-[11px] ${t.sub} w-24 truncate`}>{c.genre}</span>
                                  <div className="flex-1 h-2 rounded-full bg-white/10 border border-white/10">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-300/50"
                                      style={{ width: `${Math.max(10, (c.count / maxCat) * 100)}%` }}
                                    />
                                  </div>
                                  <span className={`text-[11px] ${t.muted}`}>{c.count}</span>
                                </div>
                              ));
                            })()}
                            {popularCategories.length === 0 && (
                              <span className={`text-xs ${t.muted}`}>-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </section>
          )}

          {tab === "activity" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold ${t.text}`}>Activity Log</h2>
                <div className="flex gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "librarian", label: "Librarians" },
                    { key: "student", label: "Students" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActivityView(item.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border ${t.border} ${
                        activityView === item.key
                          ? "bg-amber-500 text-black"
                          : `${t.card} ${t.sub}`
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <Inp
                  theme={theme}
                  placeholder="Search activity..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                />
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="issue">Issue</option>
                  <option value="return">Return</option>
                  <option value="fine">Fine</option>
                  <option value="book">Book</option>
                  <option value="login">Login</option>
                </Sel>
                <Sel
                  theme={theme}
                  className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                  style={{
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                  }}
                  value={activityRange}
                  onChange={(e) => setActivityRange(e.target.value)}
                >
                  <option value="all">All time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="60">Last 2 months</option>
                </Sel>
                <Inp
                  theme={theme}
                  type="datetime-local"
                  value={activityDateFrom}
                  onChange={(e) => setActivityDateFrom(e.target.value)}
                />
              </div>

              {(() => {
                const librarianEvents = log.map((l) => ({
                  id: `log-${l.id}`,
                  role: "librarian",
                  actor: l.user,
                  action: l.action,
                  time: l.time,
                  type: l.action.toLowerCase().includes("fine")
                    ? "fine"
                    : l.action.toLowerCase().includes("issued")
                    ? "issue"
                    : l.action.toLowerCase().includes("returned")
                    ? "return"
                    : l.action.toLowerCase().includes("login")
                    ? "login"
                    : "book",
                }));

                const studentEvents = issues.flatMap((i) => {
                  const student = students.find((s) => s.id === i.studentId);
                  const book = books.find((b) => b.id === i.bookId);
                  const items = [
                    {
                      id: `stu-${i.id}-issue`,
                      role: "student",
                      actor: student?.name || "Student",
                      action: `Borrowed '${book?.title || "-"}'`,
                      time: `${i.issueDate} 10:00`,
                      type: "issue",
                    },
                  ];
                  if (i.returnDate) {
                    items.push({
                      id: `stu-${i.id}-return`,
                      role: "student",
                      actor: student?.name || "Student",
                      action: `Returned '${book?.title || "-"}'`,
                      time: `${i.returnDate} 16:00`,
                      type: "return",
                    });
                  }
                  return items;
                });

                const allEvents = [...librarianEvents, ...studentEvents]
                  .sort((a, b) => (a.time < b.time ? 1 : -1));

                const q = activitySearch.trim().toLowerCase();
                const filtered = allEvents.filter((e) => {
                  if (activityView !== "all" && e.role !== activityView) return false;
                  if (activityFilter !== "all" && e.type !== activityFilter) return false;
                  if (activityRange !== "all") {
                    const days = (new Date() - new Date(e.time)) / 86400000;
                    if (days > Number(activityRange)) return false;
                  }
                  if (activityDateFrom) {
                    const fromDate = new Date(activityDateFrom);
                    const eventDate = new Date(e.time);
                    if (eventDate < fromDate) return false;
                  }
                  if (!q) return true;
                  return [e.actor, e.action, e.time]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q));
                });

                return (
                  <div className="mt-4 space-y-3 relative">
                    <div className={`absolute left-3 top-0 bottom-0 w-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />
                    {filtered.map((e) => (
                      <div key={e.id} className="relative pl-8">
                        <div className={`absolute left-2.5 top-3 w-2.5 h-2.5 rounded-full ${
                          e.role === "student" ? "bg-sky-500" : "bg-emerald-500"
                        }`} />
                        <div className={`p-3 rounded-xl border ${t.border} flex items-center justify-between gap-3`}>
                          <div>
                            <p className={`text-sm ${t.text}`}>{e.action}</p>
                            <p className={`text-xs ${t.muted}`}>{e.actor} Ã‚Â· {e.time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge color={e.role === "student" ? "blue" : "green"}>
                              {e.role === "student" ? "Student" : "Librarian"}
                            </Badge>
                            <Badge color={e.type === "issue" ? "amber" : e.type === "return" ? "green" : e.type === "fine" ? "red" : "blue"}>
                              {e.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 && (
                      <p className={`text-xs ${t.muted}`}>No activity found.</p>
                    )}
                  </div>
                );
              })()}
            </section>
          )}

          {tab === "notifications" && (
            <section className={`${t.card} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className={`text-sm font-bold ${t.text}`}>Notifications & Alerts</h2>
                  <p className={`text-xs ${t.sub} mt-1`}>Manage active system alerts and run bulk campaigns.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="space-y-4">
                  <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                    <h3 className={`text-xs font-bold flex items-center gap-2 ${t.text}`}>
                      <Bell size={16} className="text-amber-500" /> Active System Alerts
                    </h3>
                    <div className="mt-4 space-y-3">
                      {issues.filter(i => calcFine(i.dueDate, settings.fineRate) > 0).slice(0, 3).map(i => {
                        const student = students.find(s => s.id === i.studentId);
                        const book = books.find(b => b.id === i.bookId);
                        return (
                          <div key={`alert-overdue-${i.id}`} className={`p-3 rounded-xl border border-red-500/20 bg-red-500/5`}>
                            <p className="text-sm font-bold text-red-500">Overdue: {student?.name || i.studentId}</p>
                            <p className={`text-xs mt-1 ${t.text}`}>Has not returned "{book?.title || i.bookId}"</p>
                            <p className={`text-xs mt-1 font-mono ${t.sub}`}>Due: {fmt(i.dueDate)} Ã‚Â· Fine: Rs {calcFine(i.dueDate, settings.fineRate)}</p>
                          </div>
                        );
                      })}
                      {books.filter(b => b.available <= (settings.lowStockThreshold || 0)).slice(0, 3).map(b => (
                        <div key={`alert-stock-${b.id}`} className={`p-3 rounded-xl border border-amber-500/20 bg-amber-500/5`}>
                          <p className="text-sm font-bold text-amber-500">Low Stock: {b.title}</p>
                          <p className={`text-xs mt-1 ${t.text}`}>Only {b.available} copies available in library.</p>
                        </div>
                      ))}
                      {issues.filter(i => calcFine(i.dueDate, settings.fineRate) > 0).length === 0 && books.filter(b => b.available <= (settings.lowStockThreshold || 0)).length === 0 && (
                        <div className={`p-4 text-center text-xs ${t.muted} border border-dashed rounded-xl ${t.border}`}>
                          <CheckCircle size={24} className="mx-auto mb-2 text-emerald-500 opacity-50" />
                          All caught up! No active alerts.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                    <h3 className={`text-xs font-bold flex items-center gap-2 ${t.text}`}>
                      <Send size={16} className="text-blue-500" /> Quick Notification
                    </h3>
                    <div className="mt-3 grid gap-3">
                      <Field label="Notification Type" theme={theme}>
                        <Sel
                          theme={theme}
                          value={testNotifyReason}
                          onChange={(e) => setTestNotifyReason(e.target.value)}
                        >
                          <option value="dueReminder">Due Date Reminder</option>
                          <option value="overdueNotice">Overdue Notice</option>
                          <option value="newArrival">New Book Arrival</option>
                          <option value="cardRenewal">Card Renewal</option>
                          <option value="fineReceipt">Fine Receipt</option>
                        </Sel>
                      </Field>
                      <Field label="Recipient (Email / Phone)" theme={theme}>
                        <Inp theme={theme} placeholder="student@example.com / +91xxxx" />
                      </Field>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors">
                          Send Notification
                        </button>
                        <button className={`px-4 py-2 rounded-xl text-xs font-bold border ${t.border} ${t.hover} transition-colors`}>
                          Preview Template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">

                  <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                    <h3 className={`text-xs font-bold ${t.sub}`}>Bulk Campaigns</h3>
                    <div className="mt-3 grid gap-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Class" theme={theme}>
                          <Sel theme={theme} value={bulkClass} onChange={(e) => setBulkClass(e.target.value)}>
                            <option value="">All Classes</option>
                            {classOptions.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </Sel>
                        </Field>
                        <Field label="Section" theme={theme}>
                          <Sel theme={theme} value={bulkSection} onChange={(e) => setBulkSection(e.target.value)}>
                            <option value="">All Sections</option>
                            {sectionOptions.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </Sel>
                        </Field>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Overdue Fine Above" theme={theme}>
                          <Sel
                            theme={theme}
                            value={bulkFineThreshold}
                            onChange={(e) => setBulkFineThreshold(Number(e.target.value) || 0)}
                          >
                            {[10, 25, 50, 75, 100].map((v) => (
                              <option key={v} value={v}>Rs {v}+</option>
                            ))}
                          </Sel>
                        </Field>
                        <Field label="New Arrivals Window" theme={theme}>
                          <Sel
                            theme={theme}
                            value={newArrivalWindow}
                            onChange={(e) => setNewArrivalWindow(Number(e.target.value) || 0)}
                          >
                            {[7, 14, 30].map((d) => (
                              <option key={d} value={d}>Last {d} days</option>
                            ))}
                          </Sel>
                        </Field>
                      </div>
                      <div className={`p-3 rounded-xl border ${t.border} text-xs ${t.sub}`}>
                        Overdue target: <span className="text-amber-500 font-bold">{overdueTargets.length}</span> students
                        <span className={`ml-2 ${t.muted}`}>| New arrivals: {books.slice(0, 6).length} latest books</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            toast(
                              overdueTargets.length
                                ? `Overdue notice queued for ${overdueTargets.length} students.`
                                : "No overdue students match this filter.",
                              overdueTargets.length ? "success" : "info"
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                        >
                          Send Overdue Notice
                        </button>
                        <button
                          onClick={() =>
                            toast(
                              bulkStudents.length
                                ? `New arrivals sent to ${bulkStudents.length} students.`
                                : "No students match this filter.",
                              bulkStudents.length ? "success" : "info"
                            )
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-bold border ${t.border} ${t.card}`}
                        >
                          Notify New Books
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

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
        </main>
        {studentModalOpen && (
          <Modal
            title="Add Student"
            onClose={() => setStudentModalOpen(false)}
            theme={theme}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`p-3 rounded-xl border ${t.border} ${t.card}`}>
                <p className={`text-xs ${t.sub}`}>Student ID</p>
                <p className={`text-sm font-bold ${t.text}`}>Auto generated</p>
              </div>
              <Field label="Roll Number" theme={theme}>
                <Inp
                  theme={theme}
                  placeholder="Required"
                  value={newStudent.rollNo}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "");
                    setNewStudent((p) => ({ ...p, rollNo: next }));
                    setStudentErrors((p) => ({ ...p, rollNo: validateStudentField("rollNo", next) }));
                  }}
                />
                {studentErrors.rollNo && (
                  <p className="text-[11px] text-red-500 mt-1">{studentErrors.rollNo}</p>
                )}
              </Field>
              <Field label="Name" theme={theme}>
                <Inp
                  theme={theme}
                  placeholder="Student name"
                  value={newStudent.name}
                  onChange={(e) => {
                    const next = e.target.value;
                    setNewStudent((p) => ({ ...p, name: next }));
                    setStudentErrors((p) => ({ ...p, name: validateStudentField("name", next) }));
                  }}
                />
                {studentErrors.name && (
                  <p className="text-[11px] text-red-500 mt-1">{studentErrors.name}</p>
                )}
              </Field>
              <Field label="Class" theme={theme}>
                <Sel
                  theme={theme}
                  value={newStudent.class}
                  onChange={(e) => {
                    const next = e.target.value;
                    setNewStudent((p) => ({ ...p, class: next }));
                    setStudentErrors((p) => ({ ...p, class: validateStudentField("class", next) }));
                  }}
                >
                  <option value="">Select class</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Sel>
                {studentErrors.class && (
                  <p className="text-[11px] text-red-500 mt-1">{studentErrors.class}</p>
                )}
              </Field>
              <Field label="Section" theme={theme}>
                <Sel
                  theme={theme}
                  value={newStudent.section}
                  onChange={(e) => {
                    const next = e.target.value;
                    setNewStudent((p) => ({ ...p, section: next }));
                    setStudentErrors((p) => ({ ...p, section: validateStudentField("section", next) }));
                  }}
                >
                  <option value="">Select section</option>
                  {["A", "B", "C", "D", "E"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Sel>
                {studentErrors.section && (
                  <p className="text-[11px] text-red-500 mt-1">{studentErrors.section}</p>
                )}
              </Field>
              <Field label="Parent Contact" theme={theme}>
                <Inp
                  theme={theme}
                  placeholder="Contact number"
                  value={newStudent.contact}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "");
                    setNewStudent((p) => ({ ...p, contact: next }));
                    setStudentErrors((p) => ({ ...p, contact: validateStudentField("contact", next) }));
                  }}
                />
                {studentErrors.contact && (
                  <p className="text-[11px] text-red-500 mt-1">{studentErrors.contact}</p>
                )}
              </Field>
              <Field label="Email" theme={theme}>
                <Inp
                  theme={theme}
                  placeholder="Email"
                  value={newStudent.email}
                  onChange={(e) => {
                    const next = e.target.value;
                    setNewStudent((p) => ({ ...p, email: next }));
                    setStudentErrors((p) => ({ ...p, email: validateStudentField("email", next) }));
                  }}
                  onBlur={(e) => {
                    let next = e.target.value.trim();
                    if (next && !next.includes("@")) {
                      next = `${next}@gmail.com`;
                    }
                    if (next.endsWith("@gmai.com")) {
                      next = next.replace(/@gmai\.com$/i, "@gmail.com");
                    }
                    setNewStudent((p) => ({ ...p, email: next }));
                    setStudentErrors((p) => ({ ...p, email: validateStudentField("email", next) }));
                  }}
                />
                {studentErrors.email && (
                  <p className="text-[11px] text-red-500 mt-1">{studentErrors.email}</p>
                )}
              </Field>
              <Field label="Address" theme={theme}>
                <Inp
                  theme={theme}
                  placeholder="Address"
                  value={newStudent.address}
                  onChange={(e) => setNewStudent((p) => ({ ...p, address: e.target.value }))}
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setStudentModalOpen(false)}
                className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold"
              >
                Save & Generate Card
              </button>
            </div>
          </Modal>
        )}

        {studentImportOpen && (
          <Modal
            title="Import Students (CSV)"
            onClose={() => setStudentImportOpen(false)}
            theme={theme}
          >
            <div className="space-y-3">
              <p className={`text-xs ${t.muted}`}>
                Header: id,rollno,name,class,section,contact,email,address,status
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setStudentImportText(String(reader.result || ""));
                  reader.readAsText(file);
                }}
              />
              <textarea
                className={`w-full h-40 rounded-xl border ${t.border} ${t.card} p-3 text-sm`}
                placeholder="Paste CSV here..."
                value={studentImportText}
                onChange={(e) => setStudentImportText(e.target.value)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setStudentImportOpen(false)}
                className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleImportStudents(studentImportText);
                  setStudentImportText("");
                  setStudentImportOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold"
              >
                Import
              </button>
            </div>
          </Modal>
        )}

        {selectedStudent && (
          <div className="fixed inset-0 z-50">
            <button
              className="absolute inset-0 bg-black/40"
              onClick={() => setSelectedStudent(null)}
              aria-label="Close"
            />
            <div className={`absolute right-0 top-0 h-full w-full max-w-2xl ${t.card} border-l ${t.border} shadow-2xl overflow-y-auto`}>
              {(() => {
                const studentIssues = issues.filter((i) => i.studentId === selectedStudent.id);
                const activeIssues = studentIssues.filter((i) => !i.returnDate);
                const totalFine = getStudentFine(selectedStudent.id);
                const lastVisit = getStudentActivity(selectedStudent.id);
                const history = [...studentIssues].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
                return (
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`text-lg font-black ${t.text}`}>{selectedStudent.name}</h3>
                        <p className={`text-xs ${t.muted}`}>
                          ID {selectedStudent.id} Ã‚Â· Class {selectedStudent.class}{selectedStudent.section}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={selectedStudent.status === "Active" ? "green" : "red"}>
                          {selectedStudent.status}
                        </Badge>
                        <button
                          onClick={() => setSelectedStudent(null)}
                          className={`px-2 py-1 rounded-lg border ${t.border} ${t.sub} text-xs font-bold`}
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <StatCard label="Active Issues" value={activeIssues.length} sub={`of ${settings.maxBooks}`} icon={BookOpen} color="amber" theme={theme} />
                      <StatCard label="Fine Due" value={totalFine > 0 ? `Rs ${totalFine}` : "-"} sub="Overdue" icon={IndianRupee} color="red" theme={theme} />
                      <StatCard label="Last Visit" value={lastVisit} sub="Activity" icon={Clock} color="blue" theme={theme} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openCard(selectedStudent)}
                        className="px-3 py-2 rounded-xl bg-blue-500/15 text-blue-500 text-xs font-bold"
                      >
                        View Card
                      </button>
                      <a
                        href={`tel:${selectedStudent.contact}`}
                        className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-500 text-xs font-bold"
                      >
                        Call Parent
                      </a>
                      <a
                        href={`https://wa.me/${String(selectedStudent.contact || "").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
                      >
                        WhatsApp
                      </a>
                      {selectedStudent.email && (
                        <a
                          href={`mailto:${selectedStudent.email}`}
                          className="px-3 py-2 rounded-xl bg-slate-500/15 text-slate-600 text-xs font-bold"
                        >
                          Email
                        </a>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                      <div>
                        <h4 className={`text-xs font-bold ${t.sub} mb-2`}>Issue History</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {history.map((i) => {
                            const book = books.find((b) => b.id === i.bookId);
                            return (
                              <div key={i.id} className={`p-3 rounded-xl border ${t.border}`}>
                                <p className={`text-sm font-bold ${t.text}`}>{book?.title || "-"}</p>
                                <p className={`text-xs ${t.muted}`}>Issued {fmt(i.issueDate)} Ã‚Â· Due {fmt(i.dueDate)} Ã‚Â· {i.returnDate ? `Returned ${fmt(i.returnDate)}` : "Active"}</p>
                              </div>
                            );
                          })}
                          {history.length === 0 && (
                            <p className={`text-xs ${t.muted}`}>No history.</p>
                          )}
                        </div>
                      </div>
                      <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                        <h4 className={`text-xs font-bold ${t.sub} mb-3`}>Current Issued Books</h4>
                        {activeIssues.length === 0 && (
                          <p className={`text-xs ${t.muted}`}>No active issues.</p>
                        )}
                        <div className="space-y-2">
                          {activeIssues.map((i) => {
                            const book = books.find((b) => b.id === i.bookId);
                            return (
                              <div key={i.id} className={`p-3 rounded-xl border ${t.border}`}>
                                <p className={`text-sm font-bold ${t.text}`}>{book?.title || "-"}</p>
                                <p className={`text-xs ${t.muted}`}>Due {fmt(i.dueDate)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {bookModalOpen && (
          <Modal
            title="Add Book"
            onClose={() => setBookModalOpen(false)}
            theme={theme}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Book ID" theme={theme}>
                <Inp
                  theme={theme}
                  placeholder="Auto if empty"
                  value={newBook.id}
                  onChange={(e) => setNewBook((p) => ({ ...p, id: e.target.value }))}
                />
              </Field>
              <Field label="Title" theme={theme}>
                <Inp
                  theme={theme}
                  value={newBook.title}
                  onChange={(e) => setNewBook((p) => ({ ...p, title: e.target.value }))}
                />
              </Field>
              <Field label="Author" theme={theme}>
                <Inp
                  theme={theme}
                  value={newBook.author}
                  onChange={(e) => setNewBook((p) => ({ ...p, author: e.target.value }))}
                />
              </Field>
              <Field label="Category" theme={theme}>
                <Inp
                  theme={theme}
                  placeholder="Fiction, Horror, Science..."
                  value={newBook.genre}
                  onChange={(e) => setNewBook((p) => ({ ...p, genre: e.target.value }))}
                />
              </Field>
              <Field label="Total Copies" theme={theme}>
                <Inp
                  theme={theme}
                  type="number"
                  value={newBook.total}
                  onChange={(e) => setNewBook((p) => ({ ...p, total: e.target.value }))}
                />
              </Field>
            </div>
            
            <div className="mt-4 border-t border-slate-700/50 pt-4">
              <button 
                onClick={() => setShowAdvancedBookFields(!showAdvancedBookFields)}
                className={`text-xs font-bold flex items-center gap-1 ${t.sub} hover:text-amber-500 transition-colors mb-3`}
              >
                {showAdvancedBookFields ? <ChevronLeft size={14} /> : <Plus size={14} />}
                {showAdvancedBookFields ? "Hide Advanced Options" : "Show Advanced Options (ISBN, Shelf, Tags, etc.)"}
              </button>

              {showAdvancedBookFields && (
                <div className="grid gap-4 md:grid-cols-2 mt-3 p-4 rounded-xl border border-slate-700/30 bg-black/10">
                  <Field label="Publisher" theme={theme}>
                    <Inp
                      theme={theme}
                      value={newBook.publisher}
                      onChange={(e) => setNewBook((p) => ({ ...p, publisher: e.target.value }))}
                    />
                  </Field>
                  <Field label="Year" theme={theme}>
                    <Inp
                      theme={theme}
                      value={newBook.year}
                      onChange={(e) => setNewBook((p) => ({ ...p, year: e.target.value }))}
                    />
                  </Field>
                  <Field label="Available Copies" theme={theme}>
                    <Inp
                      theme={theme}
                      type="number"
                      value={newBook.available}
                      onChange={(e) => setNewBook((p) => ({ ...p, available: e.target.value }))}
                    />
                  </Field>
                  <Field label="Shelf" theme={theme}>
                    <Inp
                      theme={theme}
                      value={newBook.shelf}
                      onChange={(e) => setNewBook((p) => ({ ...p, shelf: e.target.value }))}
                    />
                  </Field>
                  <Field label="Aisle" theme={theme}>
                    <Inp
                      theme={theme}
                      value={newBook.aisle}
                      onChange={(e) => setNewBook((p) => ({ ...p, aisle: e.target.value }))}
                    />
                  </Field>
                  <Field label="Language" theme={theme}>
                    <Inp
                      theme={theme}
                      value={newBook.language}
                      onChange={(e) => setNewBook((p) => ({ ...p, language: e.target.value }))}
                    />
                  </Field>
                  <Field label="Tags (comma separated)" theme={theme}>
                    <Inp
                      theme={theme}
                      value={newBook.tags}
                      onChange={(e) => setNewBook((p) => ({ ...p, tags: e.target.value }))}
                    />
                  </Field>
                  <Field label="ISBN" theme={theme}>
                    <Inp
                      theme={theme}
                      value={newBook.isbn}
                      onChange={(e) => setNewBook((p) => ({ ...p, isbn: e.target.value }))}
                    />
                  </Field>
                  <Field label="Edition" theme={theme}>
                    <Inp
                      theme={theme}
                      value={newBook.edition}
                      onChange={(e) => setNewBook((p) => ({ ...p, edition: e.target.value }))}
                    />
                  </Field>
                  <Field label="Format" theme={theme}>
                    <Sel
                      theme={theme}
                      value={newBook.format}
                      onChange={(e) => setNewBook((p) => ({ ...p, format: e.target.value }))}
                    >
                      <option value="">Select format</option>
                      <option value="Hardcover">Hardcover</option>
                      <option value="Paperback">Paperback</option>
                      <option value="eBook">eBook</option>
                    </Sel>
                  </Field>
                </div>
              )}
            </div>
            {showAdvancedBookFields && (
              <p className={`mt-4 text-xs ${t.muted}`}>
                Tip: add shelf/aisle and tags so books are easier to locate and filter.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setBookModalOpen(false)}
                className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddBook}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold"
              >
                Save Book
              </button>
            </div>
          </Modal>
        )}

        {pendingReturn && (
          <Modal
            title="Collect Fine"
            onClose={() => setPendingReturn(null)}
            theme={theme}
          >
            {(() => {
              const student = students.find((s) => s.id === pendingReturn.issue.studentId);
              const book = books.find((b) => b.id === pendingReturn.issue.bookId);
              return (
                <div>
                  <div className={`p-4 rounded-xl border ${t.border} ${t.card} space-y-2`}>
                    <p className={`text-sm ${t.text}`}>
                      Student: <span className="font-bold">{student?.name || "-"}</span>
                    </p>
                    <p className={`text-sm ${t.text}`}>
                      Book: <span className="font-bold">{book?.title || "-"}</span>
                    </p>
                    <p className={`text-sm ${t.text}`}>
                      Due Date: <span className="font-bold">{fmt(pendingReturn.issue.dueDate)}</span>
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className={`text-xs ${t.sub}`}>Fine to collect</p>
                      <p className={`text-2xl font-black ${t.text}`}>Rs {pendingReturn.fine}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPendingReturn(null)}
                        className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setFineStatus((prev) => ({
                            ...prev,
                            [pendingReturn.issue.id]: { status: "paid", paidAt: todayStr() },
                          }));
                          finalizeReturn(pendingReturn.issue);
                          setPendingReturn(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold"
                      >
                        Collect Fine & Return
                      </button>
                      <button
                        onClick={() => {
                          setFineStatus((prev) => ({
                            ...prev,
                            [pendingReturn.issue.id]: { status: "waived", paidAt: todayStr() },
                          }));
                          finalizeReturn(pendingReturn.issue);
                          setPendingReturn(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-bold"
                      >
                        Return Without Fine
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Modal>
        )}

        {selectedBook && (
          <Modal
            title="Book Details"
            onClose={() => setSelectedBook(null)}
            theme={theme}
            wide
          >
            {(() => {
              const bookIssues = issues.filter((i) => i.bookId === selectedBook.id);
              const activeIssues = bookIssues.filter((i) => !i.returnDate);
              const totalIssues = bookIssues.length;
              const weekly = Array.from({ length: 7 }, (_, i) => {
                const day = daysAgo(6 - i);
                const count = bookIssues.filter((iss) => iss.issueDate === day).length;
                return { day, count };
              });
              const maxCount = Math.max(1, ...weekly.map((d) => d.count));

              return (
                <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`text-lg font-black ${t.text}`}>{selectedBook.title}</h3>
                        <p className={`text-xs ${t.muted}`}>by {selectedBook.author}</p>
                      </div>
                      <Badge color={selectedBook.available > 0 ? "green" : "red"}>
                        {selectedBook.available > 0 ? "Available" : "Issued"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className={`p-3 rounded-xl border ${t.border}`}>
                        <p className={`text-xs ${t.sub}`}>Category</p>
                        <p className={`text-sm font-bold ${t.text}`}>{selectedBook.genre}</p>
                      </div>
                      <div className={`p-3 rounded-xl border ${t.border}`}>
                        <p className={`text-xs ${t.sub}`}>Publisher</p>
                        <p className={`text-sm font-bold ${t.text}`}>{selectedBook.publisher || "-"}</p>
                      </div>
                      <div className={`p-3 rounded-xl border ${t.border}`}>
                        <p className={`text-xs ${t.sub}`}>Location</p>
                        <p className={`text-sm font-bold ${t.text}`}>
                          Shelf {selectedBook.shelf || "-"} Ã‚Â· Aisle {selectedBook.aisle || "-"}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl border ${t.border}`}>
                        <p className={`text-xs ${t.sub}`}>Tags</p>
                        <p className={`text-sm font-bold ${t.text}`}>
                          {(selectedBook.tags || []).slice(0, 4).join(", ") || "-"}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl border ${t.border}`}>
                        <p className={`text-xs ${t.sub}`}>ISBN</p>
                        <p className={`text-sm font-bold ${t.text}`}>{selectedBook.isbn || "-"}</p>
                      </div>
                      <div className={`p-3 rounded-xl border ${t.border}`}>
                        <p className={`text-xs ${t.sub}`}>Format</p>
                        <p className={`text-sm font-bold ${t.text}`}>{selectedBook.format || "-"}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <StatCard label="Total Issues" value={totalIssues} sub="All time" icon={RotateCcw} color="amber" theme={theme} />
                      <StatCard label="Active Issues" value={activeIssues.length} sub="Currently" icon={Users} color="blue" theme={theme} />
                      <StatCard label="Available" value={selectedBook.available} sub={`of ${selectedBook.total}`} icon={BookOpen} color="green" theme={theme} />
                    </div>

                    <div className="mt-5">
                      <h4 className={`text-xs font-bold ${t.sub} mb-2`}>Active Holders</h4>
                      {activeIssues.length === 0 && (
                        <p className={`text-xs ${t.muted}`}>No active issues.</p>
                      )}
                      <div className="space-y-2">
                        {activeIssues.map((i) => {
                          const student = students.find((s) => s.id === i.studentId);
                          return (
                            <div key={i.id} className={`p-3 rounded-xl border ${t.border}`}>
                              <p className={`text-sm font-bold ${t.text}`}>{student?.name || "-"}</p>
                              <p className={`text-xs ${t.muted}`}>Issue ID: {i.displayId || i.id} Ã‚Â· Due {fmt(i.dueDate)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-xs font-bold ${t.sub}`}>All-Time Issuers</h4>
                        <div className="flex items-center gap-2">
                          <Sel
                            theme={theme}
                            className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                            value={bookHistoryFilter.range}
                            onChange={(e) =>
                              setBookHistoryFilter((p) => ({ ...p, range: e.target.value }))
                            }
                          >
                            <option value="all">All time</option>
                            <option value="30">Last 30 days</option>
                            <option value="7">Last 7 days</option>
                          </Sel>
                          <Sel
                            theme={theme}
                            className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}
                            value={bookHistoryFilter.status}
                            onChange={(e) =>
                              setBookHistoryFilter((p) => ({ ...p, status: e.target.value }))
                            }
                          >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="returned">Returned</option>
                          </Sel>
                          <button
                            onClick={() => setBookHistoryFilter({ range: "all", status: "all" })}
                            className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      {bookIssues.length === 0 && (
                        <p className={`text-xs ${t.muted}`}>No issues yet.</p>
                      )}
                      <div className="space-y-2">
                        {bookIssues
                          .filter((i) => {
                            if (bookHistoryFilter.status === "active" && i.returnDate) return false;
                            if (bookHistoryFilter.status === "returned" && !i.returnDate) return false;
                            const range = Number(bookHistoryFilter.range);
                            if (!range) return true;
                            const cutoff = new Date();
                            cutoff.setDate(cutoff.getDate() - range);
                            return new Date(i.issueDate) >= cutoff;
                          })
                          .map((i) => {
                          const student = students.find((s) => s.id === i.studentId);
                          return (
                            <div key={i.id} className={`p-3 rounded-xl border ${t.border}`}>
                              <p className={`text-sm font-bold ${t.text}`}>{student?.name || "-"}</p>
                              <p className={`text-xs ${t.muted}`}>Issue ID: {i.displayId || i.id} Ã‚Â· Issued {fmt(i.issueDate)} Ã‚Â· Due {fmt(i.dueDate)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className={`${t.card} border ${t.border} rounded-2xl p-4 shadow-lg shadow-emerald-500/10`}>
                      <h4 className={`text-xs font-bold ${t.sub} mb-3`}>Weekly Issue Trend</h4>
                      <div className="h-44 flex items-end gap-3">
                        {weekly.map((d) => {
                          const isPeak = d.count === maxCount;
                          return (
                          <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                            <span className={`text-[10px] ${t.muted}`}>{d.count}</span>
                            <div
                              className={`w-full rounded-xl bg-gradient-to-t ${
                                isPeak ? "from-amber-500/80 to-amber-300/50" : "from-sky-500/70 to-sky-300/40"
                              }`}
                              style={{ height: `${Math.max(16, 22 + Math.sqrt(d.count / maxCount) * 74)}px` }}
                              title={`${d.count} issued`}
                            />
                            <span className={`text-[10px] ${t.muted}`}>{d.day.slice(5)}</span>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className={`${t.card} border ${t.border} rounded-2xl p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-xs font-bold ${t.sub}`}>Book Barcode</h4>
                        <button
                          onClick={() => {
                            const win = window.open("", "_blank", "width=420,height=520");
                            if (!win) return;
                            const barcode = bookBarcode || "";
                            win.document.write(`
                              <html>
                                <head>
                                  <title>Book Label</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; margin: 24px; }
                                    .label { width: 320px; border: 1px solid #ddd; border-radius: 12px; padding: 16px; }
                                    .title { font-size: 14px; font-weight: 700; margin: 0 0 6px 0; }
                                    .line { font-size: 11px; margin: 2px 0; }
                                    img { width: 240px; height: auto; }
                                  </style>
                                </head>
                                <body>
                                  <div class="label">
                                    <p class="title">${selectedBook.title}</p>
                                    <p class="line">ID: ${selectedBook.id}</p>
                                    <p class="line">Shelf ${selectedBook.shelf || "-"} Ã‚Â· Aisle ${selectedBook.aisle || "-"}</p>
                                    ${barcode ? `<img src="${barcode}" />` : ""}
                                  </div>
                                  <script>window.print();</script>
                                </body>
                              </html>
                            `);
                            win.document.close();
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold"
                        >
                          Print Label
                        </button>
                      </div>
                      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-400/40 p-3">
                        {bookBarcode ? (
                          <img src={bookBarcode} alt="Book Barcode" className="w-56 h-auto" />
                        ) : (
                          <span className={`text-xs ${t.muted}`}>Barcode Loading</span>
                        )}
                      </div>
                      <p className={`mt-2 text-[11px] ${t.muted}`}>
                        Scan to fetch book details & availability.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Modal>
        )}

        {librarianModalOpen && (
          <Modal
            title={librarianEditId ? "Edit Librarian" : "Add Librarian"}
            onClose={() => setLibrarianModalOpen(false)}
            theme={theme}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" theme={theme}>
                <Inp
                  theme={theme}
                  value={newLibrarian.name}
                  onChange={(e) => setNewLibrarian((p) => ({ ...p, name: e.target.value }))}
                />
              </Field>
              <Field label="Username" theme={theme}>
                <Inp
                  theme={theme}
                  value={newLibrarian.username}
                  onChange={(e) => setNewLibrarian((p) => ({ ...p, username: e.target.value }))}
                />
              </Field>
              <Field label="Password" theme={theme}>
                <Inp
                  theme={theme}
                  value={newLibrarian.password}
                  onChange={(e) => setNewLibrarian((p) => ({ ...p, password: e.target.value }))}
                />
              </Field>
              <Field label="Email" theme={theme}>
                <Inp
                  theme={theme}
                  value={newLibrarian.email}
                  onChange={(e) => setNewLibrarian((p) => ({ ...p, email: e.target.value }))}
                />
              </Field>
              <Field label="Phone" theme={theme}>
                <Inp
                  theme={theme}
                  value={newLibrarian.phone}
                  onChange={(e) => setNewLibrarian((p) => ({ ...p, phone: e.target.value }))}
                />
              </Field>
              <Field label="Role" theme={theme}>
                <Sel
                  theme={theme}
                  value={newLibrarian.role}
                  onChange={(e) => setNewLibrarian((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="">Select role</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                  <option value="Issuer">Issuer</option>
                  <option value="Viewer">Viewer</option>
                </Sel>
              </Field>
              <Field label="Status" theme={theme}>
                <Sel
                  theme={theme}
                  value={newLibrarian.status}
                  onChange={(e) => setNewLibrarian((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </Sel>
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setLibrarianModalOpen(false)}
                className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddLibrarian}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold"
              >
                Save
              </button>
            </div>
          </Modal>
        )}

        {cardLibrarian && (
          <Modal
            title="Librarian ID Card"
            onClose={() => setCardLibrarian(null)}
            theme={theme}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${t.text}`}>Library Staff Card</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const l = cardLibrarian;
                    setLibrarians((prev) =>
                      prev.map((x) => (x.id === l.id ? { ...x, password: "lib123" } : x))
                    );
                    toast("Password reset to lib123", "success");
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => {
                    const l = cardLibrarian;
                    setLibrarianEditId(l.id);
                    setNewLibrarian({
                      name: l.name || "",
                      username: l.username || "",
                      password: "",
                      email: l.email || "",
                      phone: l.phone || "",
                      role: l.role || "",
                      status: l.status || "Active",
                    });
                    setLibrarianModalOpen(true);
                  }}
                  className={`px-3 py-2 rounded-xl border ${t.border} ${t.sub} text-xs font-bold`}
                >
                  Edit
                </button>
                <button
                  onClick={printLibrarianCard}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                >
                  Print Card
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div className={`w-[320px] h-[200px] max-w-full rounded-xl border ${t.border} ${t.card} p-4 shadow-sm`}>
                <p className={`text-xs ${t.sub}`}>{settings.schoolName}</p>
                <p className={`text-base font-black ${t.text}`}>Library Staff</p>
                <div className="mt-3 grid grid-cols-[1fr_96px] gap-3 items-start">
                  <div className="text-xs">
                    <p className={t.text}>Name: {cardLibrarian.name}</p>
                    <p className={t.text}>ID: {cardLibrarian.id}</p>
                    <p className={t.text}>Role: {cardLibrarian.role || "-"}</p>
                    <p className={t.text}>Phone: {cardLibrarian.phone || "-"}</p>
                  </div>
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-400/40 p-1">
                    {cardLibrarianQr ? (
                      <img src={cardLibrarianQr} alt="Librarian QR" className="w-20 h-20" />
                    ) : (
                      <span className={`text-[10px] ${t.muted}`}>QR Loading</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {cardStudent && (
          <Modal
            title="Student ID Card"
            onClose={() => setCardStudent(null)}
            theme={theme}
          >
            <StudentCard
              student={cardStudent}
              qrDataUrl={cardQr}
              schoolName={settings.schoolName}
              theme={theme}
              onPrint={printCard}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}



