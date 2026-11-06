import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Coins,
  CreditCard,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";

type AttendanceStatus = "Present" | "Absent" | "On Leave";
type AttendanceMap = Record<string, Record<string, AttendanceStatus>>;
type Staff = {
  id: string;
  name: string;
  title: string;
  department: string;
  joined: string;
  initials: string;
  color: string;
};
type ApprovedLeave = {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  reason: string;
};
type StaffLoan = {
  id: string;
  staffId: string;
  kind: "Advance" | "Staff loan";
  amount: number;
  repaid: number;
  issueDate: string;
  monthlyDeduction: number;
  note: string;
};
type InstituteLoan = {
  id: string;
  lender: string;
  purpose: string;
  principal: number;
  principalRepaid: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  interestPaid: number;
};
type Store = {
  attendance: AttendanceMap;
  approvedLeaves: ApprovedLeave[];
  staffLoans: StaffLoan[];
  instituteLoans: InstituteLoan[];
};
type ModalKind = "leave" | "staff-loan" | "staff-payment" | "institute-loan" | "institute-payment" | null;
type IconType = typeof UsersRound;

const STORAGE_KEY = "madrasa-hr-demo-v1";
const STAFF: Staff[] = [
  { id: "EMP-101", name: "Abdul Karim", title: "Senior Teacher", department: "Quran", joined: "2021-01-12", initials: "AK", color: "mint" },
  { id: "EMP-102", name: "Ayesha Rahman", title: "Arabic Teacher", department: "Academic", joined: "2022-03-08", initials: "AR", color: "rose" },
  { id: "EMP-103", name: "Mahmud Hasan", title: "Accountant", department: "Finance", joined: "2020-07-20", initials: "MH", color: "blue" },
  { id: "EMP-104", name: "Fatima Sultana", title: "Hifz Teacher", department: "Hifz", joined: "2023-02-01", initials: "FS", color: "lavender" },
  { id: "EMP-105", name: "Rafiq Uddin", title: "Office Assistant", department: "Administration", joined: "2024-06-15", initials: "RU", color: "amber" },
  { id: "EMP-106", name: "Nusrat Jahan", title: "Science Teacher", department: "Academic", joined: "2023-09-10", initials: "NJ", color: "teal" },
];

function localDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function seedStore(): Store {
  return {
    attendance: {},
    approvedLeaves: [],
    staffLoans: [
      { id: "SL-2401", staffId: "EMP-101", kind: "Advance", amount: 12000, repaid: 4000, issueDate: "2025-11-02", monthlyDeduction: 2000, note: "Salary advance" },
      { id: "SL-2402", staffId: "EMP-104", kind: "Staff loan", amount: 30000, repaid: 10000, issueDate: "2025-10-15", monthlyDeduction: 2500, note: "Personal loan" },
      { id: "SL-2403", staffId: "EMP-103", kind: "Advance", amount: 8000, repaid: 8000, issueDate: "2025-08-03", monthlyDeduction: 2000, note: "Completed" },
    ],
    instituteLoans: [
      { id: "IL-2025-01", lender: "Al Noor Cooperative", purpose: "Library & classroom expansion", principal: 1500000, principalRepaid: 250000, interestRate: 6, termMonths: 36, startDate: "2025-07-01", interestPaid: 18000 },
    ],
  };
}

function loadStore(): Store {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedStore();
  const saved = JSON.parse(raw) as Partial<Store>;
  const defaults = seedStore();
  return {
    attendance: saved.attendance ?? defaults.attendance,
    approvedLeaves: saved.approvedLeaves ?? defaults.approvedLeaves,
    staffLoans: saved.staffLoans ?? defaults.staffLoans,
    instituteLoans: saved.instituteLoans ?? defaults.instituteLoans,
  };
}

