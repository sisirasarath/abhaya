import React, { useEffect, useState } from "react";
import { Link, NavLink, useParams, useSearchParams } from "react-router-dom";
import {
  ShieldAlert,
  Building2,
  Scale,
  ClipboardCheck,
  UserCheck,
  PhoneCall,
  Sliders,
  ArrowRight,
} from "lucide-react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

const MonochromeBarChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <p className="text-xs text-[#44413E]">No chart data yet.</p>;
  }
  const maxVal = Math.max(...data.map((d) => Number(d.count) || 0), 1);
  return (
    <div className="space-y-4 py-2">
      {data.map((item) => {
        const count = Number(item.count) || 0;
        const pct = Math.max(
          Math.round((count / maxVal) * 100),
          count > 0 ? 8 : 2
        );
        return (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-typewriter text-[11px] uppercase tracking-[0.14em] text-[#44413E]">
                {String(item.name).replace(/_/g, " ")}
              </span>
              <span className="font-anton text-xl text-[#171717]">
                {count}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#D9D5CE] border border-[#171717]/30">
              <div
                className="h-full bg-[#B52D27] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ACTION_IN_PROGRESS", label: "Action in Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const AUTHORITIES = [
  "Women's Cell",
  "Internal Complaints Committee",
  "Hostel Warden",
  "College Administration",
  "Security Wing",
];

const classifyComplaintWing = (c) => {
  if (
    c.category_code === "EMERGENCY_URGENT" ||
    c.priority === "URGENT" ||
    c.immediate_assistance_required
  ) {
    return {
      code: "URGENT_DESK",
      label: "Urgent & Emergency Wing",
      badgeClass: "bg-[#B52D27] text-[#FAF9F5] border-[#171717]",
    };
  }
  if (c.category_code === "HOSTEL") {
    return {
      code: "HOSTEL_ADMIN",
      label: "Hostel Admin Wing",
      badgeClass: "bg-[#D5B94D] text-[#171717] border-[#171717]",
    };
  }
  if (
    c.category_code === "PERSONAL_SAFETY" ||
    c.category_code === "COLLEGE_ISSUES"
  ) {
    return {
      code: "WOMENS_CELL",
      label: "Women's Cell / ICC Wing",
      badgeClass: "bg-[#D58D9D] text-[#171717] border-[#171717]",
    };
  }
  return {
    code: "COMPLAINT_HANDLER",
    label: "Complaint Handler Wing",
    badgeClass: "bg-[#FAF9F5] text-[#171717] border-[#171717]",
  };
};

const AdminSubnav = () => {
  const links = [
    { to: "/admin/dashboard", label: "Classified Overview" },
    { to: "/admin/complaints", label: "Complaint Sections" },
    { to: "/admin/verifications", label: "Student Verification" },
    { to: "/admin/students", label: "Registered Students" },
    { to: "/admin/helplines", label: "Helpline Management" },
    { to: "/admin/administrators", label: "Governance Wings" },
    { to: "/admin/reports", label: "Reports & Analytics" },
    { to: "/admin/settings", label: "Settings & Credentials" },
  ];

  return (
    <div className="border-b-2 border-[#171717] bg-[#FAF9F5]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center gap-6 overflow-x-auto py-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `font-oswald text-xs font-bold uppercase tracking-[0.15em] whitespace-nowrap py-1 ${
                isActive
                  ? "text-[#171717] border-b-2 border-[#B52D27]"
                  : "text-[#77736B] hover:text-[#171717]"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   16. ADMIN DASHBOARD (/admin/dashboard)
   Single Unified Admin Login with Classified Administrative Sections
   ============================================================================ */
export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWingFilter, setActiveWingFilter] = useState("ALL");

  useEffect(() => {
    apiClient
      .get("/admin/dashboard/")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const m = data?.metrics || data?.statistics || {};
  const rawCategories =
    data?.by_category || data?.charts?.complaints_by_category || [];
  const categoryChart = rawCategories.map((item) => ({
    name: item.name || item.category_code || item.category__name || "Category",
    count: item.count || 0,
  }));

  const cards = [
    { label: "Total Registered Students", value: m.total_registered_students ?? 0 },
    {
      label: "Pending Verifications",
      value: m.pending_verifications ?? m.pending_registrations ?? 0,
    },
    { label: "Total Complaints", value: m.total_complaints ?? 0 },
    { label: "New Submitted", value: m.new_submitted ?? m.new_complaints ?? 0 },
    { label: "Urgent Cases", value: m.urgent_complaints ?? 0 },
    {
      label: "Under Review / Active",
      value:
        (m.under_review ?? m.complaints_under_review ?? 0) +
        (m.complaints_in_progress ?? 0),
    },
    { label: "Resolved Cases", value: m.resolved_complaints ?? 0 },
  ];

  /* Classified Administrative Sections inside the single Admin Login */
  const classifiedSections = [
    {
      id: "SUPER_ADMIN",
      number: "01",
      title: "Super Admin • All Governance",
      authority: "Central Administrative Oversight",
      description:
        "Complete oversight of all submitted student complaints, confidential identity records, audit logs, and institutional settings.",
      count: m.total_complaints ?? 0,
      countLabel: "Total Complaints",
      to: "/admin/complaints?section=ALL",
      accent: "bg-[#171717] text-[#FAF9F5]",
      icon: ShieldAlert,
    },
    {
      id: "WOMENS_CELL",
      number: "02",
      title: "Women's Cell / ICC Section",
      authority: "Women's Cell & Internal Complaints Committee",
      description:
        "Classified section for Personal Safety, Harassment, Stalking, POSH Act inquiries, and Campus Safety issues.",
      count: m.womens_cell_count ?? 0,
      countLabel: "Safety & ICC Cases",
      to: "/admin/complaints?section=WOMENS_CELL",
      accent: "bg-[#D58D9D] text-[#171717]",
      icon: Scale,
    },
    {
      id: "HOSTEL_ADMIN",
      number: "03",
      title: "Hostel Administration Section",
      authority: "Ladies Hostel Warden & Welfare Wing",
      description:
        "Classified section for Ladies Hostel water supply, electricity, sanitation, food quality, security, and warden concerns.",
      count: m.hostel_wing_count ?? 0,
      countLabel: "Hostel Complaints",
      to: "/admin/complaints?section=HOSTEL_ADMIN",
      accent: "bg-[#D5B94D] text-[#171717]",
      icon: Building2,
    },
    {
      id: "COMPLAINT_HANDLER",
      number: "04",
      title: "Complaint Handler Section",
      authority: "Assigned Redressal & Action Wing",
      description:
        "Classified section for complaints currently Under Review, Assigned to Authorities, or with Action in Progress.",
      count: m.active_handler_count ?? 0,
      countLabel: "Active / In-Progress",
      to: "/admin/complaints?section=COMPLAINT_HANDLER",
      accent: "bg-[#B52D27] text-[#FAF9F5]",
      icon: ClipboardCheck,
    },
    {
      id: "VERIFICATION_DESK",
      number: "05",
      title: "Student Verification Section",
      authority: "Female Student Eligibility Desk",
      description:
        "Verify new female student registrations against admission numbers and approve or reject portal access.",
      count: m.pending_verifications ?? m.pending_registrations ?? 0,
      countLabel: "Pending Approvals",
      to: "/admin/verifications",
      accent: "bg-[#FAF9F5] text-[#171717]",
      icon: UserCheck,
    },
    {
      id: "HELPLINE_SETTINGS",
      number: "06",
      title: "Helplines & Portal Settings",
      authority: "Emergency Directory & Admin Credentials",
      description:
        "Manage public 24/7 emergency helpline numbers, campus contacts, and update administrator login credentials.",
      count: m.urgent_complaints ?? 0,
      countLabel: "Urgent Alerts",
      to: "/admin/helplines",
      accent: "bg-[#F3EBDD] text-[#171717]",
      icon: PhoneCall,
    },
  ];

  const allRecentComplaints =
    data?.recent_complaints || data?.urgent_complaints_queue || [];

  const filteredRecent = allRecentComplaints.filter((c) => {
    if (activeWingFilter === "ALL") return true;
    if (activeWingFilter === "WOMENS_CELL") {
      return (
        c.category_code === "PERSONAL_SAFETY" ||
        c.category_code === "COLLEGE_ISSUES"
      );
    }
    if (activeWingFilter === "HOSTEL_ADMIN") {
      return c.category_code === "HOSTEL";
    }
    if (activeWingFilter === "COMPLAINT_HANDLER") {
      return ["UNDER_REVIEW", "ASSIGNED", "ACTION_IN_PROGRESS"].includes(
        c.status
      );
    }
    if (activeWingFilter === "URGENT") {
      return (
        c.category_code === "EMERGENCY_URGENT" ||
        c.priority === "URGENT" ||
        c.immediate_assistance_required
      );
    }
    return true;
  });

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <AdminSubnav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-12">
        {/* Header */}
        <div className="border-b-2 border-[#171717] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="editorial-stamp-burgundy mb-2">
              UNIFIED ADMINISTRATOR PORTAL • USERNAME: {user?.username || "abhayasfi"}
            </span>
            <h1 className="font-anton text-4xl sm:text-5xl uppercase tracking-[0.05em] text-[#171717] mt-1">
              Administrator Governance Hub
            </h1>
            <p className="font-caveat text-2xl text-[#B52D27] font-bold mt-1">
              All Administrative Sections Classified Under One Unified Login
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/complaints" className="btn-primary py-2.5 px-5">
              All Classified Complaints
            </Link>
            <Link to="/admin/settings" className="btn-secondary py-2.5 px-5">
              Admin Credentials &amp; Settings
            </Link>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="paper-sheet p-5 flex flex-col justify-between"
            >
              <p className="font-typewriter text-[10px] uppercase tracking-[0.14em] text-[#44413E] mb-3">
                {c.label}
              </p>
              <p className="font-anton text-4xl text-[#171717]">
                {loading ? "—" : c.value}
              </p>
            </div>
          ))}
        </div>

        {/* CLASSIFIED ADMINISTRATIVE SECTIONS */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#171717] pb-4">
            <div>
              <span className="editorial-stamp-mustard mb-2">
                CLASSIFIED ADMINISTRATIVE SECTIONS
              </span>
              <h2 className="font-anton text-3xl uppercase tracking-[0.04em] text-[#171717]">
                Department &amp; Authority Classification
              </h2>
            </div>
            <p className="font-typewriter text-xs text-[#44413E]">
              Select any classified section below to manage its dedicated records
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classifiedSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <Link
                  key={sec.id}
                  to={sec.to}
                  className="paper-sheet flex flex-col justify-between hover:-translate-y-1 transition-transform group"
                >
                  <div>
                    <div
                      className={`px-6 py-4 border-b-2 border-[#171717] flex items-center justify-between ${sec.accent}`}
                    >
                      <span className="font-oswald text-xs font-bold uppercase tracking-[0.18em]">
                        SECTION {sec.number}
                      </span>
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <div className="p-6 space-y-3">
                      <p className="font-typewriter text-[10px] uppercase tracking-[0.16em] text-[#B52D27]">
                        {sec.authority}
                      </p>
                      <h3 className="font-anton text-2xl uppercase tracking-[0.04em] text-[#171717]">
                        {sec.title}
                      </h3>
                      <p className="text-xs text-[#44413E] leading-relaxed">
                        {sec.description}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#171717]/20 bg-[#F3EBDD]/60 flex items-center justify-between">
                    <div>
                      <span className="font-anton text-2xl text-[#171717] mr-2">
                        {loading ? "—" : sec.count}
                      </span>
                      <span className="font-typewriter text-[10px] uppercase tracking-[0.14em] text-[#44413E]">
                        {sec.countLabel}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-oswald text-xs font-bold uppercase tracking-[0.16em] text-[#B52D27] group-hover:translate-x-1 transition-transform">
                      Open Section <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Analytics Chart + Quick Section-Filtered Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 paper-sheet p-6">
            <h2 className="font-oswald text-sm font-bold uppercase tracking-[0.16em] text-[#171717] mb-6 border-b border-[#171717] pb-3">
              Complaints Classified by Category
            </h2>
            <div className="py-2">
              <MonochromeBarChart data={categoryChart} />
            </div>
          </div>

          <div className="lg:col-span-7 paper-sheet p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#171717] pb-3">
              <h2 className="font-oswald text-sm font-bold uppercase tracking-[0.16em] text-[#171717]">
                Classified Complaint Stream
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "ALL", label: "All" },
                  { id: "WOMENS_CELL", label: "Women's Cell / ICC" },
                  { id: "HOSTEL_ADMIN", label: "Hostel Admin" },
                  { id: "COMPLAINT_HANDLER", label: "Handler Wing" },
                  { id: "URGENT", label: "Urgent" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveWingFilter(tab.id)}
                    className={`font-typewriter text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 border ${
                      activeWingFilter === tab.id
                        ? "bg-[#171717] text-[#FAF9F5] border-[#171717]"
                        : "bg-[#F3EBDD] text-[#171717] border-[#171717]/40 hover:border-[#171717]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#D9D5CE]">
              {filteredRecent.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#44413E]">
                  No complaints in this classified section.
                </p>
              ) : (
                filteredRecent.slice(0, 6).map((c) => {
                  const wing = classifyComplaintWing(c);
                  return (
                    <div
                      key={c.complaint_id}
                      className="py-3.5 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-typewriter text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 border ${wing.badgeClass}`}
                          >
                            {wing.label}
                          </span>
                          <span className="font-typewriter font-bold text-[#171717]">
                            {c.complaint_id}
                          </span>
                        </div>
                        <p className="font-medium text-[#171717]">{c.title}</p>
                        <p className="text-[#44413E]">
                          {c.category_name || c.category_code} • Priority:{" "}
                          <span className="text-[#B52D27] font-semibold">
                            {c.priority}
                          </span>{" "}
                          • Status: {c.status}
                        </p>
                      </div>
                      <Link
                        to={`/admin/complaints/${c.complaint_id}`}
                        className="font-oswald text-xs uppercase tracking-[0.14em] border-2 border-[#171717] px-3.5 py-1.5 bg-[#FAF9F5] hover:bg-[#171717] hover:text-[#FAF9F5] shrink-0"
                      >
                        Manage
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   17. COMPLAINT MANAGEMENT (/admin/complaints)
   Classified into Super Admin, Women's Cell / ICC, Hostel Admin, Complaint Handler & Urgent Sections
   ============================================================================ */
export const AdminComplaintsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get("section") || "ALL";

  const [activeSection, setActiveSection] = useState(initialSection);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    priority: "",
    hostel: "",
  });

  const loadComplaints = () => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    apiClient
      .get("/admin/complaints/", { params })
      .then((res) => {
        setComplaints(
          Array.isArray(res.data) ? res.data : res.data.results || []
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    const sec = searchParams.get("section");
    if (sec) setActiveSection(sec);
  }, [searchParams]);

  const handleSelectSection = (secId) => {
    setActiveSection(secId);
    setSearchParams({ section: secId });
  };

  const sectionTabs = [
    {
      id: "ALL",
      label: "01. All Sections (Super Admin)",
      desc: "All complaints across every campus department and wing.",
    },
    {
      id: "WOMENS_CELL",
      label: "02. Women's Cell / ICC Wing",
      desc: "Personal Safety, Harassment, Stalking, POSH & College Safety complaints.",
    },
    {
      id: "HOSTEL_ADMIN",
      label: "03. Hostel Admin Wing",
      desc: "Ladies Hostel water, electricity, mess, sanitation, warden & security complaints.",
    },
    {
      id: "COMPLAINT_HANDLER",
      label: "04. Complaint Handler Wing",
      desc: "Complaints currently Under Review, Assigned, or Action in Progress.",
    },
    {
      id: "URGENT_DESK",
      label: "05. Urgent & Emergency Desk",
      desc: "High-priority Urgent Concerns and immediate assistance requests.",
    },
    {
      id: "RESOLVED_ARCHIVE",
      label: "06. Resolved & Closed Archive",
      desc: "Completed and resolved grievance records.",
    },
  ];

  const classifiedComplaints = complaints.filter((c) => {
    if (activeSection === "ALL") return true;
    if (activeSection === "WOMENS_CELL") {
      return (
        c.category_code === "PERSONAL_SAFETY" ||
        c.category_code === "COLLEGE_ISSUES" ||
        c.assigned_authority === "Women's Cell" ||
        c.assigned_authority === "Internal Complaints Committee"
      );
    }
    if (activeSection === "HOSTEL_ADMIN") {
      return (
        c.category_code === "HOSTEL" ||
        c.assigned_authority === "Hostel Warden"
      );
    }
    if (activeSection === "COMPLAINT_HANDLER") {
      return ["UNDER_REVIEW", "ASSIGNED", "ACTION_IN_PROGRESS"].includes(
        c.status
      );
    }
    if (activeSection === "URGENT_DESK") {
      return (
        c.category_code === "EMERGENCY_URGENT" ||
        c.priority === "URGENT" ||
        c.immediate_assistance_required
      );
    }
    if (activeSection === "RESOLVED_ARCHIVE") {
      return ["RESOLVED", "CLOSED"].includes(c.status);
    }
    return true;
  });

  const currentTabObj =
    sectionTabs.find((t) => t.id === activeSection) || sectionTabs[0];

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <AdminSubnav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <div className="border-b-2 border-[#171717] pb-5">
          <span className="editorial-stamp-burgundy mb-2">
            CLASSIFIED GRIEVANCE MANAGEMENT
          </span>
          <h1 className="font-anton text-4xl sm:text-5xl uppercase tracking-[0.05em] text-[#171717] mt-1">
            Complaint Management by Section
          </h1>
          <p className="text-xs text-[#44413E] mt-1">
            Switch between classified administrative wings below or filter across all records.
          </p>
        </div>

        {/* Classified Section Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectionTabs.map((tab) => {
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectSection(tab.id)}
                className={`text-left p-4 border-2 transition-all ${
                  active
                    ? "bg-[#171717] text-[#FAF9F5] border-[#171717] shadow-[4px_4px_0px_#B52D27]"
                    : "bg-[#FAF9F5] text-[#171717] border-[#171717] hover:bg-[#D5B94D]/25"
                }`}
              >
                <p className="font-oswald text-xs font-bold uppercase tracking-[0.14em]">
                  {tab.label}
                </p>
                <p
                  className={`text-[11px] mt-1 leading-snug ${
                    active ? "text-[#F3EBDD]/80" : "text-[#44413E]"
                  }`}
                >
                  {tab.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Section Banner */}
        <div className="mustard-poster-box p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-oswald text-xs font-bold uppercase tracking-[0.16em] text-[#171717]">
              ACTIVE SECTION: {currentTabObj.label}
            </span>
            <p className="text-xs text-[#171717]/80">{currentTabObj.desc}</p>
          </div>
          <span className="font-anton text-2xl text-[#171717]">
            {classifiedComplaints.length} Record(s)
          </span>
        </div>

        {/* Filters */}
        <div className="paper-sheet p-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Search ID, title..."
            value={filters.search}
            onChange={(e) =>
              setFilters((p) => ({ ...p, search: e.target.value }))
            }
            className="input-editorial text-xs"
          />
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((p) => ({ ...p, category: e.target.value }))
            }
            className="input-editorial text-xs"
          >
            <option value="">All Categories</option>
            <option value="HOSTEL">Hostel Issues</option>
            <option value="PERSONAL_SAFETY">Personal Safety</option>
            <option value="COLLEGE_ISSUES">College Issues</option>
            <option value="EMERGENCY_URGENT">Urgent Concerns</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
            className="input-editorial text-xs"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters((p) => ({ ...p, priority: e.target.value }))
            }
            className="input-editorial text-xs"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <input
            type="text"
            placeholder="Filter by hostel..."
            value={filters.hostel}
            onChange={(e) =>
              setFilters((p) => ({ ...p, hostel: e.target.value }))
            }
            className="input-editorial text-xs"
          />
          <button onClick={loadComplaints} className="btn-primary py-2 text-xs">
            Apply Filters
          </button>
        </div>

        {/* Table */}
        <div className="paper-sheet overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#171717] bg-[#F3EBDD] font-oswald text-xs font-bold uppercase tracking-[0.14em] text-[#171717]">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Classified Wing</th>
                <th className="py-3.5 px-4">Title &amp; Category</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D5CE] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#44413E]">
                    Loading complaints...
                  </td>
                </tr>
              ) : classifiedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#44413E]">
                    No complaints found in this classified section.
                  </td>
                </tr>
              ) : (
                classifiedComplaints.map((c) => {
                  const wing = classifyComplaintWing(c);
                  return (
                    <tr key={c.complaint_id} className="hover:bg-[#F3EBDD]/60">
                      <td className="py-4 px-4 font-typewriter font-bold text-[#171717]">
                        {c.complaint_id}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block font-typewriter text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 border ${wing.badgeClass}`}
                        >
                          {wing.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#171717] max-w-xs">
                        <p className="font-medium truncate">{c.title}</p>
                        <p className="text-[11px] text-[#44413E]">
                          {c.category_name || c.category_code} — {c.subcategory}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-[#44413E]">
                        {c.student_identity?.full_name ||
                          c.student_name_display ||
                          "Confidential"}
                      </td>
                      <td className="py-4 px-4 font-typewriter uppercase text-[#B52D27] font-bold">
                        {c.priority}
                      </td>
                      <td className="py-4 px-4 font-typewriter uppercase">
                        {c.status}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          to={`/admin/complaints/${c.complaint_id}`}
                          className="font-oswald text-xs font-bold uppercase tracking-[0.14em] underline text-[#B52D27]"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   17B. ADMIN COMPLAINT DETAIL & ASSIGNMENT (/admin/complaints/:complaintId)
   ============================================================================ */
export const AdminComplaintDetailPage = () => {
  const { complaintId } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("UNDER_REVIEW");
  const [priority, setPriority] = useState("MEDIUM");
  const [authority, setAuthority] = useState(AUTHORITIES[0]);
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [feedback, setFeedback] = useState("");

  const fetchComplaint = () => {
    apiClient
      .get(`/admin/complaints/${complaintId}/`)
      .then((res) => {
        const cObj = res.data.complaint || res.data;
        setComplaint(cObj);
        setStatus(cObj.status || "UNDER_REVIEW");
        setPriority(cObj.priority || "MEDIUM");
        setAuthority(cObj.assigned_authority || AUTHORITIES[0]);
        setResolutionDetails(cObj.resolution_details || "");
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setFeedback("");
    try {
      await apiClient.post(`/admin/complaints/${complaintId}/assign/`, {
        assigned_to_authority: authority,
        assigned_authority: authority,
        priority,
        assignment_note: `Assigned to ${authority} (Priority: ${priority}).`,
      });
      setFeedback("Complaint assignment updated.");
      fetchComplaint();
    } catch (err) {
      setFeedback(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to assign complaint."
      );
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setFeedback("");
    try {
      await apiClient.post(`/admin/complaints/${complaintId}/update-status/`, {
        status,
        priority,
        message: message || `Complaint status updated to ${status}.`,
        is_internal: isInternal,
        resolution_details: resolutionDetails,
      });
      setMessage("");
      setFeedback("Complaint status and update recorded.");
      fetchComplaint();
    } catch (err) {
      setFeedback(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update complaint."
      );
    }
  };

  const identity = complaint?.student_identity || {};
  const wing = complaint ? classifyComplaintWing(complaint) : null;

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <AdminSubnav />
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <Link
          to="/admin/complaints"
          className="font-typewriter text-xs uppercase tracking-[0.16em] text-[#44413E] hover:text-[#171717]"
        >
          ← Back to Classified Complaint Sections
        </Link>

        {feedback && (
          <div className="p-4 border-2 border-[#B52D27] bg-[#FAF9F5] text-xs text-[#171717]">
            {feedback}
          </div>
        )}

        {complaint && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="paper-sheet p-8 space-y-5">
                <div className="border-b border-[#D9D5CE] pb-4 space-y-2">
                  {wing && (
                    <span
                      className={`inline-block font-typewriter text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 border ${wing.badgeClass}`}
                    >
                      CLASSIFIED SECTION: {wing.label}
                    </span>
                  )}
                  <p className="font-typewriter text-xs uppercase tracking-[0.16em] text-[#B52D27]">
                    {complaint.complaint_id} •{" "}
                    {complaint.category_name || complaint.category_code} —{" "}
                    {complaint.subcategory}
                  </p>
                  <h1 className="font-anton text-3xl uppercase tracking-[0.04em] text-[#171717] mt-1">
                    {complaint.title}
                  </h1>
                </div>

                <p className="text-sm text-[#44413E] leading-relaxed whitespace-pre-line">
                  {complaint.description}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D9D5CE] text-xs">
                  <div>
                    <span className="text-[#44413E] block">Student Name</span>
                    <span className="font-medium text-[#171717]">
                      {identity.full_name || "Confidential"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#44413E] block">
                      Admission Number
                    </span>
                    <span className="font-medium text-[#171717]">
                      {identity.admission_number || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#44413E] block">
                      Location &amp; Date
                    </span>
                    <span className="font-medium text-[#171717]">
                      {complaint.incident_location} ({complaint.incident_date})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#44413E] block">
                      Hostel / Residence
                    </span>
                    <span className="font-medium text-[#171717]">
                      {identity.hostel_name ||
                        complaint.student_hostel ||
                        identity.residence_type ||
                        "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="paper-sheet p-8 space-y-5">
                <h2 className="font-anton text-2xl uppercase tracking-[0.06em] text-[#171717]">
                  Case Timeline &amp; Notes
                </h2>
                <div className="space-y-4">
                  {(complaint.updates || []).map((u) => (
                    <div
                      key={u.id}
                      className={`p-4 border ${
                        u.is_internal
                          ? "border-[#B52D27] bg-[#F3EBDD]"
                          : "border-[#D9D5CE] bg-[#FAF9F5]"
                      } text-xs space-y-1`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-typewriter uppercase tracking-[0.14em] text-[#171717]">
                          {u.author_display_name}{" "}
                          {u.is_internal &&
                            "(INTERNAL NOTE — Hidden from Student)"}
                        </span>
                        <span className="text-[#44413E]">
                          {new Date(u.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[#44413E] leading-relaxed">
                        {u.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Assignment & Status Updates */}
            <div className="lg:col-span-5 space-y-6">
              <form
                onSubmit={handleAssign}
                className="paper-sheet p-6 space-y-4"
              >
                <h2 className="font-oswald text-sm font-bold uppercase tracking-[0.16em] text-[#171717]">
                  Classify &amp; Assign Authority Wing
                </h2>
                <div>
                  <label className="label-editorial">Redressal Authority</label>
                  <select
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="input-editorial text-xs"
                  >
                    {AUTHORITIES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-editorial">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input-editorial text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <button type="submit" className="btn-secondary w-full py-2.5">
                  Save Section Assignment
                </button>
              </form>

              <form
                onSubmit={handleStatusUpdate}
                className="paper-sheet p-6 space-y-4"
              >
                <h2 className="font-oswald text-sm font-bold uppercase tracking-[0.16em] text-[#171717]">
                  Update Status &amp; Add Note
                </h2>
                <div>
                  <label className="label-editorial">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-editorial text-xs"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-editorial">
                    Update Message / Note
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter status update or internal note..."
                    className="input-editorial text-xs"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-[#44413E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="accent-[#171717]"
                  />
                  <span>Mark as Internal Note (not shown to student)</span>
                </label>
                <div>
                  <label className="label-editorial">
                    Resolution Details (For Resolved / Closed)
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                    placeholder="Summary of resolution action taken..."
                    className="input-editorial text-xs"
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-2.5">
                  Record Update
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   18. STUDENT VERIFICATION (/admin/verifications)
   ============================================================================ */
export const AdminVerificationsPage = () => {
  const [students, setStudents] = useState([]);
  const [feedback, setFeedback] = useState("");

  const loadVerifications = () => {
    apiClient
      .get("/admin/verifications/")
      .then((res) => {
        setStudents(
          Array.isArray(res.data) ? res.data : res.data.results || []
        );
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  const handleAction = async (studentId, decision) => {
    setFeedback("");
    try {
      await apiClient.post(`/admin/verifications/${studentId}/action/`, {
        status: decision,
        decision,
        notes: `Registration ${decision.toLowerCase()} by administrator.`,
      });
      setFeedback(`Student account ${decision.toLowerCase()}.`);
      loadVerifications();
    } catch (err) {
      setFeedback(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not update verification."
      );
    }
  };

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <AdminSubnav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="editorial-stamp-mustard mb-2">
            SECTION 05 • ELIGIBILITY VERIFICATION
          </span>
          <h1 className="font-anton text-4xl uppercase tracking-[0.06em] text-[#171717] mt-1">
            Student Verification
          </h1>
        </div>

        {feedback && (
          <div className="p-4 border-2 border-[#B52D27] bg-[#FAF9F5] text-xs text-[#171717]">
            {feedback}
          </div>
        )}

        <div className="paper-sheet overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#171717] bg-[#F3EBDD] font-oswald text-xs font-bold uppercase tracking-[0.14em] text-[#171717]">
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Admission No.</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Roster Match</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D5CE] text-xs">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-[#F3EBDD]/60">
                  <td className="py-4 px-4 font-medium text-[#171717]">
                    {s.full_name}
                  </td>
                  <td className="py-4 px-4 font-typewriter">
                    {s.admission_number}
                  </td>
                  <td className="py-4 px-4 text-[#44413E]">{s.email}</td>
                  <td className="py-4 px-4 text-[#44413E]">{s.department}</td>
                  <td className="py-4 px-4">
                    {s.roster_matched ? "Matched" : "Manual Review"}
                  </td>
                  <td className="py-4 px-4 font-typewriter uppercase text-[#B52D27] font-bold">
                    {s.verification_status}
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleAction(s.id, "APPROVED")}
                      className="font-oswald text-xs uppercase tracking-[0.14em] px-3 py-1.5 bg-[#171717] text-[#FAF9F5]"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(s.id, "REJECTED")}
                      className="font-oswald text-xs uppercase tracking-[0.14em] px-3 py-1.5 border border-[#171717] text-[#171717]"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   19. REGISTERED STUDENTS (/admin/students)
   ============================================================================ */
export const AdminStudentsPage = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    apiClient
      .get("/admin/students/")
      .then((res) => {
        setStudents(
          Array.isArray(res.data) ? res.data : res.data.results || []
        );
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <AdminSubnav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <h1 className="font-anton text-4xl uppercase tracking-[0.06em] text-[#171717]">
          Registered Female Students
        </h1>
        <div className="paper-sheet overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#171717] bg-[#F3EBDD] font-oswald text-xs font-bold uppercase tracking-[0.14em] text-[#171717]">
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Admission No.</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Residence</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D5CE] text-xs">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="py-4 px-4 font-medium text-[#171717]">
                    {s.full_name}
                  </td>
                  <td className="py-4 px-4 font-typewriter">
                    {s.admission_number}
                  </td>
                  <td className="py-4 px-4 text-[#44413E]">
                    {s.department} ({s.year_semester})
                  </td>
                  <td className="py-4 px-4 text-[#44413E]">
                    {s.hostel_name || s.residence_type}
                  </td>
                  <td className="py-4 px-4 font-typewriter uppercase text-[#B52D27] font-bold">
                    {s.verification_status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   20. HELPLINE MANAGEMENT (/admin/helplines)
   ============================================================================ */
export const AdminHelplinesPage = () => {
  const [helplines, setHelplines] = useState([]);
  const [form, setForm] = useState({
    service_name: "",
    contact_number: "",
    category: "COLLEGE_CELL",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const loadHelplines = () => {
    apiClient
      .get("/admin/helplines/")
      .then((res) => {
        setHelplines(
          Array.isArray(res.data) ? res.data : res.data.results || []
        );
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadHelplines();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback("");
    try {
      if (editingId) {
        await apiClient.patch(`/admin/helplines/${editingId}/`, form);
        setFeedback(
          "Helpline updated and synced to public Emergency Helplines."
        );
      } else {
        await apiClient.post("/admin/helplines/", form);
        setFeedback("Helpline added to public Emergency Helplines.");
      }
      setForm({
        service_name: "",
        contact_number: "",
        category: "COLLEGE_CELL",
        description: "",
      });
      setEditingId(null);
      loadHelplines();
    } catch {
      setFeedback("Unable to save helpline.");
    }
  };

  const handleDelete = async (id) => {
    await apiClient.delete(`/admin/helplines/${id}/`);
    loadHelplines();
  };

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <AdminSubnav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-10">
        <h1 className="font-anton text-4xl uppercase tracking-[0.06em] text-[#171717]">
          Helpline Management
        </h1>

        {feedback && (
          <div className="p-4 border-2 border-[#B52D27] bg-[#FAF9F5] text-xs text-[#171717]">
            {feedback}
          </div>
        )}

        <form onSubmit={handleSave} className="paper-sheet p-6 space-y-4">
          <h2 className="font-oswald text-sm font-bold uppercase tracking-[0.16em] text-[#171717]">
            {editingId ? "Edit Helpline Contact" : "Add Helpline Contact"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              required
              placeholder="Contact Name (e.g. College Women's Cell)"
              value={form.service_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, service_name: e.target.value }))
              }
              className="input-editorial text-xs"
            />
            <input
              type="text"
              placeholder="Phone Number (e.g. 112 or +91-485-2822363)"
              value={form.contact_number}
              onChange={(e) =>
                setForm((p) => ({ ...p, contact_number: e.target.value }))
              }
              className="input-editorial text-xs"
            />
            <select
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              className="input-editorial text-xs"
            >
              <option value="NATIONAL">National Helpline</option>
              <option value="POLICE_LEGAL">Police &amp; Legal</option>
              <option value="COLLEGE_CELL">
                College Women&apos;s Cell / ICC
              </option>
              <option value="HOSTEL_SECURITY">Hostel &amp; Security</option>
              <option value="SUPPORT_COUNSELING">Counseling Support</option>
            </select>
          </div>
          <input
            type="text"
            required
            placeholder="Brief description of the helpline..."
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            className="input-editorial text-xs"
          />
          <div className="flex gap-3">
            <button type="submit" className="btn-primary py-2.5 px-6">
              {editingId ? "Update Contact" : "Add Contact"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    service_name: "",
                    contact_number: "",
                    category: "COLLEGE_CELL",
                    description: "",
                  });
                }}
                className="btn-secondary py-2.5 px-6"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="paper-sheet divide-y divide-[#D9D5CE]">
          {helplines.map((h) => (
            <div
              key={h.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div>
                <p className="font-typewriter text-[#171717]">
                  {h.service_name} —{" "}
                  <span className="font-anton text-xl text-[#B52D27]">
                    {h.contact_number || "[Configurable Placeholder]"}
                  </span>
                </p>
                <p className="text-[#44413E] mt-1">{h.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingId(h.id);
                    setForm({
                      service_name: h.service_name,
                      contact_number: h.contact_number || "",
                      category: h.category,
                      description: h.description,
                    });
                  }}
                  className="font-oswald text-xs uppercase tracking-[0.14em] px-3 py-1.5 border border-[#171717]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="font-oswald text-xs uppercase tracking-[0.14em] px-3 py-1.5 border border-[#D9D5CE] text-[#44413E] hover:text-[#171717]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   21. GOVERNANCE WINGS CLASSIFICATION (/admin/administrators)
   ============================================================================ */
export const AdminAdministratorsPage = () => {
  const governanceWings = [
    {
      section: "SECTION 01",
      wing: "Super Admin & Central Governance",
      scope: "Full Portal Oversight, Student Verification, Audit Logs & Portal Settings",
      confidentialAccess: "Authorized (Full Access)",
      route: "/admin/complaints?section=ALL",
    },
    {
      section: "SECTION 02",
      wing: "Women's Cell / ICC Redressal Wing",
      scope: "Personal Safety, Harassment, Stalking, POSH Act & College Safety Issues",
      confidentialAccess: "Authorized (Confidential Redressal)",
      route: "/admin/complaints?section=WOMENS_CELL",
    },
    {
      section: "SECTION 03",
      wing: "Hostel Administration Wing",
      scope: "Ladies Hostel Water, Electricity, Sanitation, Mess/Food, Warden & Security",
      confidentialAccess: "Managed Under Unified Admin",
      route: "/admin/complaints?section=HOSTEL_ADMIN",
    },
    {
      section: "SECTION 04",
      wing: "Complaint Handler & Active Action Wing",
      scope: "Complaints Assigned, Under Review, and Action in Progress Across Campus",
      confidentialAccess: "Managed Under Unified Admin",
      route: "/admin/complaints?section=COMPLAINT_HANDLER",
    },
  ];

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <AdminSubnav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="editorial-stamp-burgundy mb-2">
            SINGLE UNIFIED ADMIN LOGIN • CLASSIFIED WINGS
          </span>
          <h1 className="font-anton text-4xl uppercase tracking-[0.06em] text-[#171717] mt-1">
            Classified Administrative Wings &amp; Authorities
          </h1>
          <p className="text-xs text-[#44413E] mt-1">
            All administrative wings operate inside the single unified administrator login (username: abhayasfi).
          </p>
        </div>

        <div className="paper-sheet overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#171717] bg-[#F3EBDD] font-oswald text-xs font-bold uppercase tracking-[0.14em] text-[#171717]">
                <th className="py-3.5 px-4">Section</th>
                <th className="py-3.5 px-4">Classified Wing</th>
                <th className="py-3.5 px-4">Jurisdiction &amp; Scope</th>
                <th className="py-3.5 px-4">Confidential Identity Access</th>
                <th className="py-3.5 px-4 text-right">Open Section</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D5CE] text-xs">
              {governanceWings.map((w) => (
                <tr key={w.section} className="hover:bg-[#F3EBDD]/60">
                  <td className="py-4 px-4 font-typewriter font-bold text-[#B52D27]">
                    {w.section}
                  </td>
                  <td className="py-4 px-4 font-oswald text-sm font-bold uppercase text-[#171717]">
                    {w.wing}
                  </td>
                  <td className="py-4 px-4 text-[#44413E]">{w.scope}</td>
                  <td className="py-4 px-4 font-typewriter text-[#171717]">
                    {w.confidentialAccess}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      to={w.route}
                      className="font-oswald text-xs font-bold uppercase tracking-[0.14em] underline text-[#B52D27]"
                    >
                      View Records →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   22. REPORTS & ANALYTICS (/admin/reports)
   ============================================================================ */
export const AdminReportsPage = () => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    apiClient
      .get("/admin/reports/")
      .then((res) => setReport(res.data))
      .catch(() => {});
  }, []);

  const statusData = (report?.by_status || []).map((s) => ({
    name: s.status,
    count: s.count,
  }));

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <AdminSubnav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-10">
        <h1 className="font-anton text-4xl uppercase tracking-[0.06em] text-[#171717]">
          Reports &amp; Analytics
        </h1>

        <div className="paper-sheet p-8">
          <h2 className="font-oswald text-sm font-bold uppercase tracking-[0.16em] text-[#171717] mb-6">
            Complaints by Resolution Status
          </h2>
          <div className="py-2">
            {statusData.length > 0 ? (
              <MonochromeBarChart data={statusData} />
            ) : (
              <p className="text-xs text-[#44413E]">Loading analytics...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   23. PORTAL SETTINGS & ADMIN CREDENTIALS (/admin/settings)
   ============================================================================ */
export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    apiClient
      .get("/admin/settings/")
      .then((res) => setSettings(res.data))
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback("");
    try {
      const payload = {
        ...settings,
      };
      if (adminNewPassword.trim()) {
        payload.admin_new_password = adminNewPassword.trim();
      }
      const res = await apiClient.patch("/admin/settings/", payload);
      setSettings(res.data);
      setAdminNewPassword("");
      setFeedback(
        "Portal configuration and administrator credentials updated successfully."
      );
    } catch {
      setFeedback("Unable to update settings.");
    }
  };

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <AdminSubnav />
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="editorial-stamp-mustard mb-2">
            PORTAL &amp; ADMIN CREDENTIALS
          </span>
          <h1 className="font-anton text-4xl uppercase tracking-[0.06em] text-[#171717] mt-1">
            Portal Configuration &amp; Admin Login Settings
          </h1>
        </div>
        {feedback && (
          <div className="p-4 border-2 border-[#B52D27] bg-[#FAF9F5] text-xs text-[#171717]">
            {feedback}
          </div>
        )}
        {settings && (
          <form onSubmit={handleSave} className="paper-sheet p-8 space-y-6">
            <div className="border-b-2 border-[#171717] pb-4">
              <h2 className="font-oswald text-sm font-bold uppercase tracking-[0.16em] text-[#B52D27]">
                Single Administrator Login Credentials
              </h2>
              <p className="text-xs text-[#44413E] mt-1">
                Configure the unified Administrator username and password used at /admin/login.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-editorial">Administrator Username</label>
                <input
                  type="text"
                  value={settings.admin_username || "abhayasfi"}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      admin_username: e.target.value,
                    }))
                  }
                  className="input-editorial"
                />
              </div>
              <div>
                <label className="label-editorial">
                  New Administrator Password (Optional)
                </label>
                <input
                  type="password"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="input-editorial"
                />
              </div>
            </div>

            <div className="border-b-2 border-[#171717] pb-4 pt-4">
              <h2 className="font-oswald text-sm font-bold uppercase tracking-[0.16em] text-[#171717]">
                Institutional Configuration
              </h2>
            </div>

            <div>
              <label className="label-editorial">Institution Name</label>
              <input
                type="text"
                value={settings.institution_name || ""}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    institution_name: e.target.value,
                  }))
                }
                className="input-editorial"
              />
            </div>
            <div>
              <label className="label-editorial">Official Attribution</label>
              <input
                type="text"
                value={settings.initiative_subtitle || ""}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    initiative_subtitle: e.target.value,
                  }))
                }
                className="input-editorial"
              />
            </div>
            <div>
              <label className="label-editorial">Official Contact Email</label>
              <input
                type="email"
                value={settings.official_contact_email || ""}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    official_contact_email: e.target.value,
                  }))
                }
                className="input-editorial"
              />
            </div>
            <button type="submit" className="btn-primary">
              Save Configuration &amp; Credentials
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
