import { genUUID } from "./helpers";

export const mapStudentToDB = (s) => {
  const obj = {
    roll_no: s.rollNo,
    name: s.name,
    class: s.class,
    section: s.section,
    contact: s.contact,
    email: s.email,
    address: s.address,
    status: s.status || "Active"
  };
  obj.id = s.dbId || genUUID();
  return obj;
};

let _studentCounter = 0;
export const mapStudentFromDB = (s) => {
  _studentCounter++;
  return {
    id: s.id,      // UUID from Supabase
    dbId: s.id,    // Keep for safe updates
    displayId: `S${String(_studentCounter).padStart(3, "0")}`,
    rollNo: s.roll_no,
    name: s.name,
    class: s.class,
    section: s.section,
    contact: s.contact,
    email: s.email,
    address: s.address,
    status: s.status || "Active"
  };
};

export const mapBookToDB = (b) => {
  const obj = {
    title: b.title,
    author: b.author,
    category: b.genre,
    publisher: b.publisher,
    year: b.year ? Number(b.year) : null,
    isbn: b.isbn || null,
    language: b.language || null,
    format: b.format || null,
    tags: b.tags && b.tags.length ? b.tags : null,
    total_copies: b.total ?? 0,
    available_copies: b.available ?? 0,
    location: `${b.shelf || ""} ${b.aisle || ""}`.trim() || null,
    status: (b.available ?? b.total ?? 0) > 0 ? "Available" : "Out of Stock"
  };
  obj.id = b.dbId || genUUID();
  return obj;
};

let _bookCounter = 0;
export const mapBookFromDB = (b) => {
  _bookCounter++;
  return {
    id: b.id,       // UUID from Supabase — used as primary key everywhere
    dbId: b.id,     // Keep dbId = UUID for safe Supabase updates
    displayId: `BK${String(_bookCounter).padStart(3, "0")}`,
    title: b.title,
    author: b.author,
    genre: b.category,
    publisher: b.publisher,
    year: String(b.year || ""),
    isbn: b.isbn || "",
    language: b.language || "",
    format: b.format || "",
    tags: Array.isArray(b.tags) ? b.tags : [],
    total: b.total_copies ?? 0,
    available: b.available_copies ?? 0,
    shelf: b.location?.split(" ")[0] || "",
    aisle: b.location?.split(" ")[1] || "",
  };
};

export const mapIssueToDB = (i) => {
  const obj = {
    book_id: i.dbBookId || i.bookId,
    student_id: i.dbStudentId || i.studentId,
    issue_date: i.issueDate,
    due_date: i.dueDate,
    return_date: i.returnDate || null,
  };
  obj.id = i.dbId || genUUID();
  return obj;
};

let _issueCounter = 0;
export const mapIssueFromDB = (i) => {
  _issueCounter++;
  return {
    id: i.id,           // UUID from Supabase
    dbId: i.id,         // Keep dbId for safe updates
    displayId: `IS${String(_issueCounter).padStart(3, "0")}`,
    studentId: i.student_id,
    dbStudentId: i.student_id,
    bookId: i.book_id,
    dbBookId: i.book_id,
    issueDate: i.issue_date,
    dueDate: i.due_date,
    returnDate: i.return_date || "",
    fineAmount: i.fine_amount || 0,
    fineStatus: i.fine_status || "None"
  };
};

export const resetCounters = () => {
  _studentCounter = 0;
  _bookCounter = 0;
  _issueCounter = 0;
};

export const mapSettingsToDB = (s) => ({
  id: 1,
  school_name: s.schoolName,
  school_address: s.schoolAddress,
  school_logo: s.schoolLogo,
  fine_rate: s.fineRate,
  max_books: s.maxBooks,
  issue_days: s.issueDays,
  low_stock_threshold: s.lowStockThreshold,
  reminder_cadence: s.reminderCadence,
  notify_email: s.notifyEmail,
  notify_whatsapp: s.notifyWhatsApp,
  notify_in_app: s.notifyInApp,
  notify_sms: s.notifySms,
  remind_before: s.remindBefore,
  overdue_every: s.overdueEvery,
  quiet_start: s.quietStart,
  quiet_end: s.quietEnd,
  accent: s.accent,
});

export const mapSettingsFromDB = (row) => ({
  schoolName: row.schoolName ?? row.school_name,
  schoolAddress: row.schoolAddress ?? row.school_address,
  schoolLogo: row.schoolLogo ?? row.school_logo,
  fineRate: row.fineRate ?? row.fine_rate,
  maxBooks: row.maxBooks ?? row.max_books,
  issueDays: row.issueDays ?? row.issue_days,
  lowStockThreshold: row.lowStockThreshold ?? row.low_stock_threshold,
  reminderCadence: row.reminderCadence ?? row.reminder_cadence,
  notifyEmail: row.notifyEmail ?? row.notify_email,
  notifyWhatsApp: row.notifyWhatsApp ?? row.notify_whatsapp,
  notifyInApp: row.notifyInApp ?? row.notify_in_app,
  notifySms: row.notifySms ?? row.notify_sms,
  remindBefore: row.remindBefore ?? row.remind_before,
  overdueEvery: row.overdueEvery ?? row.overdue_every,
  quietStart: row.quietStart ?? row.quiet_start,
  quietEnd: row.quietEnd ?? row.quiet_end,
  accent: row.accent,
});