function money(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function getStatusForDate(store: Store, staffId: string, date: string, autoLeave: boolean): AttendanceStatus {
  if (autoLeave && store.approvedLeaves.some((leave) => leave.staffId === staffId && leave.startDate <= date && leave.endDate >= date)) {
    return "On Leave";
  }
  return store.attendance[date]?.[staffId] ?? "Present";
}

function initials(name: string): string {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [section, setSection] = useState<"attendance" | "staffLoans" | "instituteLoans">("attendance");
  const [attendanceDate, setAttendanceDate] = useState(localDate());
  const [autoLeave, setAutoLeave] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [selectedId, setSelectedId] = useState("");
  const [toast, setToast] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return STAFF.filter((person) =>
      !query || [person.name, person.id, person.title, person.department].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search]);

  const presentCount = STAFF.filter((person) => getStatusForDate(store, person.id, attendanceDate, autoLeave) === "Present").length;
  const absentCount = STAFF.filter((person) => getStatusForDate(store, person.id, attendanceDate, autoLeave) === "Absent").length;
  const leaveCount = STAFF.filter((person) => getStatusForDate(store, person.id, attendanceDate, autoLeave) === "On Leave").length;
  const activeStaffLoans = store.staffLoans.filter((loan) => loan.amount > loan.repaid);
  const totalStaffOutstanding = activeStaffLoans.reduce((sum, loan) => sum + loan.amount - loan.repaid, 0);
  const totalInstituteOutstanding = store.instituteLoans.reduce((sum, loan) => sum + loan.principal - loan.principalRepaid, 0);

  function markAttendance(staffId: string, status: "Present" | "Absent") {
    if (autoLeave && store.approvedLeaves.some((leave) => leave.staffId === staffId && leave.startDate <= attendanceDate && leave.endDate >= attendanceDate)) {
      setToast("Approved leave is active for this date. Turn off auto-mark to override it.");
      return;
    }
    setStore((current) => ({
      ...current,
      attendance: {
        ...current.attendance,
        [attendanceDate]: { ...current.attendance[attendanceDate], [staffId]: status },
      },
    }));
  }

  function openModal(kind: ModalKind, id = "") {
    setSelectedId(id);
    setModal(kind);
  }

  function closeModal() {
    setModal(null);
    setSelectedId("");
  }

  function saveLeave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const staffId = String(form.get("staffId"));
    const startDate = String(form.get("startDate"));
    const endDate = String(form.get("endDate"));
    if (endDate < startDate) {
      setToast("The end date must be on or after the start date.");
      return;
    }
    const overlaps = store.approvedLeaves.some((leave) => leave.staffId === staffId && startDate <= leave.endDate && endDate >= leave.startDate);
    if (overlaps) {
      setToast("An approved leave already overlaps those dates.");
      return;
    }
    const leave: ApprovedLeave = {
      id: `LV-${Date.now()}`,
      staffId,
      startDate,
      endDate,
      reason: String(form.get("reason")).trim(),
    };
    setStore((current) => ({ ...current, approvedLeaves: [...current.approvedLeaves, leave] }));
    setToast("Approved leave saved. Attendance will reflect it when auto-mark is enabled.");
    closeModal();
  }

  function saveStaffLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));
    const monthlyDeduction = Number(form.get("monthlyDeduction"));
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(monthlyDeduction) || monthlyDeduction < 0) {
      setToast("Enter a valid amount and monthly deduction.");
      return;
    }
    const loan: StaffLoan = {
      id: `SL-${Date.now()}`,
      staffId: String(form.get("staffId")),
      kind: String(form.get("kind")) as StaffLoan["kind"],
      amount,
      repaid: 0,
      issueDate: String(form.get("issueDate")),
      monthlyDeduction,
      note: String(form.get("note")).trim(),
    };
    setStore((current) => ({ ...current, staffLoans: [loan, ...current.staffLoans] }));
    setToast(`${loan.kind} recorded.`);
    closeModal();
  }

  function repayStaffLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loan = store.staffLoans.find((item) => item.id === selectedId);
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    if (!loan || !Number.isFinite(amount) || amount <= 0 || amount > loan.amount - loan.repaid) {
      setToast("Enter a repayment greater than zero and no more than the remaining balance.");
      return;
    }
    setStore((current) => ({
      ...current,
      staffLoans: current.staffLoans.map((item) => item.id === selectedId ? { ...item, repaid: item.repaid + amount } : item),
    }));
    setToast("Repayment recorded.");
    closeModal();
  }

  function saveInstituteLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const principal = Number(form.get("principal"));
    const interestRate = Number(form.get("interestRate"));
    const termMonths = Number(form.get("termMonths"));
    if (principal <= 0 || interestRate < 0 || termMonths <= 0) {
      setToast("Enter a positive principal and term, and a valid interest rate.");
      return;
    }
    const loan: InstituteLoan = {
      id: `IL-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      lender: String(form.get("lender")).trim(),
      purpose: String(form.get("purpose")).trim(),
      principal,
      principalRepaid: 0,
      interestRate,
      termMonths,
      startDate: String(form.get("startDate")),
      interestPaid: 0,
    };
    setStore((current) => ({ ...current, instituteLoans: [loan, ...current.instituteLoans] }));
    setToast("Institute investment loan added.");
    closeModal();
  }

  function repayInstituteLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loan = store.instituteLoans.find((item) => item.id === selectedId);
    const form = new FormData(event.currentTarget);
    const principal = Number(form.get("principal"));
    const interest = Number(form.get("interest"));
    if (!loan || !Number.isFinite(principal) || principal < 0 || principal > loan.principal - loan.principalRepaid || !Number.isFinite(interest) || interest < 0 || principal + interest <= 0) {
      setToast("Enter valid principal and interest payments within the outstanding balance.");
      return;
    }
    setStore((current) => ({
      ...current,
      instituteLoans: current.instituteLoans.map((item) =>
        item.id === selectedId ? { ...item, principalRepaid: item.principalRepaid + principal, interestPaid: item.interestPaid + interest } : item,
      ),
    }));
    setToast("Loan payment recorded.");
    closeModal();
  }

  const pageTitle = section === "attendance" ? "Staff attendance" : section === "staffLoans" ? "Staff advances & loans" : "Institute investment loans";

  return (
    <div className="app-shell">
      {mobileMenuOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><BookOpen size={22} strokeWidth={1.8} /></div>
          <div><strong>Darul Ilm</strong><span>Management system</span></div>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavButton icon={LayoutDashboard} label="Overview" onClick={() => { setSection("attendance"); setMobileMenuOpen(false); }} active={false} />
          <div className="nav-group-label">HR &amp; PAYROLL <ChevronDown size={14} /></div>
          <NavButton icon={UsersRound} label="Staff attendance" active={section === "attendance"} onClick={() => { setSection("attendance"); setMobileMenuOpen(false); }} />
          <NavButton icon={HandCoins} label="Advances & loans" active={section === "staffLoans"} onClick={() => { setSection("staffLoans"); setMobileMenuOpen(false); }} />
          <NavButton icon={Landmark} label="Institute loans" active={section === "instituteLoans"} onClick={() => { setSection("instituteLoans"); setMobileMenuOpen(false); }} />
          <div className="nav-caption nav-caption-spaced">ACADEMIC</div>
          <NavButton icon={BookOpen} label="Classes & subjects" onClick={() => setToast("Academic management is outside this HR prototype.")} active={false} />
          <NavButton icon={CalendarDays} label="Routine" onClick={() => setToast("Routine management is outside this HR prototype.")} active={false} />
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><ShieldCheck size={18} /></div><strong>Finance made clear</strong><p>Track staff balances and institute borrowing in one place.</p></div>
          <div className="sidebar-user">
            <div className="avatar avatar-green">TA</div>
            <div className="sidebar-user-copy"><strong>Tanvir Ahmed</strong><span>Super admin</span></div>
            <ChevronDown size={15} className="user-chevron" />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb">HR &amp; Payroll <span>/</span> <strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <label className="global-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff..." /></label>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="top-user"><div className="avatar avatar-green">TA</div><div><strong>Tanvir Ahmed</strong><span>Administrator</span></div><ChevronDown size={15} /></div>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow">HUMAN RESOURCES</div><h1>{pageTitle}</h1><p>Manage your people and keep every record in order.</p></div>
            <div className="heading-date"><CalendarDays size={16} /><span>{new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</span></div>
          </div>

          <section className="stat-grid" aria-label="HR summary">
            <StatCard label="Total staff" value={String(STAFF.length).padStart(2, "0")} note="Across all departments" icon={UsersRound} tone="green" />
            <StatCard label="Present on date" value={String(presentCount).padStart(2, "0")} note="Attendance recorded" icon={Check} tone="mint" />
            <StatCard label="Staff loan balance" value={money(totalStaffOutstanding)} note={`${activeStaffLoans.length} active staff records`} icon={Wallet} tone="gold" />
            <StatCard label="Institute loan balance" value={money(totalInstituteOutstanding)} note={`${store.instituteLoans.length} investment records`} icon={Landmark} tone="blue" />
          </section>

          {section === "attendance" && (
            <AttendancePage
              store={store}
              staff={filteredStaff}
              attendanceDate={attendanceDate}
              setAttendanceDate={setAttendanceDate}
              autoLeave={autoLeave}
              setAutoLeave={setAutoLeave}
              presentCount={presentCount}
              absentCount={absentCount}
              leaveCount={leaveCount}
              onMark={markAttendance}
              onAddLeave={() => openModal("leave")}
            />
          )}
          {section === "staffLoans" && (
            <StaffLoansPage
              store={store}
              staff={filteredStaff}
              loans={store.staffLoans}
              onAdd={() => openModal("staff-loan")}
              onRepay={(id) => openModal("staff-payment", id)}
            />
          )}
          {section === "instituteLoans" && (
            <InstituteLoansPage
              loans={store.instituteLoans}
              onAdd={() => openModal("institute-loan")}
              onRepay={(id) => openModal("institute-payment", id)}
            />
          )}

          <footer className="page-footer"><span>Darul Ilm Management</span><span>HR &amp; Payroll <b>·</b> Local demo data is saved in this browser</span></footer>
        </div>
      </main>

      {modal && (
        <Modal title={modalTitle(modal)} onClose={closeModal}>
          {modal === "leave" && <form className="form-grid" onSubmit={saveLeave}>
            <Field label="Staff member"><select name="staffId" required defaultValue=""><option value="" disabled>Select staff</option>{STAFF.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.id}</option>)}</select></Field>
            <div className="form-row"><Field label="From"><input type="date" name="startDate" required defaultValue={localDate()} /></Field><Field label="Until"><input type="date" name="endDate" required defaultValue={localDate()} /></Field></div>
            <Field label="Reason"><input name="reason" required placeholder="e.g. Medical leave" /></Field>
            <p className="form-hint full-span">This records an approved leave. Attendance will automatically show “On Leave” for these dates when auto-mark is on.</p>
            <FormActions onCancel={closeModal} submitLabel="Save approved leave" />
          </form>}
          {modal === "staff-loan" && <form className="form-grid" onSubmit={saveStaffLoan}>
            <Field label="Staff member"><select name="staffId" required defaultValue=""><option value="" disabled>Select staff</option>{STAFF.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.id}</option>)}</select></Field>
            <Field label="Record type"><select name="kind" defaultValue="Advance"><option>Advance</option><option>Staff loan</option></select></Field>
            <div className="form-row"><Field label="Amount (BDT)"><input type="number" name="amount" min="1" step="1" required placeholder="0" /></Field><Field label="Monthly deduction (BDT)"><input type="number" name="monthlyDeduction" min="0" step="1" required defaultValue="0" /></Field></div>
            <Field label="Issue date"><input type="date" name="issueDate" required defaultValue={localDate()} /></Field>
            <Field label="Note"><input name="note" placeholder="Optional details" /></Field>
            <p className="form-hint full-span">Monthly deduction is a reference for payroll; it does not automatically change payslips.</p>
            <FormActions onCancel={closeModal} submitLabel="Save record" />
          </form>}
          {modal === "staff-payment" && <RepaymentForm
            label="Repayment amount (BDT)"
            max={Math.max(0, (store.staffLoans.find((loan) => loan.id === selectedId)?.amount ?? 0) - (store.staffLoans.find((loan) => loan.id === selectedId)?.repaid ?? 0))}
            onCancel={closeModal}
            onSubmit={repayStaffLoan}
          />}
          {modal === "institute-loan" && <form className="form-grid" onSubmit={saveInstituteLoan}>
            <Field label="Lender"><input name="lender" required placeholder="Bank, fund or lender" /></Field>
            <Field label="Investment purpose"><input name="purpose" required placeholder="e.g. Campus expansion" /></Field>
            <div className="form-row"><Field label="Principal (BDT)"><input type="number" name="principal" min="1" step="1" required placeholder="0" /></Field><Field label="Annual interest (%)"><input type="number" name="interestRate" min="0" step="0.01" required defaultValue="0" /></Field></div>
            <div className="form-row"><Field label="Term (months)"><input type="number" name="termMonths" min="1" step="1" required placeholder="36" /></Field><Field label="Start date"><input type="date" name="startDate" required defaultValue={localDate()} /></Field></div>
            <p className="form-hint full-span">Track principal and interest payments separately. The displayed outstanding balance is principal only.</p>
            <FormActions onCancel={closeModal} submitLabel="Add institute loan" />
          </form>}
          {modal === "institute-payment" && <InstitutePaymentForm
            maxPrincipal={Math.max(0, (store.instituteLoans.find((loan) => loan.id === selectedId)?.principal ?? 0) - (store.instituteLoans.find((loan) => loan.id === selectedId)?.principalRepaid ?? 0))}
            onCancel={closeModal}
            onSubmit={repayInstituteLoan}
          />}
        </Modal>
      )}
      {toast && <div className="toast" role="status"><Check size={17} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={15} /></button></div>}
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: IconType; label: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? "nav-item-active" : ""}`} onClick={onClick}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{active && <span className="nav-active-mark" />}</button>;
}

