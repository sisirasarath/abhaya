import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PhoneCall, Home, Shield, CheckCircle2, Phone } from "lucide-react";
import apiClient from "../api/client";
import {
  PINTEREST_ARTWORK,
  AbhayaOfficialLogo,
  BotanicalDivider,
  TornPaperDivider,
  ScrapbookPhotoCard,
  HandwrittenNote,
} from "../components/BrandAssets";
import { useAuth } from "../context/AuthContext";

const FALLBACK_HELPLINES = [
  {
    id: 1,
    service_name: "National Emergency Number",
    contact_number: "112",
    category: "NATIONAL",
    description:
      "24/7 pan-India emergency response connecting Police, Ambulance, and Women Safety units.",
    is_verified_number: true,
  },
  {
    id: 2,
    service_name: "Women Helpline",
    contact_number: "181",
    category: "NATIONAL",
    description:
      "24-hour toll-free helpline for crisis support, counseling, and immediate assistance for women.",
    is_verified_number: true,
  },
  {
    id: 3,
    service_name: "Women Police Helpline",
    contact_number: "1091",
    category: "POLICE_LEGAL",
    description:
      "Dedicated police helpline for women in distress (dial 112 alongside 1091 where regional ERSS routing applies).",
    is_verified_number: true,
  },
  {
    id: 4,
    service_name: "College Women's Cell",
    contact_number: "",
    category: "COLLEGE_CELL",
    description:
      "Campus Women's Cell coordinator desk for student welfare and gender grievance support.",
    is_verified_number: false,
  },
  {
    id: 5,
    service_name: "Internal Complaints Committee",
    contact_number: "",
    category: "COLLEGE_CELL",
    description:
      "Statutory POSH Act committee for confidential inquiry and redressal of harassment complaints.",
    is_verified_number: false,
  },
  {
    id: 6,
    service_name: "Hostel Warden",
    contact_number: "",
    category: "HOSTEL_SECURITY",
    description:
      "Ladies Hostel Warden office for accommodation, security, and resident welfare concerns.",
    is_verified_number: false,
  },
  {
    id: 7,
    service_name: "College Security Office",
    contact_number: "",
    category: "HOSTEL_SECURITY",
    description:
      "24/7 campus security control room for on-campus patrol and immediate escort support.",
    is_verified_number: false,
  },
];

/* ============================================================================
   1. HOMEPAGE — FEMINIST ART MOVEMENT × VINTAGE PROTEST EDITORIAL
   ============================================================================ */
