import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, PhoneCall, CheckCircle2, AlertCircle } from "lucide-react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { AbhayaOfficialLogo } from "../components/BrandAssets";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Data Science & Artificial Intelligence",
  "Master of Computer Applications (MCA)",
  "M.Tech / Postgraduate Studies",
];

const SEMESTERS = [
  "S1/S2 (1st Year)",
  "S3/S4 (2nd Year)",
  "S5/S6 (3rd Year)",
  "S7/S8 (4th Year)",
  "PG 1st Year",
  "PG 2nd Year",
];

/* ============================================================================
   1. STUDENT LOGIN PAGE (/login)
   ============================================================================ */
export const StudentLoginPage = () => {
  const { loginStudent } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [verificationState, setVerificationState] = useState(null);

  // Forgot / Reset Password State
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetFeedback, setResetFeedback] = useState("");
  const [resetError, setResetError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setVerificationState(null);
    setLoading(true);
    try {
      await loginStudent(email.trim(), password);
      navigate("/student/dashboard");
    } catch (err) {
      const data = err.response?.data || {};
      const statusFlag =
        data.verification_status ||
        data.account_status ||
        data.details?.verification_status;
      if (statusFlag) {
        setVerificationState(statusFlag);
      }
      setErrorMsg(
        data.message ||
          (typeof data.error === "string" ? data.error : "") ||
          data.detail ||
          "Unable to sign in. Please check your registered email (or admission number) and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetFeedback("");
    try {
      const res = await apiClient.post("/auth/password-reset/request/", {
        email: resetEmail.trim(),
      });
      setResetFeedback(
        res.data.message || "Password reset instructions generated."
      );
      if (res.data.reset_token_preview) {
        setResetToken(res.data.reset_token_preview);
      }
      setResetStep(2);
    } catch (err) {
      setResetError(
        err.response?.data?.error || "Could not process password reset request."
      );
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setResetError("");
    try {
      const res = await apiClient.post("/auth/password-reset/confirm/", {
        email: resetEmail.trim(),
        token: resetToken.trim(),
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      });
      setResetFeedback(res.data.message || "Password reset successful.");
      setTimeout(() => {
        setResetMode(false);
        setResetStep(1);
        setEmail(resetEmail);
      }, 1200);
    } catch (err) {
      setResetError(
        err.response?.data?.error || "Invalid reset token or password mismatch."
      );
    }
  };

  return (
    <div className="min-h-[82vh] bg-[#F3EBDD] text-[#171717] py-16 px-6 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-10">
          <AbhayaOfficialLogo className="w-36 mx-auto mb-4" />
          <span className="editorial-stamp-burgundy mb-2">
            VERIFIED STUDENT ACCESS
          </span>
          <h1 className="font-anton text-4xl sm:text-5xl tracking-[0.06em] uppercase text-[#171717] mt-2">
            Student Login
          </h1>
          <p className="font-caveat text-2xl text-[#B52D27] font-bold mt-1">
            An Initiative by SFI MACE Unit
          </p>
        </div>

        {!resetMode ? (
          <div className="relative paper-sheet p-8 sm:p-10">
            <div className="paper-tape -top-3 left-1/2 -translate-x-1/2" />

            {errorMsg && (
              <div className="mb-6 p-4 border border-[#783D43] bg-[#F5F0E8] text-xs text-[#171717] space-y-1">
                <div className="flex items-center gap-2 font-typewriter uppercase tracking-[0.15em] text-[#783D43]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {verificationState === "PENDING"
                      ? "Account Pending Verification"
                      : verificationState === "REJECTED"
                      ? "Registration Not Approved"
                      : "Authentication Notice"}
                  </span>
                </div>
                <p className="text-[#44413E] leading-relaxed pl-6">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-editorial">College Email</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu.in"
                  className="input-editorial"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-typewriter text-[11px] uppercase tracking-[0.16em] text-[#171717]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode(true);
                      setResetEmail(email);
                    }}
                    className="text-xs text-[#783D43] hover:text-[#171717] underline underline-offset-4"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-editorial pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44413E] hover:text-[#171717]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? "Signing In..." : "Login"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#D9D5CE] flex items-center justify-between text-xs text-[#44413E]">
              <span>New student?</span>
              <Link
                to="/register"
                className="font-typewriter uppercase tracking-[0.16em] text-[#B52D27] underline underline-offset-4"
              >
                Create Account
              </Link>
            </div>
          </div>
        ) : (
          /* Forgot / Reset Password View */
          <div className="relative paper-sheet p-8 sm:p-10 space-y-5">
            <div className="paper-tape -top-3 left-1/2 -translate-x-1/2" />
            <h2 className="font-cormorant text-3xl uppercase tracking-[0.08em] text-[#171717]">
              Reset Password
            </h2>

            {resetError && (
              <div className="p-3 border border-[#783D43] bg-[#F5F0E8] text-xs text-[#783D43]">
                {resetError}
              </div>
            )}
            {resetFeedback && (
              <div className="p-3 border border-[#D9D5CE] bg-[#F5F0E8] text-xs text-[#171717]">
                {resetFeedback}
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="label-editorial">College Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="student@college.edu.in"
                    className="input-editorial"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Send Reset Token
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div>
                  <label className="label-editorial">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="input-editorial"
                  />
                </div>
                <div>
                  <label className="label-editorial">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-editorial"
                  />
                </div>
                <div>
                  <label className="label-editorial">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input-editorial"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Confirm New Password
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setResetMode(false);
                setResetStep(1);
              }}
              className="text-xs font-typewriter uppercase tracking-[0.16em] text-[#44413E] hover:text-[#171717]"
            >
              ← Back to Login
            </button>
          </div>
        )}

        {/* Prominent Emergency Helplines Link */}
        <div className="mt-8 text-center">
          <Link
            to="/emergency-helplines"
            className="inline-flex items-center gap-2 font-typewriter text-xs uppercase tracking-[0.16em] text-[#783D43] underline underline-offset-4 hover:text-[#171717]"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Emergency Helplines (112 / 181 / 1091) — No Login Required
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. STUDENT REGISTRATION PAGE (/register)
   ============================================================================ */
export const StudentRegisterPage = () => {
  const [form, setForm] = useState({
    full_name: "",
    gender: "",
    email: "",
    admission_number: "",
    department: DEPARTMENTS[0],
    year_semester: SEMESTERS[2],
    phone_number: "",
    residence_type: "HOSTEL",
    hostel_name: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [registeredResult, setRegisteredResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isFemale = form.gender === "FEMALE";
  const isMale = form.gender === "MALE";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (form.gender !== "FEMALE") {
      setErrorMsg(
        "ABHAYA is a dedicated women's safety portal exclusively for female students. Only female students are permitted to submit registration."
      );
      return;
    }

    if (form.password !== form.confirm_password) {
      setErrorMsg("Password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      const res = await apiClient.post("/auth/student/register/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRegisteredResult(res.data);
    } catch (err) {
      const data = err.response?.data || {};
      const firstFieldError =
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Registration could not be completed.";
      setErrorMsg(data.error || firstFieldError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F3EBDD] text-[#171717] py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <AbhayaOfficialLogo className="w-36 mx-auto mb-4" />
          <span className="editorial-stamp-burgundy mb-2">
            EXCLUSIVELY FOR FEMALE STUDENTS
          </span>
          <h1 className="font-anton text-4xl sm:text-5xl tracking-[0.06em] uppercase text-[#171717] mt-2">
            Student Registration
          </h1>
          <p className="font-caveat text-2xl text-[#B52D27] font-bold mt-1">
            An Initiative by SFI MACE Unit
          </p>
        </div>

        {registeredResult ? (
          <div className="relative paper-sheet p-10 text-center space-y-5">
            <div className="paper-tape -top-3 left-1/2 -translate-x-1/2" />
            <CheckCircle2
              className="w-8 h-8 text-[#B52D27] mx-auto"
              strokeWidth={1.5}
            />
            <h2 className="font-anton text-3xl uppercase tracking-[0.06em] text-[#171717]">
              Account Created Successfully
            </h2>
            <p className="text-sm text-[#44413E] leading-relaxed max-w-md mx-auto">
              {registeredResult.message ||
                "Your female student account is active and ready. You can sign in to the student portal immediately."}
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link to="/login" className="btn-primary">
                Proceed to Student Login
              </Link>
              <Link to="/emergency-helplines" className="btn-secondary">
                Emergency Helplines
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative paper-sheet p-8 sm:p-10">
            <div className="paper-tape -top-3 left-1/2 -translate-x-1/2" />

            {errorMsg && (
              <div className="mb-6 p-4 border-2 border-[#B52D27] bg-[#F3EBDD] text-xs text-[#B52D27]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Gender Eligibility Gate (Female / Male) */}
              <div className="p-5 border-2 border-[#171717] bg-[#F3EBDD] space-y-3">
                <label className="label-editorial mb-1">
                  Select Gender * (Registration is exclusively for Female students)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, gender: "FEMALE" }))
                    }
                    className={`py-3 px-4 border-2 font-oswald text-sm font-bold uppercase tracking-[0.14em] transition-all ${
                      isFemale
                        ? "bg-[#171717] text-[#FAF9F5] border-[#171717] shadow-[3px_3px_0px_#B52D27]"
                        : "bg-[#FAF9F5] text-[#171717] border-[#171717] hover:bg-[#D5B94D]/30"
                    }`}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, gender: "MALE" }))
                    }
                    className={`py-3 px-4 border-2 font-oswald text-sm font-bold uppercase tracking-[0.14em] transition-all ${
                      isMale
                        ? "bg-[#B52D27] text-[#FAF9F5] border-[#171717]"
                        : "bg-[#FAF9F5] text-[#171717] border-[#171717] hover:bg-[#D9D5CE]/50"
                    }`}
                  >
                    Male
                  </button>
                </div>

                {isMale && (
                  <div className="p-3.5 border-2 border-[#B52D27] bg-[#FAF9F5] text-xs text-[#B52D27] font-medium">
                    Access Denied: ABHAYA is a dedicated women&apos;s safety and support portal exclusively for female students. Male students cannot submit registration.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-editorial">Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="input-editorial"
                  />
                </div>

                <div>
                  <label className="label-editorial">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@college.edu.in"
                    className="input-editorial"
                  />
                </div>

                <div>
                  <label className="label-editorial">
                    Admission / Registration Number *
                  </label>
                  <input
                    type="text"
                    name="admission_number"
                    required
                    value={form.admission_number}
                    onChange={handleChange}
                    placeholder="e.g. MAC23CD057"
                    className="input-editorial uppercase"
                  />
                </div>

                <div>
                  <label className="label-editorial">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone_number"
                    required
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder="+91 9847000000"
                    className="input-editorial"
                  />
                </div>

                <div>
                  <label className="label-editorial">Department *</label>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="input-editorial"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-editorial">
                    Current Semester / Year *
                  </label>
                  <select
                    name="year_semester"
                    value={form.year_semester}
                    onChange={handleChange}
                    className="input-editorial"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-editorial">
                    Hostel Resident or Day Scholar *
                  </label>
                  <select
                    name="residence_type"
                    value={form.residence_type}
                    onChange={handleChange}
                    className="input-editorial"
                  >
                    <option value="HOSTEL">Hostel Resident</option>
                    <option value="DAY_SCHOLAR">Day Scholar</option>
                  </select>
                </div>

                <div>
                  <label className="label-editorial">
                    Hostel Name{" "}
                    {form.residence_type === "HOSTEL" ? "*" : "(If Applicable)"}
                  </label>
                  <input
                    type="text"
                    name="hostel_name"
                    required={form.residence_type === "HOSTEL"}
                    value={form.hostel_name}
                    onChange={handleChange}
                    placeholder={
                      form.residence_type === "HOSTEL"
                        ? "e.g. Ladies Hostel Block A"
                        : "Not applicable for Day Scholar"
                    }
                    className="input-editorial"
                  />
                </div>

                <div>
                  <label className="label-editorial">Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    className="input-editorial"
                  />
                </div>

                <div>
                  <label className="label-editorial">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    required
                    minLength={8}
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="input-editorial"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isFemale}
                className={`btn-primary w-full ${
                  !isFemale ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading
                  ? "Creating Account..."
                  : isMale
                  ? "Registration Restricted to Female Students Only"
                  : !isFemale
                  ? "Select 'Female' Above to Enable Registration"
                  : "Register Account"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#D9D5CE] flex items-center justify-between text-xs text-[#44413E]">
              <span>Already registered?</span>
              <Link
                to="/login"
                className="font-typewriter uppercase tracking-[0.16em] text-[#B52D27] underline underline-offset-4"
              >
                Student Login
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/emergency-helplines"
            className="inline-flex items-center gap-2 font-typewriter text-xs uppercase tracking-[0.18em] text-[#783D43] underline underline-offset-4 hover:text-[#171717]"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Emergency Helplines (112 / 181 / 1091)
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. ADMINISTRATOR LOGIN PAGE (/admin/login)
   ============================================================================ */
export const AdminLoginPage = () => {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await loginAdmin(username.trim(), password);
      navigate("/admin/dashboard");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.response?.data?.detail ||
          "Invalid administrator username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] bg-[#F3EBDD] text-[#171717] py-16 px-6 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <AbhayaOfficialLogo className="w-36 mx-auto mb-3" />
          <span className="editorial-stamp-mustard mb-2">
            AUTHORIZED REDRESSAL &amp; GOVERNANCE
          </span>
          <h1 className="font-anton text-4xl sm:text-5xl tracking-[0.06em] uppercase text-[#171717] mt-2">
            Administrator Portal
          </h1>
          <p className="font-caveat text-2xl text-[#B52D27] font-bold mt-1">
            An Initiative by SFI MACE Unit
          </p>
        </div>

        <div className="relative paper-sheet p-8 sm:p-10">
          <div className="paper-tape -top-3 left-1/2 -translate-x-1/2" />
          {errorMsg && (
            <div className="mb-6 p-3.5 border border-[#B52D27] bg-[#F3EBDD] text-xs text-[#B52D27]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            <div>
              <label className="label-editorial">Administrator Username</label>
              <input
                type="text"
                name="abhaya_admin_username"
                autoComplete="off"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter administrator username"
                className="input-editorial"
              />
            </div>

            <div>
              <label className="label-editorial">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="abhaya_admin_password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="input-editorial pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44413E] hover:text-[#171717]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Signing In..." : "Administrator Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