function StatCard({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: IconType; tone: string }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19} strokeWidth={1.9} /></div><div className="stat-label">{label}</div><strong className="stat-value">{value}</strong><div className="stat-note">{note}</div></article>;
}

function AttendancePage({
  store,
  staff,
  attendanceDate,
  setAttendanceDate,
  autoLeave,
  setAutoLeave,
  presentCount,
  absentCount,
  leaveCount,
  onMark,
  onAddLeave,
}: {
  store: Store;
  staff: Staff[];
  attendanceDate: string;
  setAttendanceDate: (value: string) => void;
  autoLeave: boolean;
  setAutoLeave: (value: boolean) => void;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  onMark: (staffId: string, status: "Present" | "Absent") => void;
  onAddLeave: () => void;
}) {
  return <section className="panel">
    <div className="panel-heading">
      <div><h2>Daily register</h2><p>Mark attendance for each staff member.</p></div>
      <div className="panel-actions"><label className="date-picker"><CalendarDays size={16} /><input type="date" max={localDate()} value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} /></label><button className="button button-outline" onClick={onAddLeave}><Plus size={16} />Approved leave</button></div>
    </div>
    <div className="attendance-controls">
      <div className="attendance-date-label"><span className="date-dot" /><span>Showing register for <strong>{formatDate(attendanceDate)}</strong></span></div>
      <label className="toggle-control"><span><strong>Auto-mark approved leave</strong><small>Approved leave dates become “On Leave”</small></span><input type="checkbox" checked={autoLeave} onChange={(event) => setAutoLeave(event.target.checked)} /><span className="toggle-track" /></label>
    </div>
    <div className="attendance-summary">
      <span className="summary-present"><i />{presentCount} Present</span><span className="summary-absent"><i />{absentCount} Absent</span><span className="summary-leave"><i />{leaveCount} On leave</span>
      <span className="summary-total">{presentCount + absentCount + leaveCount} staff total</span>
    </div>
    <div className="table-scroll"><table className="data-table attendance-table">
      <thead><tr><th>STAFF MEMBER</th><th>DEPARTMENT</th><th>JOINED</th><th>STATUS</th><th className="align-right">MARK ATTENDANCE</th></tr></thead>
      <tbody>{staff.map((person) => {
        const status = getStatusForDate(store, person.id, attendanceDate, autoLeave);
        const isApprovedLeave = autoLeave && store.approvedLeaves.some((leave) => leave.staffId === person.id && leave.startDate <= attendanceDate && leave.endDate >= attendanceDate);
        return <tr key={person.id}>
          <td><div className="person-cell"><div className={`avatar avatar-${person.color}`}>{person.initials}</div><div><strong>{person.name}</strong><span>{person.id} · {person.title}</span></div></div></td>
          <td><span className="department-tag">{person.department}</span></td>
          <td className="muted-cell">{formatDate(person.joined)}</td>
          <td><StatusBadge status={status} /><span className="status-note">{isApprovedLeave ? "Approved leave" : status === "Present" ? "Marked today" : status === "Absent" ? "Marked today" : "No attendance"}</span></td>
          <td><div className="attendance-buttons"><button className={`mark-button present-button ${status === "Present" ? "selected" : ""}`} disabled={isApprovedLeave} onClick={() => onMark(person.id, "Present")}><Check size={15} />Present</button><button className={`mark-button absent-button ${status === "Absent" ? "selected" : ""}`} disabled={isApprovedLeave} onClick={() => onMark(person.id, "Absent")}><X size={15} />Absent</button></div></td>
        </tr>;
      })}</tbody>
    </table>{staff.length === 0 && <EmptyState title="No staff found" detail="Try a different search term." />}</div>
    <div className="panel-footnote"><ShieldCheck size={15} />Attendance is stored by date. You can review or update a previous day from the date picker.</div>
  </section>;
}

