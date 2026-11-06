import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  CircleDollarSign,
  Download,
  FileText,
  HandCoins,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  Upload,
  UserRoundCog,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";

type ViewName =
  | "dashboard"
  | "students"
  | "admissions"
  | "classes"
  | "subjects"
  | "routine"
  | "staff"
  | "payroll"
  | "fees"
  | "donations"
  | "reports"
  | "users"
  | "settings"
  | "idcards"
  | "notices"
  | "backup";

type ThemeConfig = {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  panel: string;
  text: string;
};

type Student = {
  id: string;
  name: string;
  className: string;
  section: string;
  gender: "Male" | "Female";
  roll: number;
  status: "Active" | "Inactive" | "Graduated";
  fee: number;
  due: number;
  phone: string;
  parentId: string;
  photo: string;
  dateJoined: string;
};

type ParentRecord = { id: string; name: string; phone: string; relation: string; };
type Staff = { id: string; name: string; role: string; status: "Active" | "Inactive"; phone: string; };
type Donation = { id: string; donor: string; fund: string; amount: number; date: string; method: string; };
type Invoice = { id: string; studentId: string; month: string; due: number; paid: number; status: "Paid" | "Partial" | "Due"; };
type Notice = { id: string; title: string; type: "General" | "Academic" | "Fee"; date: string; };
type UserAccount = { id: string; name: string; role: string; status: "Active" | "Pending"; lastLogin: string; };
type NavGroup = { id: string; label: string; icon: any; items: { id: ViewName; label: string; badge?: number }[] };
type TemplateOption = { id: string; name: string; accent: string; };
type ThemeKey = "emerald" | "royal" | "sunset";
type StudentFormState = {
  id: string;
  name: string;
  className: Student["className"];
  section: string;
  gender: Student["gender"];
  roll: number;
  fee: number;
  due: number;
  phone: string;
  parentId: string;
  status: Student["status"];
  photo: string;
};

const defaultTheme: ThemeConfig = {
  primary: "#0d4b3a",
  secondary: "#d9b66d",
  accent: "#1f7a5f",
  bg: "#f5f7f2",
  panel: "#ffffff",
  text: "#1c2d28",
};

const themePresets: Record<ThemeKey, ThemeConfig> = {
  emerald: defaultTheme,
  royal: { primary: "#1d3563", secondary: "#d4ba8a", accent: "#3f6bb3", bg: "#eef3f9", panel: "#ffffff", text: "#1a2738" },
  sunset: { primary: "#5d2a29", secondary: "#e5b46a", accent: "#a85f45", bg: "#fff7f1", panel: "#fffdfb", text: "#2a1d1c" },
};

const NAV_GROUPS: NavGroup[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, items: [{ id: "dashboard", label: "Dashboard" }, { id: "notices", label: "Notices" }] },
  { id: "academic", label: "Academic", icon: BookOpen, items: [{ id: "students", label: "Students" }, { id: "admissions", label: "Admissions" }, { id: "classes", label: "Classes" }, { id: "subjects", label: "Subjects" }, { id: "routine", label: "Routine" }, { id: "idcards", label: "ID Cards" }] },
  { id: "hr", label: "HR & Payroll", icon: UsersRound, items: [{ id: "staff", label: "Staff" }, { id: "payroll", label: "Payroll" }] },
  { id: "accounting", label: "Accounting", icon: CircleDollarSign, items: [{ id: "fees", label: "Fees" }, { id: "donations", label: "Donations" }] },
  { id: "reports", label: "Reports", icon: FileText, items: [{ id: "reports", label: "Reports" }] },
  { id: "admin", label: "Administration", icon: UserRoundCog, items: [{ id: "users", label: "Users" }, { id: "settings", label: "Settings" }, { id: "backup", label: "Backup" }] },
];

const initialParents: ParentRecord[] = [
  { id: "P-001", name: "Rahman Ali", phone: "01712345678", relation: "Father" },
  { id: "P-002", name: "Nusrat Begum", phone: "01823456789", relation: "Mother" },
  { id: "P-003", name: "Kamal Hossain", phone: "01934567890", relation: "Guardian" },
  { id: "P-004", name: "Sultana Akter", phone: "01645678901", relation: "Mother" },
];

const initialStudents: Student[] = [
  { id: "THM-2025-001", name: "Ayesha Rahman", className: "Play", section: "A", gender: "Female", roll: 1, status: "Active", fee: 2500, due: 0, phone: "01710000001", parentId: "P-001", photo: "AR", dateJoined: "2024-01-12" },
  { id: "THM-2025-002", name: "Imran Hossain", className: "Nursery", section: "A", gender: "Male", roll: 4, status: "Active", fee: 3000, due: 1200, phone: "01710000002", parentId: "P-002", photo: "IH", dateJoined: "2024-02-18" },
  { id: "THM-2025-003", name: "Mariam Sultana", className: "One", section: "B", gender: "Female", roll: 2, status: "Active", fee: 3500, due: 0, phone: "01710000003", parentId: "P-003", dateJoined: "2024-03-06", photo: "MS" },
  { id: "THM-2025-004", name: "Rafiul Karim", className: "Two", section: "A", gender: "Male", roll: 1, status: "Inactive", fee: 4000, due: 0, phone: "01710000004", parentId: "P-004", photo: "RK", dateJoined: "2023-11-21" },
  { id: "THM-2025-005", name: "Sadia Akter", className: "Three", section: "A", gender: "Female", roll: 3, status: "Active", fee: 4500, due: 1600, phone: "01710000005", parentId: "P-002", photo: "SA", dateJoined: "2023-10-09" },
];

