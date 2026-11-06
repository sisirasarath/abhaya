import React, { useEffect, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import {
  FilePlus,
  Home,
  FileText,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

const FALLBACK_CATEGORIES = [
  {
    code: "HOSTEL",
    name: "Hostel Issues",
    subcategories: [
      "Water supply",
      "Electricity",
      "Sanitation",
      "Food quality",
      "Cleanliness",
      "Security",
      "Warden-related concerns",
      "Harassment",
      "Maintenance",
      "Inadequate facilities",
      "Other hostel problems",
    ],
  },
  {
    code: "PERSONAL_SAFETY",
    name: "Personal Safety",
    subcategories: [
      "Harassment",
      "Stalking",
      "Inappropriate behaviour",
      "Verbal abuse",
      "Threatening behaviour",
      "Unsafe surroundings",
      "Transportation safety",
      "Online harassment",
      "Other concerns",
    ],
  },
  {
    code: "COLLEGE_ISSUES",
    name: "College Issues",
    subcategories: [
      "Campus safety",
      "Inadequate security",
      "Inappropriate behaviour",
      "Washroom safety",
      "Poor lighting",
      "Infrastructure-related safety concerns",
    ],
  },
  {
    code: "EMERGENCY_URGENT",
    name: "Urgent Concerns",
    subcategories: [
      "Immediate personal safety concerns",
      "Threatening situations",
      "Urgent assistance requests",
      "Other urgent concerns",
    ],
  },
];

const STATUS_LABELS = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ASSIGNED: "Assigned",
  ACTION_IN_PROGRESS: "Action in Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const formatStatusBadge = (status) => {
  const label = STATUS_LABELS[status] || status;
  const isResolved = status === "RESOLVED" || status === "CLOSED";
  return (
    <span
      className={`inline-block font-typewriter text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 border ${
        isResolved
          ? "bg-[#171717] text-[#FAF9F5] border-[#171717]"
          : "bg-[#F3EBDD] text-[#B52D27] border-[#B52D27]/60"
      }`}
    >
      {label}
    </span>
  );
};

const StudentSubnav = () => {
  const links = [
    { to: "/student/dashboard", label: "Dashboard" },
    { to: "/student/report", label: "Report an Issue" },
    { to: "/student/report-hostel", label: "Hostel Complaints" },
    { to: "/student/complaints", label: "My Complaints" },
    { to: "/student/notifications", label: "Notifications" },
    { to: "/student/profile", label: "Profile" },
  ];

  return (
    <div className="border-b-2 border-[#171717] bg-[#FAF9F5]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center gap-6 overflow-x-auto py-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `font-oswald text-xs font-bold uppercase tracking-[0.16em] whitespace-nowrap py-1 ${
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
   8. STUDENT DASHBOARD (/student/dashboard)
   ============================================================================ */
export const StudentDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/student/dashboard/")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.summary || {
    total_complaints: 0,
    pending_submitted: 0,
    under_review_active: 0,
    resolved_closed: 0,
  };
  const recent = data?.recent_complaints || [];
  const studentName =
    data?.student?.full_name || user?.full_name || "Student";

  const mainOptions = [
    {
      title: "Report an Issue",
      desc: "Submit a safety, campus, or personal concern.",
      to: "/student/report",
      icon: FilePlus,
    },
    {
      title: "Hostel Complaints",
      desc: "Report hostel water, electricity, mess, or security issues.",
      to: "/student/report-hostel",
      icon: Home,
    },
    {
      title: "My Complaints",
      desc: "View and track your submitted complaints.",
      to: "/student/complaints",
      icon: FileText,
    },
    {
      title: "Emergency Helplines",
      desc: "Access 112, 181, 1091 and campus support numbers.",
      to: "/emergency-helplines",
      icon: PhoneCall,
    },
  ];

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <StudentSubnav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-12">
        {/* Welcome Header */}
        <div className="border-b-2 border-[#171717] pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-typewriter text-[10px] uppercase tracking-[0.22em] text-[#B52D27] mb-2">
              ABHAYA Student Portal • An Initiative by SFI MACE Unit
            </p>
            <h1 className="font-cormorant text-4xl sm:text-5xl tracking-[0.06em] text-[#171717]">
              Welcome, {studentName}
            </h1>
          </div>
          <Link to="/student/report" className="btn-primary">
            Report an Issue
          </Link>
        </div>

        {/* Four Main Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <Link
                key={opt.title}
                to={opt.to}
                className="paper-sheet p-6 hover:border-[#171717] transition-all flex flex-col justify-between group"
              >
                <div>
                  <Icon
                    className="w-5 h-5 text-[#B52D27] mb-5"
                    strokeWidth={1.4}
                  />
                  <h2 className="font-typewriter text-xs uppercase tracking-[0.16em] text-[#171717] mb-2">
                    {opt.title}
                  </h2>
                  <p className="text-xs text-[#44413E] leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 font-typewriter text-[10px] uppercase tracking-[0.18em] text-[#B52D27]">
                  Open <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>

        {/* Small Complaint Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Complaints", value: stats.total_complaints },
            { label: "Submitted", value: stats.pending_submitted },
            { label: "Under Review", value: stats.under_review_active },
            { label: "Resolved", value: stats.resolved_closed },
          ].map((item) => (
            <div key={item.label} className="paper-sheet p-6">
              <p className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-[#44413E] mb-2">
                {item.label}
              </p>
              <p className="font-cormorant text-5xl text-[#171717]">
                {loading ? "—" : item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Complaints */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cormorant text-3xl uppercase tracking-[0.08em] text-[#171717]">
              Recent Complaints
            </h2>
            <Link
              to="/student/complaints"
              className="font-typewriter text-[11px] uppercase tracking-[0.16em] text-[#B52D27] underline underline-offset-4"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-[#44413E]">Loading complaints...</p>
          ) : recent.length === 0 ? (
            <div className="paper-sheet p-10 text-center space-y-3">
              <p className="text-sm text-[#44413E]">
                You have not submitted any complaints yet.
              </p>
              <Link to="/student/report" className="btn-secondary">
                Report an Issue
              </Link>
            </div>
          ) : (
            <div className="paper-sheet overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D9D5CE] bg-[#F3EBDD] font-typewriter text-[10px] uppercase tracking-[0.18em] text-[#44413E]">
                    <th className="py-3.5 px-5">Complaint ID</th>
                    <th className="py-3.5 px-5">Title</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D5CE] text-sm">
                  {recent.map((c) => (
                    <tr key={c.complaint_id} className="hover:bg-[#F3EBDD]/60">
                      <td className="py-4 px-5 font-typewriter text-xs text-[#171717]">
                        {c.complaint_id}
                      </td>
                      <td className="py-4 px-5 text-[#171717]">{c.title}</td>
                      <td className="py-4 px-5 text-xs text-[#44413E]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5">{formatStatusBadge(c.status)}</td>
                      <td className="py-4 px-5 text-right">
                        <Link
                          to={`/student/complaints/${c.complaint_id}`}
                          className="font-typewriter text-[11px] uppercase tracking-[0.16em] text-[#B52D27] underline underline-offset-4"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   9. REPORT AN ISSUE (/student/report, /student/report-hostel, /student/report-harassment)
   ============================================================================ */
const BaseReportForm = ({ defaultCategoryCode = "HOSTEL", pageTitle = "Report an Issue" }) => {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [form, setForm] = useState({
    title: "",
    category_code: defaultCategoryCode,
    subcategory: "",
    description: "",
    incident_location: "",
    incident_date: new Date().toISOString().split("T")[0],
    incident_time: "",
    is_currently_occurring: false,
    immediate_assistance_required: false,
    preferred_contact_method: "PORTAL_ONLY",
    confidentiality_preference: "CONFIDENTIAL",
  });
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  useEffect(() => {
    apiClient
      .get("/public/categories/")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const currentCat =
    categories.find((c) => c.code === form.category_code) || categories[0];

  useEffect(() => {
    if (currentCat && currentCat.subcategories?.length > 0) {
      setForm((prev) => ({
        ...prev,
        subcategory: currentCat.subcategories[0],
      }));
    }
  }, [form.category_code, categories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (attachment) {
        fd.append("attachments", attachment);
      }
      const res = await apiClient.post("/student/complaints/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmittedComplaint(res.data.complaint || res.data);
    } catch (err) {
      const data = err.response?.data || {};
      const msg =
        data.error ||
        (typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Unable to submit complaint.");
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <StudentSubnav />
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8">
          <p className="font-typewriter text-[10px] uppercase tracking-[0.22em] text-[#B52D27] mb-2">
            Confidential Grievance Filing
          </p>
          <h1 className="font-cormorant text-4xl sm:text-5xl uppercase tracking-[0.08em] text-[#171717]">
            {pageTitle}
          </h1>
        </div>

        {/* Immediate Danger Notice */}
        <div className="mb-8 p-5 border border-[#B52D27] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-[#44413E] leading-relaxed">
            <strong className="font-typewriter uppercase tracking-[0.14em] text-[#B52D27] block mb-1">
              For Immediate Danger
            </strong>
            Website submissions are reviewed by campus authorities and are not live emergency-service calls. If you are in immediate danger, please dial{" "}
            <a href="tel:112" className="underline font-semibold text-[#171717]">
              112
            </a>{" "}
            or{" "}
            <a href="tel:181" className="underline font-semibold text-[#171717]">
              181
            </a>{" "}
            immediately.
          </div>
          <Link to="/emergency-helplines" className="btn-secondary shrink-0 py-2 px-4">
            Helplines
          </Link>
        </div>

        {submittedComplaint ? (
          <div className="relative paper-sheet p-10 text-center space-y-5">
            <div className="paper-tape -top-3 left-1/2 -translate-x-1/2" />
            <CheckCircle2 className="w-8 h-8 text-[#B52D27] mx-auto" strokeWidth={1.5} />
            <h2 className="font-cormorant text-3xl uppercase tracking-[0.08em] text-[#171717]">
              Concern Recorded
            </h2>
            <p className="text-sm text-[#44413E]">
              Your unique Complaint ID is{" "}
              <span className="font-typewriter font-semibold text-[#171717]">
                {submittedComplaint.complaint_id}
              </span>
              .
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link
                to={`/student/complaints/${submittedComplaint.complaint_id}`}
                className="btn-primary"
              >
                Track Complaint
              </Link>
              <Link to="/student/dashboard" className="btn-secondary">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="relative paper-sheet p-8 sm:p-10 space-y-6"
          >
            <div className="paper-tape -top-3 left-1/2 -translate-x-1/2" />
            {errorMsg && (
              <div className="p-4 border border-[#B52D27] bg-[#F3EBDD] text-xs text-[#B52D27]">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="label-editorial">Complaint Title *</label>
              <input
                type="text"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                placeholder="Brief summary of the concern"
                className="input-editorial"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-editorial">Category *</label>
                <select
                  name="category_code"
                  value={form.category_code}
                  onChange={handleChange}
                  className="input-editorial"
                >
                  {categories.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-editorial">Subcategory *</label>
                <select
                  name="subcategory"
                  value={form.subcategory}
                  onChange={handleChange}
                  className="input-editorial"
                >
                  {(currentCat?.subcategories || []).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label-editorial">Detailed Description *</label>
              <textarea
                name="description"
                rows={5}
                required
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what happened, relevant details, and any support needed..."
                className="input-editorial"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="label-editorial">Incident Location *</label>
                <input
                  type="text"
                  name="incident_location"
                  required
                  value={form.incident_location}
                  onChange={handleChange}
                  placeholder="e.g. Ladies Hostel / Main Block"
                  className="input-editorial"
                />
              </div>

              <div>
                <label className="label-editorial">Date of Incident *</label>
                <input
                  type="date"
                  name="incident_date"
                  required
                  value={form.incident_date}
                  onChange={handleChange}
                  className="input-editorial"
                />
              </div>

              <div>
                <label className="label-editorial">Approximate Time</label>
                <input
                  type="text"
                  name="incident_time"
                  value={form.incident_time}
                  onChange={handleChange}
                  placeholder="e.g. 08:30 PM"
                  className="input-editorial"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-4 border border-[#D9D5CE] bg-[#F3EBDD] cursor-pointer text-xs text-[#171717]">
                <input
                  type="checkbox"
                  name="is_currently_occurring"
                  checked={form.is_currently_occurring}
                  onChange={handleChange}
                  className="accent-[#171717] w-4 h-4"
                />
                <span>Is the issue currently occurring?</span>
              </label>

              <label className="flex items-center gap-3 p-4 border border-[#D9D5CE] bg-[#F3EBDD] cursor-pointer text-xs text-[#171717]">
                <input
                  type="checkbox"
                  name="immediate_assistance_required"
                  checked={form.immediate_assistance_required}
                  onChange={handleChange}
                  className="accent-[#171717] w-4 h-4"
                />
                <span>Is immediate assistance required?</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-editorial">Preferred Contact Method *</label>
                <select
                  name="preferred_contact_method"
                  value={form.preferred_contact_method}
                  onChange={handleChange}
                  className="input-editorial"
                >
                  <option value="PORTAL_ONLY">Portal Updates Only</option>
                  <option value="EMAIL">Registered Email</option>
                  <option value="PHONE">Phone Call</option>
                  <option value="IN_PERSON_ICC">In-Person Meeting (Women&apos;s Cell / ICC)</option>
                </select>
              </div>

              <div>
                <label className="label-editorial">Confidentiality Preference *</label>
                <select
                  name="confidentiality_preference"
                  value={form.confidentiality_preference}
                  onChange={handleChange}
                  className="input-editorial"
                >
                  <option value="CONFIDENTIAL">
                    Keep my identity confidential (Redacted for general handlers)
                  </option>
                  <option value="DISCLOSED">
                    Share my identity with assigned redressal authority
                  </option>
                </select>
              </div>
            </div>

            <div className="newspaper-clipping p-4 text-xs text-[#44413E] leading-relaxed">
              <strong className="text-[#171717] font-medium">
                Who can access this information:
              </strong>{" "}
              When you choose Confidential, your name, admission number, email, and phone number are redacted at the server level for general handlers and hostel wardens, and remain visible only to the Super Administrator and Women&apos;s Cell / ICC Presiding Officer.
            </div>

            <div>
              <label className="label-editorial">
                Optional Image / Document Upload (JPG, PNG, WEBP, PDF)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="input-editorial text-xs file:mr-4 file:py-1.5 file:px-3 file:border file:border-[#171717] file:bg-[#F3EBDD] file:text-[#171717] file:font-typewriter file:text-[10px] file:uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Submitting Concern..." : "Submit Complaint"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const ReportIssuePage = () => (
  <BaseReportForm defaultCategoryCode="COLLEGE_ISSUES" pageTitle="Report an Issue" />
);

export const ReportHostelIssuePage = () => (
  <BaseReportForm defaultCategoryCode="HOSTEL" pageTitle="Hostel Complaints" />
);

export const ReportHarassmentPage = () => (
  <BaseReportForm defaultCategoryCode="PERSONAL_SAFETY" pageTitle="Personal Safety & Harassment Reporting" />
);

/* ============================================================================
   10. MY COMPLAINTS PAGE (/student/complaints)
   ============================================================================ */
export const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/student/complaints/")
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setComplaints(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <StudentSubnav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#171717] pb-6">
          <div>
            <p className="font-typewriter text-[10px] uppercase tracking-[0.22em] text-[#B52D27] mb-2">
              Grievance Tracking
            </p>
            <h1 className="font-cormorant text-4xl sm:text-5xl uppercase tracking-[0.08em] text-[#171717]">
              My Complaints
            </h1>
          </div>
          <Link to="/student/report" className="btn-primary">
            Report New Issue
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-[#44413E]">Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <div className="paper-sheet p-12 text-center space-y-4">
            <p className="text-sm text-[#44413E]">No complaints submitted yet.</p>
            <Link to="/student/report" className="btn-primary">
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="paper-sheet overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D9D5CE] bg-[#F3EBDD] font-typewriter text-[10px] uppercase tracking-[0.18em] text-[#44413E]">
                  <th className="py-3.5 px-5">Complaint ID</th>
                  <th className="py-3.5 px-5">Title</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Date Submitted</th>
                  <th className="py-3.5 px-5">Current Status</th>
                  <th className="py-3.5 px-5">Last Updated</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D5CE] text-sm">
                {complaints.map((c) => (
                  <tr key={c.complaint_id} className="hover:bg-[#F3EBDD]/60">
                    <td className="py-4 px-5 font-typewriter text-xs text-[#171717]">
                      {c.complaint_id}
                    </td>
                    <td className="py-4 px-5 text-[#171717]">{c.title}</td>
                    <td className="py-4 px-5 text-xs text-[#44413E]">
                      {c.category_name || c.category_code}
                    </td>
                    <td className="py-4 px-5 text-xs text-[#44413E]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5">{formatStatusBadge(c.status)}</td>
                    <td className="py-4 px-5 text-xs text-[#44413E]">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        to={`/student/complaints/${c.complaint_id}`}
                        className="font-typewriter text-[11px] uppercase tracking-[0.16em] text-[#B52D27] underline underline-offset-4"
                      >
                        View Timeline
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   12. COMPLAINT DETAILS & VERTICAL TIMELINE (/student/complaints/:complaintId)
   ============================================================================ */
export const StudentComplaintDetailPage = () => {
  const { complaintId } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    apiClient
      .get(`/student/complaints/${complaintId}/`)
      .then((res) => setComplaint(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [complaintId]);

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await apiClient.post(`/student/complaints/${complaintId}/`, {
        message: replyText.trim(),
      });
      setReplyText("");
      fetchDetail();
    } catch {
      // handled silently
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <StudentSubnav />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 space-y-10">
        <Link
          to="/student/complaints"
          className="font-typewriter text-xs uppercase tracking-[0.16em] text-[#44413E] hover:text-[#171717]"
        >
          ← Back to My Complaints
        </Link>

        {loading ? (
          <p className="text-sm text-[#44413E]">Loading complaint details...</p>
        ) : !complaint ? (
          <p className="text-sm text-[#44413E]">Complaint not found.</p>
        ) : (
          <>
            {/* Complaint Header & Full Details */}
            <div className="paper-sheet p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9D5CE] pb-5">
                <div>
                  <p className="font-typewriter text-xs uppercase tracking-[0.18em] text-[#B52D27]">
                    {complaint.complaint_id} • {complaint.category_name || complaint.category_code} — {complaint.subcategory}
                  </p>
                  <h1 className="font-cormorant text-3xl text-[#171717] mt-1">
                    {complaint.title}
                  </h1>
                </div>
                {formatStatusBadge(complaint.status)}
              </div>

              <p className="text-sm text-[#44413E] leading-relaxed whitespace-pre-line">
                {complaint.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#D9D5CE] text-xs">
                <div>
                  <span className="text-[#44413E] block">Location</span>
                  <span className="text-[#171717] font-medium">
                    {complaint.incident_location}
                  </span>
                </div>
                <div>
                  <span className="text-[#44413E] block">Incident Date</span>
                  <span className="text-[#171717] font-medium">
                    {complaint.incident_date} {complaint.incident_time}
                  </span>
                </div>
                <div>
                  <span className="text-[#44413E] block">Assigned Authority</span>
                  <span className="text-[#171717] font-medium">
                    {complaint.assigned_authority || "Pending Assignment"}
                  </span>
                </div>
                <div>
                  <span className="text-[#44413E] block">Confidentiality</span>
                  <span className="text-[#171717] font-medium">
                    {complaint.confidentiality_preference}
                  </span>
                </div>
              </div>

              {complaint.resolution_details && (
                <div className="newspaper-clipping p-5 border-l-2 border-l-[#B52D27] space-y-1">
                  <p className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-[#B52D27]">
                    Official Resolution Details
                  </p>
                  <p className="text-xs text-[#171717] leading-relaxed">
                    {complaint.resolution_details}
                  </p>
                </div>
              )}
            </div>

            {/* Simple Vertical Timeline */}
            <div className="paper-sheet p-8 space-y-6">
              <h2 className="font-cormorant text-3xl uppercase tracking-[0.08em] text-[#171717]">
                Status History &amp; Updates
              </h2>

              <div className="relative pl-6 border-l border-[#171717] space-y-8">
                {(complaint.updates || []).map((u) => (
                  <div key={u.id} className="relative">
                    <span className="w-2.5 h-2.5 bg-[#B52D27] rounded-full absolute -left-[29px] top-1.5" />
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="font-typewriter text-xs uppercase tracking-[0.14em] text-[#171717]">
                        {u.author_display_name || u.author_role}
                      </span>
                      <span className="text-[11px] text-[#44413E]">
                        {new Date(u.created_at).toLocaleString()}
                      </span>
                    </div>
                    {u.new_status && (
                      <p className="font-typewriter text-[10px] uppercase tracking-[0.16em] text-[#B52D27] mb-1">
                        Status: {STATUS_LABELS[u.new_status] || u.new_status}
                      </p>
                    )}
                    <p className="text-sm text-[#44413E] leading-relaxed">
                      {u.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Student Follow-up Note */}
              <form
                onSubmit={handleFollowUp}
                className="pt-6 border-t border-[#D9D5CE] space-y-3"
              >
                <label className="label-editorial">
                  Add Follow-Up Information for Redressal Officer
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide additional context or updates..."
                  className="input-editorial"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary py-2.5 px-6"
                >
                  {sending ? "Sending..." : "Post Update"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   13. STUDENT PROFILE PAGE (/student/profile)
   ============================================================================ */
export const StudentProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState("");
  const [residenceType, setResidenceType] = useState("HOSTEL");
  const [hostelName, setHostelName] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    apiClient
      .get("/student/profile/")
      .then((res) => {
        setProfile(res.data);
        setPhone(res.data.phone_number || "");
        setResidenceType(res.data.residence_type || "HOSTEL");
        setHostelName(res.data.hostel_name || "");
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback("");
    try {
      const res = await apiClient.patch("/student/profile/", {
        phone_number: phone,
        residence_type: residenceType,
        hostel_name: hostelName,
      });
      setProfile(res.data);
      setFeedback("Profile updated.");
    } catch {
      setFeedback("Could not update profile.");
    }
  };

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <StudentSubnav />
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <div>
          <p className="font-typewriter text-[10px] uppercase tracking-[0.22em] text-[#B52D27] mb-2">
            Verified Student Account
          </p>
          <h1 className="font-cormorant text-4xl uppercase tracking-[0.08em] text-[#171717]">
            Student Profile
          </h1>
        </div>

        {profile && (
          <div className="paper-sheet p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-[#D9D5CE] text-sm">
              <div>
                <span className="text-xs text-[#44413E] block">Full Name</span>
                <span className="font-medium text-[#171717]">
                  {profile.full_name}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#44413E] block">Registered Email</span>
                <span className="font-medium text-[#171717]">{profile.email}</span>
              </div>
              <div>
                <span className="text-xs text-[#44413E] block">
                  Admission Number
                </span>
                <span className="font-medium text-[#171717]">
                  {profile.admission_number}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#44413E] block">Department</span>
                <span className="font-medium text-[#171717]">
                  {profile.department} ({profile.year_semester})
                </span>
              </div>
            </div>

            {feedback && (
              <div className="p-3 border border-[#D9D5CE] bg-[#F3EBDD] text-xs text-[#171717]">
                {feedback}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-editorial">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-editorial"
                  />
                </div>
                <div>
                  <label className="label-editorial">Residence Type</label>
                  <select
                    value={residenceType}
                    onChange={(e) => setResidenceType(e.target.value)}
                    className="input-editorial"
                  >
                    <option value="HOSTEL">Hostel Resident</option>
                    <option value="DAY_SCHOLAR">Day Scholar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label-editorial">Hostel Name</label>
                <input
                  type="text"
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  className="input-editorial"
                />
              </div>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   14. NOTIFICATIONS PAGE (/student/notifications)
   ============================================================================ */
export const StudentNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = () => {
    apiClient
      .get("/student/notifications/")
      .then((res) => {
        setNotifications(res.data.notifications || res.data || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    await apiClient.post("/student/notifications/", { mark_all: true });
    loadNotifications();
  };

  return (
    <div className="bg-[#F3EBDD] text-[#171717] min-h-[82vh]">
      <StudentSubnav />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        <div className="flex items-center justify-between border-b-2 border-[#171717] pb-6">
          <h1 className="font-cormorant text-4xl uppercase tracking-[0.08em] text-[#171717]">
            Notifications
          </h1>
          <button onClick={markAllRead} className="btn-muted">
            Mark All as Read
          </button>
        </div>

        {notifications.length === 0 ? (
          <p className="text-sm text-[#44413E]">No notifications yet.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`paper-sheet p-5 ${
                  !n.is_read ? "border-l-2 border-l-[#B52D27]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className="font-typewriter text-xs uppercase tracking-[0.14em] text-[#171717]">
                    {n.title}
                  </h2>
                  <span className="text-[11px] text-[#44413E]">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[#44413E] leading-relaxed">
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