function StaffLoansPage({ store, staff, loans, onAdd, onRepay }: { store: Store; staff: Staff[]; loans: StaffLoan[]; onAdd: () => void; onRepay: (id: string) => void }) {
  const active = loans.filter((loan) => loan.amount > loan.repaid);
  const outstanding = active.reduce((sum, loan) => sum + loan.amount - loan.repaid, 0);
  const totalIssued = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalRepaid = loans.reduce((sum, loan) => sum + loan.repaid, 0);
  return <section className="panel">
    <div className="panel-heading">
      <div><h2>Advances &amp; staff loans</h2><p>Review employee balances and record repayments.</p></div>
      <button className="button button-primary" onClick={onAdd}><Plus size={17} />New advance or loan</button>
    </div>
    <div className="loan-summary-grid">
      <MiniMetric label="Total issued" value={money(totalIssued)} icon={ArrowUpRight} />
      <MiniMetric label="Repaid to date" value={money(totalRepaid)} icon={ArrowDownLeft} />
      <MiniMetric label="Outstanding" value={money(outstanding)} icon={CircleDollarSign} emphasis />
      <MiniMetric label="Active records" value={String(active.length)} icon={Clock3} />
    </div>
    <div className="section-subheading"><div><h3>Employee balances</h3><span>Open and completed records</span></div><span className="count-pill">{loans.length} records</span></div>
    <div className="table-scroll"><table className="data-table">
      <thead><tr><th>EMPLOYEE</th><th>TYPE</th><th>ISSUED</th><th>ORIGINAL AMOUNT</th><th>REPAID</th><th>BALANCE</th><th>PAYROLL DEDUCTION</th><th /></tr></thead>
      <tbody>{loans.map((loan) => {
        const person = staff.find((member) => member.id === loan.staffId) ?? STAFF.find((member) => member.id === loan.staffId);
        const balance = loan.amount - loan.repaid;
        return <tr key={loan.id}>
          <td><div className="person-cell compact-person"><div className={`avatar avatar-${person?.color ?? "green"}`}>{person?.initials ?? initials(person?.name ?? "Staff")}</div><div><strong>{person?.name ?? "Unknown staff"}</strong><span>{loan.id} · {person?.id ?? loan.staffId}</span></div></div></td>
          <td><span className={`type-pill ${loan.kind === "Advance" ? "advance-pill" : "loan-pill"}`}>{loan.kind}</span></td>
          <td className="muted-cell">{formatDate(loan.issueDate)}</td>
          <td className="amount-cell">{money(loan.amount)}</td>
          <td className="muted-cell">{money(loan.repaid)}</td>
          <td><strong className={balance === 0 ? "amount-paid" : ""}>{money(balance)}</strong></td>
          <td className="muted-cell">{money(loan.monthlyDeduction)} / mo</td>
          <td>{balance > 0 && <button className="text-action" onClick={() => onRepay(loan.id)}>Record payment</button>}{balance === 0 && <span className="paid-label"><Check size={14} />Paid</span>}</td>
        </tr>;
      })}</tbody>
    </table>{loans.length === 0 && <EmptyState title="No advance or loan records" detail="Add a record to start tracking employee balances." />}</div>
    <div className="note-banner"><HandCoins size={18} /><div><strong>Payroll deduction is a reference</strong><span>Monthly deduction amounts are recorded for planning; payroll is not changed automatically.</span></div></div>
    {store.staffLoans.length > 0 && <p className="table-caption">Advances and staff loans are employee receivables. Record repayments as they are collected.</p>}
  </section>;
}