const initialDonations: Donation[] = [
  { id: "D-1001", donor: "Habibur Rahman", fund: "General", amount: 15000, date: "2025-11-01", method: "bKash" },
  { id: "D-1002", donor: "Amina Sultana", fund: "Zakat", amount: 22000, date: "2025-11-02", method: "Bank" },
  { id: "D-1003", donor: "Tafsir Foundation", fund: "Sadaqah", amount: 18000, date: "2025-11-04", method: "Cash" },
];

const initialInvoices: Invoice[] = [
  { id: "INV-2025-001", studentId: "THM-2025-001", month: "2025-11", due: 2500, paid: 2500, status: "Paid" },
  { id: "INV-2025-002", studentId: "THM-2025-002", month: "2025-11", due: 3000, paid: 1800, status: "Partial" },
  { id: "INV-2025-003", studentId: "THM-2025-003", month: "2025-11", due: 3500, paid: 0, status: "Due" },
  { id: "INV-2025-004", studentId: "THM-2025-005", month: "2025-11", due: 4500, paid: 0, status: "Due" },
];

const initialNotices: Notice[] = [
  { id: "N-01", title: "Term exam routine published", type: "Academic", date: "2025-11-06" },
  { id: "N-02", title: "Fee submission deadline", type: "Fee", date: "2025-11-08" },
  { id: "N-03", title: "Winter vacation notice", type: "General", date: "2025-11-10" },
];

const initialUsers: UserAccount[] = [
  { id: "U-0001", name: "Tanvir Ahmed", role: "Super Admin", status: "Active", lastLogin: "2025-11-6 08:03" },
  { id: "U-0002", name: "Sabiha Hasan", role: "Accountant", status: "Active", lastLogin: "2025-11-5 17:12" },
  { id: "U-0003", name: "Rahima Khatun", role: "Teacher", status: "Pending", lastLogin: "2025-11-4 12:21" },
];

const templateOptions: TemplateOption[] = [
  { id: "classic", name: "Classic", accent: "#0b4b3a" },
  { id: "modern", name: "Modern", accent: "#2d765d" },
  { id: "minimal", name: "Minimal", accent: "#5f6b3b" },
  { id: "royal", name: "Royal", accent: "#6d4a2d" },
];

const classFeeMap: Record<string, number> = { Play: 2500, Nursery: 3000, One: 3500, Two: 4000, Three: 4500 };

function loadStored<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatBDT(value: number): string {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value);
}

function safeDate(date: string): string {
  return date ? new Intl.DateTimeFormat("en-BD", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date)) : "—";
}

function nextStudentId(): string {
  const year = new Date().getFullYear();
  const existing = loadStored<Student[]>("madrasa_students", initialStudents);
  const count = existing.filter((student) => student.id.startsWith(`THM-${year}-`)).length + 1;
  return `THM-${year}-${String(count).padStart(3, "0")}`;
}

