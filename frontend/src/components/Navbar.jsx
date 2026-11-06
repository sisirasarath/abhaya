import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AbhayaLotusLogo } from "./BrandAssets";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, isStudent, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/");
  };

  const publicLinks = [
    { to: "/", label: "Home", end: true },
    { to: "/about", label: "About" },
    { to: "/womens-safety", label: "Safety & Support" },
    { to: "/emergency-helplines", label: "Emergency Helplines" },
  ];

  const studentLinks = [
    { to: "/student/dashboard", label: "Dashboard" },
    { to: "/student/report", label: "Report an Issue" },
    { to: "/student/complaints", label: "My Complaints" },
    { to: "/emergency-helplines", label: "Emergency Helplines" },
    { to: "/student/profile", label: "Profile" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/complaints", label: "Complaints" },
    { to: "/admin/verifications", label: "Student Verification" },
    { to: "/admin/helplines", label: "Helplines" },
    { to: "/admin/reports", label: "Reports" },
  ];

  const activeLinks = isStudent
    ? studentLinks
    : isAdmin
    ? adminLinks
    : publicLinks;

  return (
    <header className="sticky top-0 z-50 bg-[#F3EBDD]/95 backdrop-blur-sm border-b-2 border-[#171717]">
      {/* Top Protest Bulletin Strip */}
      <div className="border-b border-[#171717] bg-[#171717] text-[#F3EBDD] px-6 lg:px-8 py-1.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] font-typewriter uppercase tracking-[0.2em]">
          <span>ABHAYA MOVEMENT • AN INITIATIVE BY SFI MACE UNIT</span>
          <span className="hidden sm:inline text-[#D5B94D]">
            HER SAFETY • HER VOICE • HER RIGHTS
          </span>
          <a
            href="tel:112"
            className="text-[#D58D9D] hover:text-[#FAF9F5] transition-colors underline underline-offset-2"
          >
            EMERGENCY: 112 / 181
          </a>
        </div>
      </div>

      {/* Main Editorial Masthead */}
      <nav className="max-w-6xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Official ABHAYA Logo */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="focus:outline-none group"
        >
          <AbhayaLotusLogo size={44} showWordmark={true} showTagline={true} />
        </Link>

        {/* Right: Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {activeLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `font-oswald text-xs uppercase tracking-[0.2em] transition-all pb-1 ${
                  isActive
                    ? "text-[#B52D27] border-b-2 border-[#B52D27] font-semibold"
                    : "text-[#171717] hover:text-[#B52D27]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {!user ? (
            <Link to="/login" className="btn-primary py-2.5 px-6 text-xs">
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="btn-secondary py-2 px-5 text-xs"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-[#171717] border-2 border-[#171717] bg-[#FAF9F5] focus:outline-none"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#FAF9F5] border-t-2 border-[#171717] px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3">
            {activeLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `font-oswald text-sm uppercase tracking-[0.18em] py-2 border-b border-[#77736B]/30 ${
                    isActive ? "text-[#B52D27] font-semibold" : "text-[#171717]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="pt-3">
            {!user ? (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full text-center"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="btn-secondary w-full text-center"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