function InstituteLoansPage({ loans, onAdd, onRepay }: { loans: InstituteLoan[]; onAdd: () => void; onRepay: (id: string) => void }) {
  const principal = loans.reduce((sum, loan) => sum + loan.principal, 0);
  const repaid = loans.reduce((sum, loan) => sum + loan.principalRepaid, 0);
  const outstanding = principal - repaid;
  const interestPaid = loans.reduce((sum, loan) => sum + loan.interestPaid, 0);
  return <section className="panel">
    <div className="panel-heading">
      <div><h2>Institute investment loans</h2><p>Track borrowing taken for institute projects and investments.</p></div>
      <button className="button button-primary" onClick={onAdd}><Plus size={17} />Record institute loan</button>
    </div>
    <div className="loan-summary-grid institute-summary">
      <MiniMetric label="Total borrowed" value={money(principal)} icon={Landmark} />
      <MiniMetric label="Principal repaid" value={money(repaid)} icon={ArrowDownLeft} />
      <MiniMetric label="Principal outstanding" value={money(outstanding)} icon={Wallet} emphasis />
      <MiniMetric label="Interest paid" value={money(interestPaid)} icon={Coins} />
    </div>
    <div className="note-banner investment-note"><ShieldCheck size={18} /><div><strong>Investment loan register</strong><span>Principal due and interest paid are tracked separately for clear accounting.</span></div></div>
    <div className="section-subheading"><div><h3>Borrowing records</h3><span>Institute liabilities by lender</span></div><span className="count-pill">{loans.length} records</span></div>
    <div className="table-scroll"><table className="data-table institute-table">
      <thead><tr><th>LENDER / PURPOSE</th><th>START DATE</th><th>TERM</th><th>RATE</th><th>PRINCIPAL</th><th>REPAID</th><th>OUTSTANDING</th><th>INTEREST PAID</th><th /></tr></thead>
      <tbody>{loans.map((loan) => {
        const balance = loan.principal - loan.principalRepaid;
        return <tr key={loan.id}>
          <td><div className="lender-cell"><div className="lender-icon"><Landmark size={17} /></div><div><strong>{loan.lender}</strong><span>{loan.purpose} · {loan.id}</span></div></div></td>
          <td className="muted-cell">{formatDate(loan.startDate)}</td>
          <td>{loan.termMonths} mo</td>
          <td>{loan.interestRate}%</td>
          <td>{money(loan.principal)}</td>
          <td className="muted-cell">{money(loan.principalRepaid)}</td>
          <td><strong>{money(balance)}</strong></td>
          <td className="muted-cell">{money(loan.interestPaid)}</td>
          <td>{balance > 0 && <button className="text-action" onClick={() => onRepay(loan.id)}>Record payment</button>}{balance === 0 && <span className="paid-label"><Check size={14} />Paid</span>}</td>
        </tr>;
      })}</tbody>
    </table>{loans.length === 0 && <EmptyState title="No institute loans recorded" detail="Add a loan when the institute borrows for an investment or project." />}</div>
    <div className="table-caption">Outstanding shows principal only. Interest paid is tracked separately; this prototype does not calculate an amortization schedule.</div>
  </section>;
}