export const HomePage = () => {
  const { isStudent, isAdmin } = useAuth();

  const fourFeatures = [
    {
      roman: "01",
      tag: "RESIDENCE & WELFARE",
      title: "HOSTEL SUPPORT",
      description: "Report hostel-related problems and difficulties.",
      note: "Safe hostels, dignified living",
      accentBg: "bg-[#D5B94D]",
      icon: Home,
    },
    {
      roman: "02",
      tag: "DIGNITY & REDRESSAL",
      title: "SAFETY REPORTING",
      description: "Raise concerns about harassment and inappropriate behaviour.",
      note: "Strict identity protection",
      accentBg: "bg-[#B52D27] text-[#FAF9F5]",
      icon: Shield,
    },
    {
      roman: "03",
      tag: "ACCOUNTABILITY",
      title: "COMPLAINT TRACKING",
      description: "Follow the progress of submitted complaints.",
      note: "Transparent status timeline",
      accentBg: "bg-[#D58D9D]",
      icon: CheckCircle2,
    },
    {
      roman: "04",
      tag: "24/7 HELPLINE DIRECTORY",
      title: "EMERGENCY SUPPORT",
      description: "Access important helpline numbers whenever needed.",
      note: "Publicly accessible anytime",
      accentBg: "bg-[#171717] text-[#F3EBDD]",
      icon: Phone,
    },
  ];

  const fourSteps = [
    {
      num: "01",
      stamp: "STEP ONE",
      text: "Register using college credentials.",
      annotation: "Verified female students",
    },
    {
      num: "02",
      stamp: "STEP TWO",
      text: "Get your student account verified.",
      annotation: "Institutional eligibility check",
    },
    {
      num: "03",
      stamp: "STEP THREE",
      text: "Submit your concern securely.",
      annotation: "Confidentiality option included",
    },
    {
      num: "04",
      stamp: "STEP FOUR",
      text: "Track the complaint and updates.",
      annotation: "Direct updates from authorities",
    },
  ];

  return (
    <div className="bg-[#F3EBDD] text-[#171717]">
      {/* ====================================================================
          HERO SECTION — FEMINIST EDITORIAL POSTER & PROTEST COLLAGE
          Features Image 2 (Pink Feminist Newspaper Collage) + Image 1 (Mustard Silhouette) + Image 4 (Red Fist)
         ==================================================================== */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pt-10 pb-20 md:pt-14 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Activist Poster Typography & Official Logo */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-3">
              <span className="editorial-stamp-burgundy">
                WOMEN&apos;S SAFETY MOVEMENT
              </span>
              <span className="editorial-stamp-mustard">
                SFI MACE UNIT
              </span>
            </div>

            <div className="flex items-center gap-5 pt-1">
              <AbhayaOfficialLogo className="w-36 sm:w-44 shrink-0" />
              <div className="border-l-2 border-[#171717] pl-5 space-y-1.5">
                <span className="pink-cutout-banner inline-block font-bebas text-lg tracking-[0.18em] uppercase">
                  NOT A TREND. A MOVEMENT.
                </span>
                <p className="font-caveat text-2xl sm:text-3xl text-[#B52D27] font-bold block">
                  An Initiative by SFI MACE Unit.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <h1 className="font-anton text-7xl sm:text-8xl md:text-9xl tracking-[0.06em] uppercase text-[#171717] leading-[0.9]">
                ABHAYA
              </h1>
              <div className="mt-3 inline-block bg-[#171717] text-[#F3EBDD] px-4 py-2 border-2 border-[#171717] shadow-[4px_4px_0px_#B52D27]">
                <p className="font-bebas text-2xl sm:text-3xl tracking-[0.22em] uppercase">
                  HER SAFETY. HER VOICE. HER RIGHTS.
                </p>
              </div>
            </div>

            {/* Torn Newspaper Manifesto Quote */}
            <div className="newspaper-clipping p-5 sm:p-6 border-l-4 border-l-[#B52D27] max-w-xl shadow-[4px_4px_0px_#171717]">
              <p className="font-cormorant italic font-semibold text-xl sm:text-2xl text-[#171717] leading-relaxed">
                &ldquo;A space where every woman can speak freely, raise concerns and seek the support she deserves.&rdquo;
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to={
                  isStudent
                    ? "/student/dashboard"
                    : isAdmin
                    ? "/admin/dashboard"
                    : "/login"
                }
                className="btn-primary min-w-[220px]"
              >
                {isStudent
                  ? "STUDENT DASHBOARD"
                  : isAdmin
                  ? "ADMIN DASHBOARD"
                  : "STUDENT LOGIN"}
              </Link>
              <Link
                to="/emergency-helplines"
                className="btn-secondary min-w-[220px]"
              >
                EMERGENCY HELPLINES
              </Link>
            </div>
          </div>

          {/* Right Column: Multi-Layered Feminist Protest Poster Collage (Images 2, 1, 4) */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Primary Centerpiece: IMAGE 2 — Pink Feminist Newspaper Collage */}
              <div className="col-span-12 sm:col-span-7">
                <ScrapbookPhotoCard
                  src={PINTEREST_ARTWORK.pinkFeminismCollage}
                  alt="Feminism is not a trend, it's a movement — newspaper protest collage"
                  caption="We speak. We demand. We rise."
                  stamp="MANIFESTO"
                  rotation="-rotate-2"
                  tapePosition="top-center"
                  tapeVariant="pink"
                  backingColor="bg-[#D58D9D]"
                />
              </div>

              {/* Right Stacked Posters: IMAGE 1 (Mustard Silhouette) + IMAGE 4 (Red Raised Fist) */}
              <div className="col-span-12 sm:col-span-5 grid grid-cols-2 sm:grid-cols-1 gap-5">
                <ScrapbookPhotoCard
                  src={PINTEREST_ARTWORK.mustardSilhouette}
                  alt="Strong women have high standards and firm boundaries — mustard silhouette poster"
                  caption="High standards & firm boundaries"
                  stamp="POSTER I"
                  rotation="rotate-2"
                  tapePosition="top-right"
                  backingColor="bg-[#D5B94D]"
                  footerBanner="BOUNDARIES."
                />

                <ScrapbookPhotoCard
                  src={PINTEREST_ARTWORK.redRaisedFist}
                  alt="Red female silhouette with raised fist protest artwork"
                  caption="Unapologetic solidarity"
                  stamp="POSTER II"
                  rotation="-rotate-1"
                  tapePosition="top-left"
                  backingColor="bg-[#B52D27]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <TornPaperDivider fill="#FAF9F5" bg="#F3EBDD" />

      {/* ====================================================================
          ABOUT SECTION — EDITORIAL MAGAZINE SPREAD ("A SPACE TO BE HEARD.")
          Features Image 5 (Women's Solidarity Artwork) + Image 3 (Women Unite Historical March)
         ==================================================================== */}
      <section className="bg-[#FAF9F5] py-24 md:py-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Collage: Image 5 (Solidarity Artwork) + Image 3 (Women Unite March) */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="grid grid-cols-12 gap-5 items-center">
              <div className="col-span-12 sm:col-span-7">
                <ScrapbookPhotoCard
                  src={PINTEREST_ARTWORK.womensSolidarityArt}
                  alt="Warm artistic illustration of women coming together in solidarity"
                  caption="Together in strength & sisterhood"
                  stamp="SOLIDARITY"
                  rotation="-rotate-2"
                  tapePosition="top-center"
                  backingColor="bg-[#D5B94D]"
                />
              </div>
              <div className="col-span-12 sm:col-span-5">
                <ScrapbookPhotoCard
                  src={PINTEREST_ARTWORK.womenUniteMarch}
                  alt="Archival black and white photograph of women marching with WOMEN UNITE! banner"
                  caption="Women Unite!"
                  stamp="ARCHIVE"
                  rotation="rotate-2"
                  tapePosition="top-left"
                  tapeVariant="pink"
                  backingColor="bg-[#171717]"
                />
              </div>
            </div>
          </div>

          {/* Right Editorial Text Spread */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="editorial-stamp-burgundy">
                ABOUT THE MOVEMENT
              </span>
              <HandwrittenNote>
                Collective courage on campus
              </HandwrittenNote>
            </div>

            <h2 className="font-anton text-5xl sm:text-6xl tracking-[0.05em] uppercase text-[#171717] leading-none">
              A SPACE TO BE HEARD.
            </h2>

            <div className="h-1 w-24 bg-[#B52D27]" />

            <div className="paper-sheet p-6 sm:p-8 bg-[#F3EBDD] space-y-5 text-base sm:text-lg text-[#171717] leading-relaxed">
              <p className="first-letter:font-anton first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#B52D27]">
                ABHAYA is an initiative by SFI MACE Unit dedicated to creating a safer and more supportive environment for female students.
              </p>
              <p className="text-[#171717]/90">
                It provides a platform to report hostel-related difficulties, harassment, inappropriate behaviour and other safety concerns, ensuring that student voices are heard and their concerns receive appropriate attention.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t-2 border-[#171717]">
              <span className="font-typewriter text-xs uppercase tracking-[0.18em] text-[#171717]">
                CONFIDENTIAL • VERIFIED • ACCOUNTABLE
              </span>
              <span className="font-caveat text-2xl text-[#B52D27] font-bold">
                — Her Safety. Her Voice. Her Rights.
              </span>
            </div>
          </div>
        </div>
      </section>

      <TornPaperDivider fill="#F3EBDD" bg="#FAF9F5" />

      {/* ====================================================================
          FEATURES SECTION — CAMPAIGN POSTER GRID ("WHAT ABHAYA OFFERS")
         ==================================================================== */}
      <section className="bg-[#F3EBDD] py-24 md:py-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 border-b-2 border-[#171717] pb-6 gap-4">
            <div>
              <span className="editorial-stamp-mustard mb-3">
                CAMPAIGN PILLARS
              </span>
              <h2 className="font-anton text-5xl sm:text-6xl tracking-[0.06em] uppercase text-[#171717] mt-2">
                WHAT ABHAYA OFFERS
              </h2>
            </div>
            <HandwrittenNote arrow={true}>
              Four pillars of student action &amp; protection
            </HandwrittenNote>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {fourFeatures.map((item) => {
              const IconComponent = item.icon;
              return (
                <article
                  key={item.title}
                  className="paper-sheet flex flex-col justify-between bg-[#FAF9F5] hover:-translate-y-1 transition-transform duration-200"
                >
                  {/* Top Campaign Header Strip */}
                  <div
                    className={`px-6 py-4 border-b-2 border-[#171717] flex items-center justify-between ${item.accentBg}`}
                  >
                    <span className="font-bebas text-3xl tracking-[0.12em]">
                      {item.roman}
                    </span>
                    <IconComponent className="w-5 h-5" strokeWidth={1.75} />
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-[#77736B] mb-2">
                        {item.tag}
                      </p>
                      <h3 className="font-oswald font-bold text-2xl uppercase tracking-[0.06em] text-[#171717] mb-3">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#171717]/85 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-5 mt-6 border-t border-[#171717]/20">
                      <span className="font-caveat text-xl text-[#B52D27] font-semibold">
                        {item.note}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <TornPaperDivider fill="#FAF9F5" bg="#F3EBDD" />

      {/* ====================================================================
          HOW IT WORKS — PROTEST ZINE PROCESS SPREAD (01 – 04)
         ==================================================================== */}
      <section className="bg-[#FAF9F5] py-24 md:py-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="editorial-stamp mb-3">REDRESSAL WORKFLOW</span>
            <h2 className="font-anton text-5xl sm:text-6xl tracking-[0.06em] uppercase text-[#171717] mt-2">
              HOW IT WORKS
            </h2>
            <BotanicalDivider label="FOUR STEPS TO BE HEARD" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {fourSteps.map((step, idx) => (
              <div
                key={step.num}
                className={`relative paper-sheet p-7 pt-9 bg-[#F3EBDD] ${
                  idx % 2 === 0 ? "-rotate-1" : "rotate-1"
                } hover:rotate-0 transition-transform duration-300`}
              >
                <div
                  className={`${
                    idx % 2 === 1 ? "paper-tape-pink" : "paper-tape"
                  } -top-3 left-1/2 -translate-x-1/2`}
                />

                <div className="flex items-baseline justify-between border-b-2 border-[#171717] pb-3 mb-4">
                  <span className="font-anton text-5xl text-[#B52D27] leading-none">
                    {step.num}
                  </span>
                  <span className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-[#171717]">
                    {step.stamp}
                  </span>
                </div>

                <p className="font-oswald text-lg uppercase tracking-[0.04em] text-[#171717] font-semibold leading-snug mb-3">
                  {step.text}
                </p>

                <p className="font-caveat text-xl text-[#77736B]">
                  {step.annotation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TornPaperDivider fill="#F3EBDD" bg="#FAF9F5" />

      {/* ====================================================================
          CLOSING SECTION — PROTEST POSTER MANIFESTO ("YOUR VOICE MATTERS.")
          Features Image 4 (Red Silhouette with Raised Fist) & Image 1 (Mustard Silhouette)
         ==================================================================== */}
      <section className="bg-[#F3EBDD] py-24 md:py-32 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto paper-sheet p-8 sm:p-14 bg-[#FAF9F5] relative">
          <div className="paper-tape -top-3 left-1/2 -translate-x-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-4">
              <ScrapbookPhotoCard
                src={PINTEREST_ARTWORK.redRaisedFist}
                alt="Red female silhouette with raised fist"
                caption="Stand firm. Speak out."
                stamp="ABHAYA"
                rotation="-rotate-2"
                tapePosition="top-center"
                backingColor="bg-[#D5B94D]"
              />
            </div>

            <div className="md:col-span-8 text-left space-y-5">
              <span className="editorial-stamp-burgundy">
                AN INITIATIVE BY SFI MACE UNIT
              </span>

              <h2 className="font-anton text-5xl sm:text-7xl tracking-[0.06em] uppercase text-[#171717] leading-none">
                YOUR VOICE MATTERS.
              </h2>

              <p className="font-caveat text-3xl sm:text-4xl text-[#B52D27] font-bold">
                &ldquo;Every concern deserves to be heard.&rdquo;
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
                <Link
                  to={isStudent ? "/student/dashboard" : "/login"}
                  className="btn-primary min-w-[210px]"
                >
                  {isStudent ? "Go to Dashboard" : "Student Login"}
                </Link>
                <Link
                  to="/emergency-helplines"
                  className="btn-secondary min-w-[210px]"
                >
                  Emergency Helplines
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ============================================================================
   2. ABOUT ABHAYA PAGE — EDITORIAL MOVEMENT SPREAD
   Features Image 5 (Women's Solidarity Artwork) + Image 3 (Women Unite March)
   ============================================================================ */
export const AboutPage = () => {
  return (
    <div className="bg-[#F3EBDD] text-[#171717] py-20 md:py-28 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto">
          <span className="editorial-stamp-burgundy mb-3">
            AN INITIATIVE BY SFI MACE UNIT
          </span>
          <h1 className="font-anton text-5xl sm:text-7xl tracking-[0.06em] uppercase text-[#171717] mt-3 mb-4">
            ABOUT ABHAYA
          </h1>
          <BotanicalDivider label="SOLIDARITY • DIGNITY • REDRESSAL" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 paper-sheet p-8 sm:p-12 space-y-6 text-base text-[#171717] leading-relaxed">
            <p className="font-cormorant text-2xl sm:text-3xl text-[#171717] italic font-semibold leading-snug border-l-4 border-[#B52D27] pl-5">
              ABHAYA is an initiative by SFI MACE Unit dedicated to creating a safer and more supportive environment for female students of our college.
            </p>
            <p className="text-[#171717]/85">
              It provides a dedicated, structured platform to report hostel-related difficulties, harassment, inappropriate behaviour, campus safety concerns, and other grievances—ensuring that every student voice is heard and addressed with dignity and confidentiality.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t-2 border-[#171717]">
              <div className="mustard-poster-box p-5">
                <h2 className="font-oswald text-base uppercase tracking-[0.14em] text-[#171717] font-bold mb-2">
                  Verified Exclusivity
                </h2>
                <p className="text-xs text-[#171717] leading-relaxed">
                  Access to grievance submission and tracking is restricted exclusively to verified and approved female students of the college, protecting the integrity of the space.
                </p>
              </div>
              <div className="newspaper-clipping p-5 border-2 border-[#171717]">
                <h2 className="font-oswald text-base uppercase tracking-[0.14em] text-[#B52D27] font-bold mb-2">
                  Strict Confidentiality
                </h2>
                <p className="text-xs text-[#171717] leading-relaxed">
                  Students may choose to keep their identity confidential when filing a concern. Confidentiality is enforced directly at the backend server layer.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#171717]/20 flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary">
                Register Student Account
              </Link>
              <Link to="/emergency-helplines" className="btn-secondary">
                View Emergency Helplines
              </Link>
            </div>
          </div>

          {/* Right Artwork Column: Image 5 + Image 3 */}
          <div className="lg:col-span-5 space-y-8">
            <ScrapbookPhotoCard
              src={PINTEREST_ARTWORK.womensSolidarityArt}
              alt="Women's solidarity watercolor artwork"
              caption="Sisterhood & Collective Care"
              stamp="ARTWORK V"
              rotation="rotate-1"
              tapePosition="top-center"
              backingColor="bg-[#D58D9D]"
            />
            <ScrapbookPhotoCard
              src={PINTEREST_ARTWORK.womenUniteMarch}
              alt="Women Unite historical march photograph"
              caption="Women Unite — A legacy of courage"
              stamp="ARCHIVE III"
              rotation="-rotate-2"
              tapePosition="top-left"
              backingColor="bg-[#D5B94D]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. SAFETY & SUPPORT PAGE (WOMEN'S SAFETY & HOSTEL SAFETY)
   Features Image 1 (Mustard Silhouette), Image 4 (Red Fist), and Image 2 (Pink Collage)
   ============================================================================ */
export const WomensSafetyPage = () => {
  const sections = [
    {
      num: "01",
      tag: "CAMPUS & INTERPERSONAL SAFETY",
      title: "Personal & Campus Safety",
      note: "Zero tolerance toward harassment",
      poster: PINTEREST_ARTWORK.mustardSilhouette,
      posterCaption: "Firm boundaries & high standards",
      posterFooter: "BOUNDARIES.",
      backing: "bg-[#D5B94D]",
      items: [
        "Report any instance of verbal, physical, or online harassment, stalking, or intimidating behaviour immediately through ABHAYA.",
        "Identify and report poorly lit pathways, isolated academic corridors, or washroom safety issues so immediate corrective action can be taken.",
        "Preserve screenshots, messages, dates, and times if you experience digital or interpersonal harassment.",
      ],
    },
    {
      num: "02",
      tag: "RESIDENTIAL RIGHTS",
      title: "Hostel Support & Welfare",
      note: "Safe & dignified hostel living",
      poster: PINTEREST_ARTWORK.redRaisedFist,
      posterCaption: "Every resident has the right to dignity",
      posterFooter: "",
      backing: "bg-[#B52D27]",
      items: [
        "Raise hostel-related issues including water supply, electricity, sanitation, food quality, cleanliness, maintenance, and hostel security.",
        "Report warden-related concerns or unfair restrictions confidentially without fear of retaliation.",
        "Track every hostel grievance from submission through assignment and final resolution.",
      ],
    },
    {
      num: "03",
      tag: "STATUTORY PROTECTION",
      title: "Confidentiality & Redressal Rights",
      note: "Protected at the server level",
      poster: PINTEREST_ARTWORK.pinkFeminismCollage,
      posterCaption: "We will not be silenced",
      posterFooter: "",
      backing: "bg-[#D58D9D]",
      items: [
        "Under the POSH Act and UGC regulations, female students have the right to a safe, non-retaliatory inquiry process.",
        "Selecting 'Confidential' on ABHAYA restricts your personal details strictly to authorized Women's Cell / ICC presiding officers while allowing handlers to resolve the issue.",
      ],
    },
  ];

  return (
    <div className="bg-[#F3EBDD] text-[#171717] py-20 md:py-28 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="editorial-stamp-mustard mb-3">
            SAFETY &amp; REDRESSAL CAMPAIGN
          </span>
          <h1 className="font-anton text-5xl sm:text-7xl tracking-[0.06em] uppercase text-[#171717] mt-2">
            SAFETY &amp; SUPPORT
          </h1>
          <BotanicalDivider label="KNOW YOUR RIGHTS • SPEAK WITHOUT FEAR" />
        </div>

        <div className="space-y-12">
          {sections.map((sec, idx) => (
            <div
              key={sec.title}
              className="paper-sheet p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div
                className={`lg:col-span-4 ${
                  idx % 2 === 1 ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <ScrapbookPhotoCard
                  src={sec.poster}
                  alt={sec.title}
                  caption={sec.posterCaption}
                  stamp={`POSTER ${sec.num}`}
                  rotation={idx % 2 === 0 ? "-rotate-1" : "rotate-1"}
                  backingColor={sec.backing}
                  footerBanner={sec.posterFooter}
                />
              </div>

              <div
                className={`lg:col-span-8 space-y-5 ${
                  idx % 2 === 1 ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-[#171717] pb-4">
                  <div className="flex items-baseline gap-4">
                    <span className="font-anton text-5xl text-[#B52D27]">
                      {sec.num}
                    </span>
                    <div>
                      <p className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-[#77736B]">
                        {sec.tag}
                      </p>
                      <h2 className="font-oswald text-3xl uppercase tracking-[0.06em] text-[#171717] font-bold">
                        {sec.title}
                      </h2>
                    </div>
                  </div>
                  <span className="font-caveat text-2xl text-[#B52D27] font-bold">
                    {sec.note}
                  </span>
                </div>

                <ul className="space-y-3.5 text-sm sm:text-base text-[#171717] leading-relaxed">
                  {sec.items.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-3">
                      <span className="text-[#B52D27] font-bold mt-0.5">■</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 mustard-poster-box p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-oswald text-2xl uppercase tracking-[0.06em] text-[#171717] font-bold">
              Need to raise a concern or access immediate help?
            </p>
            <p className="font-caveat text-2xl text-[#B52D27] font-bold">
              An Initiative by SFI MACE Unit — Every student voice matters
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/login" className="btn-primary">
              Report an Issue
            </Link>
            <Link to="/emergency-helplines" className="btn-secondary">
              Emergency Helplines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HostelSafetyPage = WomensSafetyPage;

/* ============================================================================
   4. EMERGENCY HELPLINES PAGE — PUBLIC ACCESS (NO LOGIN REQUIRED)
   ============================================================================ */
export const EmergencyHelplinesPage = () => {
  const [helplines, setHelplines] = useState(FALLBACK_HELPLINES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/public/helplines/")
      .then((res) => {
        if (mounted && Array.isArray(res.data) && res.data.length > 0) {
          setHelplines(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-[#F3EBDD] text-[#171717] py-20 md:py-28 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="editorial-stamp-burgundy mb-3">
            PUBLIC DIRECTORY • NO LOGIN REQUIRED
          </span>
          <h1 className="font-anton text-5xl sm:text-7xl tracking-[0.06em] uppercase text-[#171717] mt-2 mb-4">
            EMERGENCY HELPLINES
          </h1>
          <BotanicalDivider label="24/7 VERIFIED SUPPORT" />
          <p className="text-sm text-[#171717] leading-relaxed mt-4">
            For immediate personal danger, please call verified emergency services directly—including{" "}
            <strong className="font-bold text-[#B52D27]">112</strong>. Online complaint submissions on ABHAYA are for grievance redressal and are not live emergency-dispatch calls.
          </p>
        </div>

        {/* Primary Verified National Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "National Emergency Number",
              number: "112",
              desc: "All-in-one 24/7 emergency response connecting Police, Ambulance, and Fire services.",
              headerClass: "bg-[#B52D27] text-[#FAF9F5]",
            },
            {
              name: "Women Helpline",
              number: "181",
              desc: "24-hour toll-free helpline for women seeking crisis support, counseling, and legal aid.",
              headerClass: "bg-[#D5B94D] text-[#171717]",
            },
            {
              name: "Women Police Helpline",
              number: "1091",
              desc: "Dedicated Police Helpline for women in distress (dial 112 if regional ERSS routing applies).",
              headerClass: "bg-[#171717] text-[#F3EBDD]",
            },
          ].map((item) => (
            <div
              key={item.number}
              className="relative paper-sheet flex flex-col justify-between bg-[#FAF9F5]"
            >
              <div
                className={`px-6 py-3 border-b-2 border-[#171717] font-typewriter text-[10px] uppercase tracking-[0.2em] ${item.headerClass}`}
              >
                24/7 Verified Helpline
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="font-oswald text-xl uppercase tracking-[0.06em] text-[#171717] font-bold mb-2">
                    {item.name}
                  </h2>
                  <p className="font-anton text-6xl text-[#171717] mb-4">
                    {item.number}
                  </p>
                  <p className="text-xs text-[#77736B] leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>
                <a
                  href={`tel:${item.number}`}
                  className="btn-primary w-full text-center"
                >
                  <PhoneCall className="w-4 h-4" />
                  Call Now ({item.number})
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   5. PRIVACY POLICY PAGE
   ============================================================================ */
export const PrivacyPolicyPage = () => {
  return (
    <div className="bg-[#F3EBDD] text-[#171717] py-20 md:py-28 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto paper-sheet p-8 sm:p-14 bg-[#FAF9F5] relative">
        <div className="paper-tape -top-3 left-1/2 -translate-x-1/2" />
        <p className="font-typewriter text-[11px] uppercase tracking-[0.22em] text-[#B52D27] mb-3 text-center">
          Data Protection &amp; Confidentiality
        </p>
        <h1 className="font-anton text-4xl sm:text-6xl tracking-[0.06em] uppercase text-[#171717] text-center mb-6">
          PRIVACY POLICY
        </h1>
        <BotanicalDivider />

        <div className="space-y-8 text-sm text-[#171717] leading-relaxed mt-10">
          <section className="space-y-2 border-b border-[#171717]/20 pb-6">
            <h2 className="font-oswald text-base uppercase tracking-[0.14em] text-[#B52D27] font-bold">
              1. Institutional Eligibility &amp; Data Collection
            </h2>
            <p className="text-[#171717]/85">
              ABHAYA collects only the student credentials required to verify female student eligibility (Full Name, Registered Email, Department, Semester, Residence Status, and Phone Number). Public visitors can browse the website and Emergency Helplines without providing any personal data.
            </p>
          </section>

          <section className="space-y-2 border-b border-[#171717]/20 pb-6">
            <h2 className="font-oswald text-base uppercase tracking-[0.14em] text-[#B52D27] font-bold">
              2. Backend-Enforced Identity Confidentiality
            </h2>
            <p className="text-[#171717]/85">
              When a student selects the Confidential option on a complaint, the backend API automatically redacts the student&apos;s name, email, and phone number for general complaint handlers and hostel administrators. Only authorized presiding officers (Super Administrator / Women&apos;s Cell &amp; ICC Administrator) can view confidential identity records when legally required.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-oswald text-base uppercase tracking-[0.14em] text-[#B52D27] font-bold">
              3. Role-Based Access Control &amp; Audit Logging
            </h2>
            <p className="text-[#171717]/85">
              Every student can view only her own submitted complaints. Every administrative action—including registration verification, complaint assignment, and status updates—is recorded in an immutable audit trail.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