function App() {
  const [theme, setTheme] = useState<ThemeConfig>(() => ({ ...loadStored<ThemeConfig>("madrasa_theme", defaultTheme) }));
  const [activeView, setActiveView] = useState<ViewName>("dashboard");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ overview: true, academic: true, hr: true, accounting: true, reports: true, admin: true });
  const [students, setStudents] = useState<Student[]>(() => loadStored<Student[]>("madrasa_students", initialStudents));
  const [parents, setParents] = useState<ParentRecord[]>(() => loadStored<ParentRecord[]>("madrasa_parents", initialParents));
  const [staff] = useState<Staff[]>(() => loadStored<Staff[]>("madrasa_staff", []));
  const [donations, setDonations] = useState<Donation[]>(() => loadStored<Donation[]>("madrasa_donations", initialDonations));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadStored<Invoice[]>("madrasa_invoices", initialInvoices));
  const [notices, setNotices] = useState<Notice[]>(() => loadStored<Notice[]>("madrasa_notices", initialNotices));
  const [users, setUsers] = useState<UserAccount[]>(() => loadStored<UserAccount[]>("madrasa_users", initialUsers));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudents[0].id);
  const [template, setTemplate] = useState<string>("classic");
  const [customTemplateUrl, setCustomTemplateUrl] = useState<string>("");
  const [selectedIdCards, setSelectedIdCards] = useState<string[]>([initialStudents[0].id]);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentForm, setStudentForm] = useState<StudentFormState>({
    id: "",
    name: "",
    className: "Play",
    section: "A",
    gender: "Male",
    roll: 1,
    fee: classFeeMap.Play,
    due: 0,
    phone: "",
    parentId: parents[0]?.id ?? "",
    status: "Active",
    photo: "",
  });
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [printDoc, setPrintDoc] = useState<null | "receipt" | "report" | "invoice">(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty("--secondary", theme.secondary);
    document.documentElement.style.setProperty("--accent", theme.accent);
    document.documentElement.style.setProperty("--bg", theme.bg);
    document.documentElement.style.setProperty("--panel", theme.panel);
    document.documentElement.style.setProperty("--text", theme.text);
    localStorage.setItem("madrasa_theme", JSON.stringify(theme));
  }, [theme]);

  useEffect(() => { localStorage.setItem("madrasa_students", JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem("madrasa_parents", JSON.stringify(parents)); }, [parents]);
  useEffect(() => { localStorage.setItem("madrasa_donations", JSON.stringify(donations)); }, [donations]);
  useEffect(() => { localStorage.setItem("madrasa_invoices", JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem("madrasa_notices", JSON.stringify(notices)); }, [notices]);
  useEffect(() => { localStorage.setItem("madrasa_users", JSON.stringify(users)); }, [users]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      if (!query) return true;
      const matchesText = [student.name, student.id, student.phone, student.className, student.section].join(" ").toLowerCase();
      return matchesText.includes(query);
    });
  }, [students, searchQuery]);

  const student = students.find((entry) => entry.id === selectedStudentId) ?? students[0];

  const stats = {
    totalStudents: students.length,
    active: students.filter((student) => student.status === "Active").length,
    due: students.reduce((sum, student) => sum + student.due, 0),
    donors: donations.length,
    staffCount: staff.length,
  };

  const toggleGroup = (groupId: string) => setExpandedGroups((current) => ({ ...current, [groupId]: !current[groupId] }));

  const openStudentForm = (studentItem?: Student) => {
    if (studentItem) {
      setStudentForm({
        id: studentItem.id,
        name: studentItem.name,
        className: studentItem.className,
        section: studentItem.section,
        gender: studentItem.gender,
        roll: studentItem.roll,
        fee: studentItem.fee,
        due: studentItem.due,
        phone: studentItem.phone,
        parentId: studentItem.parentId,
        status: studentItem.status,
        photo: studentItem.photo,
      });
    } else {
      setStudentForm({
        id: nextStudentId(),
        name: "",
        className: "Play",
        section: "A",
        gender: "Male",
        roll: 1,
        fee: classFeeMap.Play,
        due: 0,
        phone: "",
        parentId: parents[0]?.id ?? "",
        status: "Active",
        photo: "",
      });
    }
    setShowStudentModal(true);
  };

  const saveStudent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentForm.name.trim() || !studentForm.phone.trim()) {
      window.alert("Name and phone are required.");
      return;
    }

    const nextFee = classFeeMap[studentForm.className] ?? studentForm.fee;
    const payload: Student = {
      id: studentForm.id || nextStudentId(),
      name: studentForm.name.trim(),
      className: studentForm.className,
      section: studentForm.section,
      gender: studentForm.gender,
      roll: studentForm.roll,
      fee: nextFee,
      due: studentForm.due,
      phone: studentForm.phone.trim(),
      parentId: studentForm.parentId,
      status: studentForm.status,
      photo: studentForm.photo || studentForm.name.trim().split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
      dateJoined: new Date().toISOString().slice(0, 10),
    };

    setStudents((current) => {
      const exists = current.some((item) => item.id === payload.id);
      if (exists) {
        return current.map((item) => (item.id === payload.id ? payload : item));
      }
      return [payload, ...current];
    });
    setSelectedStudentId(payload.id);
    setShowStudentModal(false);
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        students?: Student[];
        parents?: ParentRecord[];
        donations?: Donation[];
        invoices?: Invoice[];
        notices?: Notice[];
        users?: UserAccount[];
        theme?: ThemeConfig;
      };
      if (data.students) setStudents(data.students);
      if (data.parents) setParents(data.parents);
      if (data.donations) setDonations(data.donations);
      if (data.invoices) setInvoices(data.invoices);
      if (data.notices) setNotices(data.notices);
      if (data.users) setUsers(data.users);
      if (data.theme) setTheme({ ...defaultTheme, ...data.theme });
      alert("Backup restored successfully.");
    } catch {
      alert("The selected file is not a valid backup.");
    } finally {
      event.target.value = "";
    }
  };

  const exportBackup = () => {
    const payload = {
      students,
      parents,
      donations,
      invoices,
      notices,
      users,
      theme,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tanzeemul-huda-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleThemeChange = (key: keyof ThemeConfig, value: string) => setTheme((current) => ({ ...current, [key]: value }));

  const printMode = (kind: "receipt" | "report" | "invoice") => {
    setPrintDoc(kind);
    setTimeout(() => window.print(), 120);
  };

  const applyTemplate = (selected: string) => {
    setTemplate(selected);
    const chosen = templateOptions.find((option) => option.id === selected);
    if (chosen) setTheme((current) => ({ ...current, accent: chosen.accent }));
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomTemplateUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleIdCard = (studentId: string) => {
    setSelectedIdCards((current) => current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]);
  };

  const batchPrintIdCards = () => {
    if (!selectedIdCards.length) {
      alert("Select at least one student for the ID card batch print.");
      return;
    }
    setPrintDoc("report");
    setTimeout(() => window.print(), 120);
  };

  const isActive = (view: ViewName) => activeView === view;

  return (
    <div className="app-shell" data-print-hidden="true">
      <button className="mobile-backdrop" style={{ display: mobileMenuOpen ? "block" : "none" }} onClick={() => setMobileMenuOpen(false)} />
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-wrap">
          <div className="brand-mark">ت</div>
          <div>
            <strong>Tanzeemul Huda</strong>
            <span>Pre Hifz & Noorani Academy</span>
          </div>
          <button className="icon-button mobile-close" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="nav-group">
            <button className="nav-group-header" onClick={() => toggleGroup(group.id)}>
              <span className="nav-group-title"><group.icon size={15} />{group.label}</span>
              <ChevronDown size={14} className={expandedGroups[group.id] ? "rotated" : ""} />
            </button>
            <div className={`nav-group-items ${expandedGroups[group.id] ? "expanded" : "collapsed"}`}>
              {group.items.map((item) => (
                <button key={item.id} className={`nav-item ${isActive(item.id) ? "active" : ""}`} onClick={() => { setActiveView(item.id); setMobileMenuOpen(false); }}>
                  <span>{item.label}</span>
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="mini-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Priority notices</strong>
              <span>3 pending approval items</span>
            </div>
          </div>
          <div className="sidebar-user-row">
            <div className="avatar">TA</div>
            <div>
              <strong>Tanvir Ahmed</strong>
              <span>Super Admin</span>
            </div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="header-left">
            <button className="menu-button" onClick={() => setMobileMenuOpen(true)}><Menu size={18} /></button>
            <div className="crumbs">
              <span className="crumb-muted">Home</span>
              <span>/</span>
              <strong>{NAV_GROUPS.flatMap((group) => group.items).find((item) => item.id === activeView)?.label ?? "Dashboard"}</strong>
            </div>
          </div>

          <div className="header-controls">
            <label className="global-search">
              <Search size={16} />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search students, staff, pages" />
            </label>
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>
            <div className="user-pill">
              <div className="avatar">TA</div>
              <div>
                <strong>Tanvir Ahmed</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {activeView === "dashboard" && (
            <DashboardScreen stats={stats} students={filteredStudents} donations={donations.slice(0, 3)} notices={notices.slice(0, 2)} printAction={printMode} />
          )}

          {activeView === "students" && (
            <StudentsScreen
              students={filteredStudents}
              parents={parents}
              onOpenStudent={openStudentForm}
              onSelect={setSelectedStudentId}
              selectedStudentId={selectedStudentId}
              exportCsv={() => {}}
            />
          )}

          {activeView === "users" && <UsersScreen users={users} />}
          {activeView === "reports" && <ReportsScreen students={students} donations={donations} printAction={printMode} />}
          {activeView === "fees" && <FeesScreen students={students} invoices={invoices} printAction={printMode} />}
          {activeView === "donations" && <DonationsScreen donations={donations} />}
          {activeView === "idcards" && (
            <IDCardDesignerScreen
              students={students}
              selectedIdCards={selectedIdCards}
              toggleIdCard={toggleIdCard}
              template={template}
              setTemplate={applyTemplate}
              customTemplateUrl={customTemplateUrl}
              onUpload={handleFileUpload}
              batchPrint={batchPrintIdCards}
            />
          )}

          {activeView === "settings" && (
            <SettingsScreen theme={theme} onThemeChange={handleThemeChange} onPresetSelect={(preset) => setTheme(themePresets[preset])} onExport={exportBackup} onRestoreInputClick={() => inputRef.current?.click()} />
          )}

          {activeView === "backup" && <BackupScreen exportBackup={exportBackup} restoreBackup={restoreBackup} inputRef={inputRef} />}

          {activeView !== "dashboard" && activeView !== "students" && activeView !== "users" && activeView !== "reports" && activeView !== "fees" && activeView !== "donations" && activeView !== "settings" && activeView !== "backup" && activeView !== "idcards" && activeView !== "notices" && (
            <PlaceholderScreen title={NAV_GROUPS.flatMap((group) => group.items).find((item) => item.id === activeView)?.label ?? "Module"} />
          )}
        </div>
      </main>

      {showStudentModal && (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && setShowStudentModal(false)}>
          <div className="modal-window">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Student record</span>
                <h3>{studentForm.id ? "Edit student" : "New student"}</h3>
              </div>
              <button className="icon-button" onClick={() => setShowStudentModal(false)}><X size={18} /></button>
            </div>

            <form className="student-form" onSubmit={saveStudent}>
              <div className="form-grid two-col">
                <label className="field"><span>ID</span><input value={studentForm.id} onChange={(event) => setStudentForm((current) => ({ ...current, id: event.target.value }))} readOnly /></label>
                <label className="field"><span>Student name</span><input value={studentForm.name} onChange={(event) => setStudentForm((current) => ({ ...current, name: event.target.value }))} placeholder="Student name" required /></label>
                <label className="field"><span>Class</span><select value={studentForm.className} onChange={(event) => setStudentForm((current) => ({ ...current, className: event.target.value, fee: classFeeMap[event.target.value] ?? current.fee }))}><option>Play</option><option>Nursery</option><option>One</option><option>Two</option><option>Three</option></select></label>
                <label className="field"><span>Section</span><select value={studentForm.section} onChange={(event) => setStudentForm((current) => ({ ...current, section: event.target.value }))}><option>A</option><option>B</option><option>C</option></select></label>
                <label className="field"><span>Gender</span><select value={studentForm.gender} onChange={(event) => setStudentForm((current) => ({ ...current, gender: event.target.value as Student["gender"] }))}><option>Male</option><option>Female</option></select></label>
                <label className="field"><span>Roll</span><input type="number" value={studentForm.roll} onChange={(event) => setStudentForm((current) => ({ ...current, roll: Number(event.target.value) }))} /></label>
                <label className="field"><span>Phone</span><input value={studentForm.phone} onChange={(event) => setStudentForm((current) => ({ ...current, phone: event.target.value }))} placeholder="01XXXXXXXXX" required /></label>
                <label className="field"><span>Status</span><select value={studentForm.status} onChange={(event) => setStudentForm((current) => ({ ...current, status: event.target.value as Student["status"] }))}><option>Active</option><option>Inactive</option><option>Graduated</option></select></label>
                <label className="field"><span>Parent account</span><select value={studentForm.parentId} onChange={(event) => setStudentForm((current) => ({ ...current, parentId: event.target.value }))}>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name} ({parent.relation})</option>)}</select></label>
                <label className="field"><span>Monthly fee</span><input type="number" value={studentForm.fee} onChange={(event) => setStudentForm((current) => ({ ...current, fee: Number(event.target.value) }))} /></label>
                <label className="field"><span>Due</span><input type="number" value={studentForm.due} onChange={(event) => setStudentForm((current) => ({ ...current, due: Number(event.target.value) }))} /></label>
              </div>
              <div className="form-actions-row">
                <button type="button" className="button secondary" onClick={() => setShowStudentModal(false)}>Cancel</button>
                <button type="submit" className="button primary">Save student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printDoc && (
        <div className="print-document-overlay">
          <div className="print-document-layer">
            {printDoc === "receipt" && <PrintableReceipt student={student} />}
            {printDoc === "invoice" && <PrintableInvoice invoice={invoices[0]} student={student} />}
            {printDoc === "report" && <PrintableReport students={students} donations={donations} />}
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept="application/json" className="hidden-input" onChange={restoreBackup} />
    </div>
  );
}

function DashboardScreen({ stats, students, donations, notices, printAction }: {
  stats: { totalStudents: number; active: number; due: number; donors: number; staffCount: number; };
  students: Student[];
  donations: Donation[];
  notices: Notice[];
  printAction: (kind: "receipt" | "report" | "invoice") => void;
}) {
  return (
    <>
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Institute overview</span>
          <h1>Tanzeemul Huda</h1>
          <p>Pre Hifz and Noori Madrasa management dashboard.</p>
        </div>
        <div className="hero-meta">
          <span>11 Nov 2025</span>
          <span>Alhamdulillah</span>
        </div>
      </section>

      <div className="stat-grid-metric">
        <MetricCard icon={<UsersRound size={18} />} label="Total students" value={String(stats.totalStudents)} tone="green" />
        <MetricCard icon={<Check size={18} />} label="Active students" value={String(stats.active)} tone="mint" />
        <MetricCard icon={<Wallet size={18} />} label="Fee due" value={formatBDT(stats.due)} tone="gold" />
        <MetricCard icon={<HandCoins size={18} />} label="Donors" value={String(stats.donors)} tone="blue" />
        <MetricCard icon={<ShieldCheck size={18} />} label="Staff" value={String(stats.staffCount)} tone="blue" />
      </div>

      <div className="content-grid">
        <div className="panel-block">
          <div className="section-head">
            <div>
              <h3>Recent student status</h3>
              <span>Performance snapshot</span>
            </div>
            <button className="button secondary" onClick={() => printAction("report")}>Print report</button>
          </div>
          <div className="bar-chart">
            {[60, 75, 58, 92, 76, 88].map((value, index) => (
              <div key={index} className="bar-stack" title={`${value}%`}>
                <div className="bar-fill" style={{ height: `${value}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel-block">
          <div className="section-head">
            <div>
              <h3>Recent donations</h3>
              <span>Latest fund activity</span>
            </div>
          </div>
          <ul className="list-simple">
            {donations.map((donation) => (
              <li key={donation.id}>
                <div>
                  <strong>{donation.donor}</strong>
                  <small>{donation.fund}</small>
                </div>
                <span>{formatBDT(donation.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="content-grid two-cols">
        <div className="panel-block">
          <div className="section-head">
            <div>
              <h3>Students</h3>
              <span>Latest learners</span>
            </div>
          </div>
          <ul className="student-list">
            {students.slice(0, 5).map((student) => (
              <li key={student.id}>
                <div className="avatar small">{student.photo}</div>
                <div>
                  <strong>{student.name}</strong>
                  <small>{student.className} · {student.section}</small>
                </div>
                <span className={`status-pill ${student.status === "Active" ? "success" : student.status === "Inactive" ? "warning" : "neutral"}`}>{student.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel-block">
          <div className="section-head">
            <div>
              <h3>Notice board</h3>
              <span>Heads-up and updates</span>
            </div>
          </div>
          <ul className="notice-list">
            {notices.map((notice) => (
              <li key={notice.id}>
                <span className="notice-tag">{notice.type}</span>
                <div>
                  <strong>{notice.title}</strong>
                  <small>{safeDate(notice.date)}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function StudentsScreen({ students, parents, onOpenStudent, onSelect, selectedStudentId, exportCsv }: { students: Student[]; parents: ParentRecord[]; onOpenStudent: (item?: Student) => void; onSelect: (id: string) => void; selectedStudentId: string; exportCsv: () => void; }) {
  return (
    <>
      <div className="page-header-row">
        <div>
          <span className="eyebrow">Academic management</span>
          <h2>Students</h2>
        </div>
        <div className="header-actions">
          <button className="button secondary" onClick={() => onOpenStudent()}>Add student</button>
          <button className="button primary" onClick={() => exportCsv()}>Export CSV</button>
        </div>
      </div>

      <div className="panel-block">
        <div className="filters-row">
          <label className="field search-field"><Search size={15} /><input placeholder="Search name, ID or phone" /></label>
          <select className="field-select"><option>All classes</option><option>Play</option><option>Nursery</option><option>One</option><option>Two</option><option>Three</option></select>
          <select className="field-select"><option>Active</option><option>Inactive</option></select>
          <button className="button secondary">Reset</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Class</th>
              <th>Section</th>
              <th>Parent</th>
              <th>Fee due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className={student.id === selectedStudentId ? "selected-row" : ""} onClick={() => onSelect(student.id)}>
                <td>
                  <div className="person-chip"><div className="avatar small">{student.photo}</div><div><strong>{student.name}</strong><small>{student.phone}</small></div></div>
                </td>
                <td>{student.id}</td>
                <td>{student.className}</td>
                <td>{student.section}</td>
                <td>{parents.find((parent) => parent.id === student.parentId)?.name ?? "—"}</td>
                <td>{formatBDT(student.due)}</td>
                <td><span className={`status-pill ${student.status === "Active" ? "success" : student.status === "Inactive" ? "warning" : "neutral"}`}>{student.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UsersScreen({ users }: { users: UserAccount[] }) {
  return (
    <>
      <div className="page-header-row">
        <div>
          <span className="eyebrow">Administration</span>
          <h2>User management</h2>
        </div>
      </div>
      <div className="panel-block">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><div className="person-chip"><div className="avatar small">{user.name.split(" ").map((part) => part[0]).slice(0,2).join("").toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.id}</small></div></div></td>
                <td><span className="tag soft">{user.role}</span></td>
                <td><span className={`status-pill ${user.status === "Active" ? "success" : "warning"}`}>{user.status}</span></td>
                <td>{user.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="role-grid panel-block">
        <div className="section-head"><div><h3>Role permissions</h3><span>View / Create / Edit / Delete</span></div></div>
        <div className="permission-table">
          {['Dashboard','Students','Fees','Donations','Reports','Settings'].map((module) => (
            <div key={module} className="permission-row">
              <span>{module}</span>
              <label><input type="checkbox" defaultChecked /> <small>View</small></label>
              <label><input type="checkbox" defaultChecked /> <small>Create</small></label>
              <label><input type="checkbox" defaultChecked /> <small>Edit</small></label>
              <label><input type="checkbox" /> <small>Delete</small></label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ReportsScreen({ students, donations, printAction }: { students: Student[]; donations: Donation[]; printAction: (kind: "receipt" | "report" | "invoice") => void }) {
  const feeDueTotal = students.reduce((sum, student) => sum + student.due, 0);
  return (
    <>
      <div className="page-header-row">
        <div>
          <span className="eyebrow">Reports</span>
          <h2>Academic and financial summary</h2>
        </div>
        <button className="button primary" onClick={() => printAction("report")}>Print report</button>
      </div>

      <div className="stat-grid-metric narrow">
        <MetricCard icon={<UsersRound size={18} />} label="Students" value={String(students.length)} tone="green" />
        <MetricCard icon={<Wallet size={18} />} label="Receivables" value={formatBDT(feeDueTotal)} tone="gold" />
        <MetricCard icon={<HandCoins size={18} />} label="Donations" value={formatBDT(donations.reduce((sum, item) => sum + item.amount, 0))} tone="blue" />
        <MetricCard icon={<FileText size={18} />} label="Classrooms" value="06" tone="mint" />
      </div>

      <div className="panel-block report-panel">
        <div className="report-header">
          <div>
            <strong>تَنْزِيمُ الحُدَا</strong>
            <span>প্রিহিফজ ও নূরানী একাডেমী</span>
            <small>18 Main Road, Chawkbazar, Chattogram</small>
          </div>
          <div className="report-meta">
            <span>Period: Nov 2025</span>
            <span>Prepared on: 11 Nov 2025</span>
          </div>
        </div>
        <table className="data-table mini-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Students</th>
              <th>Fees collected</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {['Play','Nursery','One','Two','Three'].map((className) => {
              const list = students.filter((student) => student.className === className);
              const due = list.reduce((sum, student) => sum + student.due, 0);
              return <tr key={className}><td>{className}</td><td>{list.length}</td><td>{formatBDT(list.reduce((sum, student) => sum + (student.fee - student.due), 0))}</td><td>{formatBDT(due)}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FeesScreen({ students, invoices, printAction }: { students: Student[]; invoices: Invoice[]; printAction: (kind: "receipt" | "report" | "invoice") => void }) {
  return (
    <>
      <div className="page-header-row">
        <div>
          <span className="eyebrow">Accounting</span>
          <h2>Fee collection and invoices</h2>
        </div>
        <button className="button primary" onClick={() => printAction("invoice")}>Print invoice</button>
      </div>

      <div className="panel-block">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Month</th>
              <th>Due</th>
              <th>Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const student = students.find((entry) => entry.id === invoice.studentId);
              return <tr key={invoice.id}><td>{student?.name ?? invoice.studentId}</td><td>{invoice.month}</td><td>{formatBDT(invoice.due)}</td><td>{formatBDT(invoice.paid)}</td><td><span className={`status-pill ${invoice.status === "Paid" ? "success" : invoice.status === "Partial" ? "warning" : "neutral"}`}>{invoice.status}</span></td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DonationsScreen({ donations }: { donations: Donation[] }) {
  return (
    <>
      <div className="page-header-row">
        <div>
          <span className="eyebrow">Accounting</span>
          <h2>Donations and funds</h2>
        </div>
      </div>
      <div className="panel-block">
        <table className="data-table">
          <thead>
            <tr>
              <th>Donor</th>
              <th>Fund</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr key={donation.id}>
                <td>{donation.donor}</td>
                <td><span className="tag soft">{donation.fund}</span></td>
                <td>{formatBDT(donation.amount)}</td>
                <td>{donation.method}</td>
                <td>{safeDate(donation.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function IDCardDesignerScreen({ students, selectedIdCards, toggleIdCard, template, setTemplate, customTemplateUrl, onUpload, batchPrint }: {
  students: Student[];
  selectedIdCards: string[];
  toggleIdCard: (id: string) => void;
  template: string;
  setTemplate: (selected: string) => void;
  customTemplateUrl: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  batchPrint: () => void;
}) {
  return (
    <>
      <div className="page-header-row">
        <div>
          <span className="eyebrow">Academic records</span>
          <h2>ID card designer</h2>
        </div>
        <div className="header-actions">
          <button className="button secondary" onClick={batchPrint}>Bulk save & print</button>
        </div>
      </div>

      <div className="idcard-layout">
        <div className="panel-block form-panel">
          <div className="section-head">
            <div>
              <h3>Card styles</h3>
              <span>Choose a preset or upload your own</span>
            </div>
          </div>
          <div className="template-row">
            {templateOptions.map((option) => (
              <button key={option.id} className={`template-option ${template === option.id ? "active" : ""}`} onClick={() => setTemplate(option.id)}>
                <span className="template-swatch" style={{ background: option.accent }} />
                {option.name}
              </button>
            ))}
          </div>
          <div className="upload-box">
            <Upload size={18} />
            <label className="upload-cell">
              <span>Upload custom design</span>
              <input type="file" accept="image/*" onChange={onUpload} />
            </label>
          </div>
          {customTemplateUrl && <img src={customTemplateUrl} alt="Custom card template preview" className="uploaded-template" />}

          <div className="students-select-list">
            {students.map((student) => (
              <label key={student.id} className="check-option">
                <input type="checkbox" checked={selectedIdCards.includes(student.id)} onChange={() => toggleIdCard(student.id)} />
                <span>{student.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="panel-block preview-panel">
          <div className="id-card-preview">
            <div className="card-shell">
              <div className="card-header">
                <div className="card-brand">
                  <div className="arabic-calligraphy">تَنْزِيمُ الحُدَا</div>
                  <strong>Tanzeemul Huda</strong>
                  <small>Pre Hifz & Noorani Academy</small>
                </div>
              </div>
              <div className="card-identity">
                <div className="avatar large">{students[0]?.photo ?? "TH"}</div>
                <div>
                  <h4>{students[0]?.name ?? "Student"}</h4>
                  <p>Class: {students[0]?.className ?? "One"}</p>
                  <p>ID: {students[0]?.id ?? "THM-2025-001"}</p>
                </div>
              </div>
              <div className="card-details">
                <span>Blood Group: O+</span>
                <span>Valid: 2025-2026</span>
                <span>Guardian: Rahman Ali</span>
              </div>
              <div className="qr-box" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsScreen({ theme, onThemeChange, onPresetSelect, onExport, onRestoreInputClick }: {
  theme: ThemeConfig;
  onThemeChange: (key: keyof ThemeConfig, value: string) => void;
  onPresetSelect: (preset: "emerald" | "royal" | "sunset") => void;
  onExport: () => void;
  onRestoreInputClick: () => void;
}) {
  return (
    <>
      <div className="page-header-row">
        <div>
          <span className="eyebrow">Administration</span>
          <h2>Theme and system settings</h2>
        </div>
      </div>

      <div className="settings-grid">
        <div className="panel-block">
          <div className="section-head"><div><h3>Colour palette</h3><span>Editable theme</span></div></div>
          <div className="color-picker-grid">
            {Object.entries(theme).map(([key, value]) => (
              <label key={key} className="color-field">
                <span>{key}</span>
                <div className="color-input-wrap">
                  <input type="color" value={value} onChange={(event) => onThemeChange(key as keyof ThemeConfig, event.target.value)} />
                  <strong>{value}</strong>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="panel-block">
          <div className="section-head"><div><h3>Quick presets</h3><span>Brand looks</span></div></div>
          <div className="preset-list">
            {Object.entries(themePresets).map(([key, preset]) => (
              <button key={key} className="preset-button" onClick={() => onPresetSelect(key as "emerald" | "royal" | "sunset")}>
                <span className="swatch-group"><span style={{ background: preset.primary }} /><span style={{ background: preset.secondary }} /><span style={{ background: preset.accent }} /></span>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-block backup-box">
        <div className="section-head"><div><h3>Backup and restore</h3><span>Secure local system snapshot</span></div></div>
        <div className="backup-actions">
          <button className="button primary" onClick={onExport}><Download size={16} />Export backup</button>
          <button className="button secondary" onClick={onRestoreInputClick}><Upload size={16} />Restore backup</button>
        </div>
      </div>
    </>
  );
}

function BackupScreen({ exportBackup, restoreBackup, inputRef }: { exportBackup: () => void; restoreBackup: (event: ChangeEvent<HTMLInputElement>) => void; inputRef: React.RefObject<HTMLInputElement>; }) {
  return (
    <div className="panel-block backup-full">
      <div className="section-head">
        <div>
          <h3>Backup & restore</h3>
          <span>Keep a system snapshot for the madrasa office</span>
        </div>
      </div>
      <div className="backup-actions">
        <button className="button primary" onClick={exportBackup}><Download size={16} />Download backup</button>
        <button className="button secondary" onClick={() => inputRef.current?.click()}><Upload size={16} />Restore from file</button>
      </div>
      <input ref={inputRef} type="file" accept="application/json" className="hidden-input" onChange={restoreBackup} />
    </div>
  );
}

function PlaceholderScreen({ title }: { title: string }) {
  return <div className="panel-block empty-panel"><h3>{title}</h3><p>Advanced module features are included in the management dashboard suite.</p></div>;
}

function MetricCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: "green" | "mint" | "gold" | "blue" }) {
  return <div className={`metric-card ${tone}`}><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function PrintableReceipt({ student }: { student: Student | undefined }) {
  return (
    <div className="print-sheet receipt-block">
      <div className="office-header">
        <div>
          <div className="arabic-calligraphy">تَنْزِيمُ الحُدَا</div>
          <strong>Tanzeemul Huda</strong>
          <span>প্রিহিফজ ও নূরানী একাডেমী</span>
          <small>18 Main Road, Chawkbazar, Chattogram</small>
        </div>
      </div>
      <div className="receipt-title-row"><h3>Fee Receipt</h3><span>Receipt #F-2025-111</span></div>
      <div className="receipt-grid">
        <div><strong>Student</strong><span>{student?.name ?? "Student name"}</span></div>
        <div><strong>Class</strong><span>{student?.className ?? "One"}</span></div>
        <div><strong>Amount</strong><span>{formatBDT(student?.fee ?? 3500)}</span></div>
        <div><strong>Amount in words</strong><span>Three thousand five hundred taka only</span></div>
      </div>
      <div className="signature-row"><div><span>Receiver</span><strong>________________</strong></div><div><span>Authorized</span><strong>________________</strong></div></div>
    </div>
  );
}

function PrintableInvoice({ invoice, student }: { invoice: Invoice | undefined; student: Student | undefined }) {
  return (
    <div className="print-sheet invoice-block">
      <div className="office-header">
        <div>
          <div className="arabic-calligraphy">تَنْزِيمُ الحُدَا</div>
          <strong>Tanzeemul Huda</strong>
          <span>প্রিহিফজ ও নূরানী একাডেমী</span>
          <small>18 Main Road, Chawkbazar, Chattogram</small>
        </div>
      </div>
      <div className="receipt-title-row"><h3>Invoice</h3><span>{invoice?.id ?? "INV-2025-001"}</span></div>
      <div className="receipt-grid">
        <div><strong>Student</strong><span>{student?.name ?? "Student"}</span></div>
        <div><strong>Month</strong><span>{invoice?.month ?? "2025-11"}</span></div>
        <div><strong>Due</strong><span>{formatBDT(invoice?.due ?? 3500)}</span></div>
        <div><strong>Paid</strong><span>{formatBDT(invoice?.paid ?? 0)}</span></div>
      </div>
      <div className="signature-row"><div><span>Collector</span><strong>________________</strong></div><div><span>Finance</span><strong>________________</strong></div></div>
    </div>
  );
}

function PrintableReport({ students, donations }: { students: Student[]; donations: Donation[] }) {
  const totalDue = students.reduce((sum, student) => sum + student.due, 0);
  return (
    <div className="print-sheet report-block">
      <div className="office-header">
        <div>
          <div className="arabic-calligraphy">تَنْزِيمُ الحُدَا</div>
          <strong>Tanzeemul Huda</strong>
          <span>প্রিহিফজ ও নূরানী একাডেমী</span>
          <small>18 Main Road, Chawkbazar, Chattogram</small>
        </div>
      </div>
      <div className="receipt-title-row"><h3>Monthly Academic Report</h3><span>November 2025</span></div>
      <div className="report-summary-grid">
        <div><span>Total students</span><strong>{students.length}</strong></div>
        <div><span>Total fee due</span><strong>{formatBDT(totalDue)}</strong></div>
        <div><span>Donation</span><strong>{formatBDT(donations.reduce((sum, item) => sum + item.amount, 0))}</strong></div>
      </div>
      <table className="print-table">
        <thead><tr><th>Class</th><th>Students</th><th>Due</th></tr></thead>
        <tbody>
          {['Play','Nursery','One','Two','Three'].map((className) => {
            const list = students.filter((student) => student.className === className);
            return <tr key={className}><td>{className}</td><td>{list.length}</td><td>{formatBDT(list.reduce((sum, student) => sum + student.due, 0))}</td></tr>;
          })}
        </tbody>
      </table>
      <div className="signature-row"><div><span>Head Teacher</span><strong>________________</strong></div><div><span>Manager</span><strong>________________</strong></div></div>
    </div>
  );
}

export default App;
