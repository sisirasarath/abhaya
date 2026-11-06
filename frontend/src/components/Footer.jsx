import React from "react";
import { Link } from "react-router-dom";
import { AbhayaLotusLogo, TornPaperDivider } from "./BrandAssets";

const Footer = () => {
  return (
    <footer className="bg-[#FAF9F5] text-[#171717] border-t-2 border-[#171717]">
      <TornPaperDivider fill="#FAF9F5" bg="#F3EBDD" />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b-2 border-[#171717]">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <AbhayaLotusLogo size={48} showWordmark={true} />
            <p className="font-caveat text-2xl text-[#B52D27] font-semibold">
              An Initiative by SFI MACE Unit.
            </p>
            <p className="font-bebas text-xl uppercase tracking-[0.18em] text-[#171717]">
              HER SAFETY. HER VOICE. HER RIGHTS.
            </p>
            <p className="text-sm text-[#77736B] leading-relaxed max-w-sm">
              A dedicated, confidential platform where verified female students can raise concerns, report grievances, and access verified support.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-oswald text-xs uppercase tracking-[0.2em] text-[#171717] border-b border-[#171717] pb-2 font-semibold">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm text-[#171717]">
              <li>
                <Link to="/" className="hover:text-[#B52D27] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#B52D27] transition-colors">
                  About ABHAYA
                </Link>
              </li>
              <li>
                <Link to="/womens-safety" className="hover:text-[#B52D27] transition-colors">
                  Safety &amp; Support
                </Link>
              </li>
              <li>
                <Link to="/emergency-helplines" className="hover:text-[#B52D27] transition-colors">
                  Emergency Helplines
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#B52D27] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals & Contact */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="font-oswald text-xs uppercase tracking-[0.2em] text-[#171717] border-b border-[#171717] pb-2 font-semibold">
              Emergency &amp; Access
            </h3>
            <div className="space-y-2 text-sm text-[#171717]">
              <p>
                National Emergency:{" "}
                <a href="tel:112" className="underline font-bold text-[#B52D27]">
                  112
                </a>{" "}
                &nbsp;|&nbsp; Women Helpline:{" "}
                <a href="tel:181" className="underline font-bold text-[#171717]">
                  181
                </a>{" "}
                &nbsp;|&nbsp; Police:{" "}
                <a href="tel:1091" className="underline font-bold text-[#171717]">
                  1091
                </a>
              </p>
              <p className="text-xs text-[#77736B] pt-1">
                Campus Women&apos;s Cell &amp; ICC contacts are managed via the{" "}
                <Link to="/emergency-helplines" className="underline text-[#B52D27] font-medium">
                  Emergency Helplines
                </Link>{" "}
                directory.
              </p>
            </div>
            <div className="pt-4 flex flex-wrap gap-5 text-xs font-oswald uppercase tracking-[0.16em] text-[#171717]">
              <Link to="/login" className="hover:text-[#B52D27] underline underline-offset-4">
                Student Login
              </Link>
              <Link to="/register" className="hover:text-[#B52D27] underline underline-offset-4">
                Register
              </Link>
              <Link to="/admin/login" className="hover:text-[#B52D27] underline underline-offset-4">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#77736B]">
          <p className="font-typewriter text-[11px] tracking-[0.12em] text-[#171717]">
            © {new Date().getFullYear()} ABHAYA — An Initiative by SFI MACE Unit.
          </p>
          <span className="pink-cutout-banner font-typewriter text-[10px] uppercase tracking-[0.18em]">
            Exclusively for Verified Female Students
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