function MiniMetric({ label, value, icon: Icon, emphasis = false }: { label: string; value: string; icon: IconType; emphasis?: boolean }) {
  return <div className={`mini-metric ${emphasis ? "mini-metric-emphasis" : ""}`}><div className="mini-metric-icon"><Icon size={17} /></div><span>{label}</span><strong>{value}</strong></div>;
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const className = status === "Present" ? "badge-present" : status === "Absent" ? "badge-absent" : "badge-leave";
  return <span className={`status-badge ${className}`}><i />{status}</span>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="form-field"><span>{label}</span>{children}</label>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-heading"><div><span className="modal-kicker">HR &amp; PAYROLL</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
      {children}
    </section>
  </div>;
}

function FormActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return <div className="form-actions full-span"><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button><button type="submit" className="button button-primary"><Check size={16} />{submitLabel}</button></div>;
}

function RepaymentForm({ label, max, onCancel, onSubmit }: { label: string; max: number; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="form-grid" onSubmit={onSubmit}><Field label={label}><input type="number" name="amount" min="1" max={max} step="1" required placeholder="0" /></Field><p className="form-hint full-span">Maximum remaining balance: <strong>{money(max)}</strong></p><FormActions onCancel={onCancel} submitLabel="Record repayment" /></form>;
}

function InstitutePaymentForm({ maxPrincipal, onCancel, onSubmit }: { maxPrincipal: number; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="form-grid" onSubmit={onSubmit}><div className="form-row"><Field label="Principal payment (BDT)"><input type="number" name="principal" min="0" max={maxPrincipal} step="1" required defaultValue="0" /></Field><Field label="Interest payment (BDT)"><input type="number" name="interest" min="0" step="1" required defaultValue="0" /></Field></div><p className="form-hint full-span">Remaining principal: <strong>{money(maxPrincipal)}</strong>. At least one payment amount must be greater than zero.</p><FormActions onCancel={onCancel} submitLabel="Record payment" /></form>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><div><CreditCard size={22} /></div><strong>{title}</strong><span>{detail}</span></div>;
}

function modalTitle(kind: Exclude<ModalKind, null>): string {
  const titles: Record<Exclude<ModalKind, null>, string> = {
    leave: "Add approved leave",
    "staff-loan": "New advance or loan",
    "staff-payment": "Record staff repayment",
    "institute-loan": "Record institute loan",
    "institute-payment": "Record loan payment",
  };
  return titles[kind];
}

export default App;
