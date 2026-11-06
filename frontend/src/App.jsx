import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import {
  HomePage,
  AboutPage,
  WomensSafetyPage,
  HostelSafetyPage,
  EmergencyHelplinesPage,
  PrivacyPolicyPage,
} from "./pages/PublicPages";
import {
  StudentLoginPage,
  StudentRegisterPage,
  AdminLoginPage,
} from "./pages/AuthPages";
import {
  StudentDashboardPage,
  ReportIssuePage,
  ReportHostelIssuePage,
  ReportHarassmentPage,
  MyComplaintsPage,
  StudentComplaintDetailPage,
  StudentProfilePage,
  StudentNotificationsPage,
} from "./pages/StudentPages";
import {
  AdminDashboardPage,
  AdminComplaintsPage,
  AdminComplaintDetailPage,
  AdminVerificationsPage,
  AdminStudentsPage,
  AdminHelplinesPage,
  AdminAdministratorsPage,
  AdminReportsPage,
  AdminSettingsPage,
} from "./pages/AdminPages";

const ProtectedStudentRoute = ({ children }) => {
  const { user, loadingAuth } = useAuth();
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center font-cormorant text-2xl uppercase tracking-[0.15em] text-[#171717]">
        Verifying Student Session...
      </div>
    );
  }
  if (!user || user.role !== "STUDENT") {
    return <Navigate to="/login" replace />;
  }
  const status =
    user.verification_status || user.student_profile?.verification_status;
  if (status && status !== "APPROVED") {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const { user, loadingAuth } = useAuth();
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center font-cormorant text-2xl uppercase tracking-[0.15em] text-[#171717]">
        Verifying Administrator Session...
      </div>
    );
  }
  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#F3EBDD] text-[#171717]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* PUBLIC PAGES */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/womens-safety" element={<WomensSafetyPage />} />
              <Route path="/hostel-safety" element={<HostelSafetyPage />} />
              <Route path="/emergency-helplines" element={<EmergencyHelplinesPage />} />
              <Route path="/helplines" element={<EmergencyHelplinesPage />} />
              <Route path="/login" element={<StudentLoginPage />} />
              <Route path="/register" element={<StudentRegisterPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

              {/* STUDENT PAGES — Verified & Approved Female Students Only */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedStudentRoute>
                    <StudentDashboardPage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/student/report"
                element={
                  <ProtectedStudentRoute>
                    <ReportIssuePage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/student/report-hostel"
                element={
                  <ProtectedStudentRoute>
                    <ReportHostelIssuePage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/student/report-harassment"
                element={
                  <ProtectedStudentRoute>
                    <ReportHarassmentPage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/student/complaints"
                element={
                  <ProtectedStudentRoute>
                    <MyComplaintsPage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/student/complaints/:complaintId"
                element={
                  <ProtectedStudentRoute>
                    <StudentComplaintDetailPage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/student/profile"
                element={
                  <ProtectedStudentRoute>
                    <StudentProfilePage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/student/notifications"
                element={
                  <ProtectedStudentRoute>
                    <StudentNotificationsPage />
                  </ProtectedStudentRoute>
                }
              />

              {/* ADMIN PAGES — Role-Based Administrators Only */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboardPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/complaints"
                element={
                  <ProtectedAdminRoute>
                    <AdminComplaintsPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/complaints/:complaintId"
                element={
                  <ProtectedAdminRoute>
                    <AdminComplaintDetailPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/verifications"
                element={
                  <ProtectedAdminRoute>
                    <AdminVerificationsPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/student-verification"
                element={
                  <ProtectedAdminRoute>
                    <AdminVerificationsPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedAdminRoute>
                    <AdminStudentsPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/helplines"
                element={
                  <ProtectedAdminRoute>
                    <AdminHelplinesPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/administrators"
                element={
                  <ProtectedAdminRoute>
                    <AdminAdministratorsPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedAdminRoute>
                    <AdminReportsPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedAdminRoute>
                    <AdminSettingsPage />
                  </ProtectedAdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
