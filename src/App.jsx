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
import DashboardTab from "./components/tabs/DashboardTab";
import BooksTab from "./components/tabs/BooksTab";
import StudentsTab from "./components/tabs/StudentsTab";
import IssuesTab from "./components/tabs/IssuesTab";
import FinesTab from "./components/tabs/FinesTab";
import NotificationsTab from "./components/tabs/NotificationsTab";
import LibrariansTab from "./components/tabs/LibrariansTab";
import ReportsTab from "./components/tabs/ReportsTab";
import ActivityTab from "./components/tabs/ActivityTab";
import SettingsTab from "./components/tabs/SettingsTab";
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
            <DashboardTab
              t={t}
              theme={theme}
              stats={stats}
              reportFilters={reportFilters}
              setReportFilters={setReportFilters}
              issues={issues}
              students={students}
              books={books}
              log={log}
              dashboardFocus={dashboardFocus}
              weeklyIssued={weeklyIssued}
              setTab={setTab}
              setStudentModalOpen={setStudentModalOpen}
              setBookModalOpen={setBookModalOpen}
            />
          )}

          {tab === "books" && (
            <BooksTab
              t={t}
              theme={theme}
              books={books}
              bookSearch={bookSearch}
              setBookSearch={setBookSearch}
              bookFilters={bookFilters}
              setBookFilters={setBookFilters}
              setBookModalOpen={setBookModalOpen}
              handleDeleteBook={handleDeleteBook}
              user={user}
            />
          )}

          {tab === "students" && (
            <StudentsTab
              t={t}
              theme={theme}
              students={students}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              studentFilters={studentFilters}
              setStudentFilters={setStudentFilters}
              setStudentModalOpen={setStudentModalOpen}
              setSelectedStudent={setSelectedStudent}
              handleDeleteStudent={handleDeleteStudent}
              handlePrintIdCard={handlePrintIdCard}
            />
          )}

          {tab === "issues" && (
            <IssuesTab
              t={t}
              theme={theme}
              issues={issues}
              books={books}
              students={students}
              issueHistoryFilters={issueHistoryFilters}
              setIssueHistoryFilters={setIssueHistoryFilters}
              scanType={scanType}
              setScanType={setScanType}
              scannerActive={scannerActive}
              setScannerActive={setScannerActive}
              videoRef={videoRef}
              issueStudentId={issueStudentId}
              setIssueStudentId={setIssueStudentId}
              issueBookId={issueBookId}
              setIssueBookId={setIssueBookId}
              isScanned={isScanned}
              handleIssueBook={handleIssueBook}
              handleReturnBook={handleReturnBook}
            />
          )}

          {tab === "fines" && (
            <FinesTab
              t={t}
              theme={theme}
              issues={issues}
              students={students}
              books={books}
              fineFilters={fineFilters}
              setFineFilters={setFineFilters}
              settings={settings}
              calcFine={calcFine}
              fmt={fmt}
            />
          )}

          {tab === "librarians" && (
            <LibrariansTab
              t={t}
              theme={theme}
              librarians={librarians}
              librarianFilters={librarianFilters}
              setLibrarianFilters={setLibrarianFilters}
              user={user}
              handleAddLibrarian={handleAddLibrarian}
              handleDeleteLibrarian={handleDeleteLibrarian}
              newLibrarian={newLibrarian}
              setNewLibrarian={setNewLibrarian}
            />
          )}

          {tab === "reports" && (
            <ReportsTab
              t={t}
              theme={theme}
              stats={stats}
            />
          )}

          {tab === "activity" && (
            <ActivityTab
              t={t}
              theme={theme}
              log={log}
              stats={stats}
            />
          )}

          {tab === "notifications" && (
            <NotificationsTab
              t={t}
              theme={theme}
              testNotifyReason={testNotifyReason}
              setTestNotifyReason={setTestNotifyReason}
              settings={settings}
            />
          )}

          {tab === "settings" && (
            <SettingsTab
              t={t}
              theme={theme}
              activeSettingsTab={activeSettingsTab}
              setActiveSettingsTab={setActiveSettingsTab}
              settings={settings}
              setSettings={setSettings}
              toggleTheme={toggleTheme}
              exportData={exportData}
              handleDataImport={handleDataImport}
            />
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



