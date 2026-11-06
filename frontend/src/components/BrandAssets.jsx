import React, { useState } from "react";

/**
 * The 5 Extracted & Cleaned Pinterest Reference Artworks
 */
export const PINTEREST_ARTWORK = {
  mustardSilhouette: "/assets/images/mustard-female-silhouette-poster.jpg",
  pinkFeminismCollage: "/assets/images/pink-feminism-newspaper-collage.jpg",
  womenUniteMarch: "/assets/images/women-unite-archival-march.jpg",
  redRaisedFist: "/assets/images/red-raised-fist-silhouette-poster.jpg",
  womensSolidarityArt: "/assets/images/womens-solidarity-watercolor-art.jpg",
};

/**
 * Official ABHAYA Emblem & Calligraphic Lockup
 */
export const AbhayaOfficialLogo = ({ className = "w-60 md:w-68 mx-auto" }) => (
  <img
    src="/abhaya-logo.svg"
    alt="ABHAYA — Her Safety. Her Voice. Her Rights. An Initiative by SFI MACE Unit"
    className={`select-none object-contain ${className}`}
  />
);

export const AbhayaLotusLogo = ({
  size = 42,
  showWordmark = false,
  showTagline = false,
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="ABHAYA Official Emblem"
      >
        <g stroke="#171717" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M62 24 C74 12, 98 14, 108 30 C116 42, 117 58, 109 74 C104 84, 95 92, 84 96"
            strokeWidth="3.2"
          />
          <path
            d="M78 26 C75 36, 70 46, 67 54 C65 59, 68 62, 72 63 C69 66, 71 70, 75 71 C71 74, 73 80, 80 82 C87 84, 93 80, 96 76"
            strokeWidth="3.2"
          />
          <path d="M78 45 C83 42, 88 42, 92 45" strokeWidth="2.5" />
          <path
            d="M62 24 C48 34, 42 54, 48 76 C53 92, 64 102, 75 110"
            strokeWidth="2.8"
          />
          <path
            d="M80 88 C72 102, 70 118, 80 138 C90 118, 88 102, 80 88 Z"
            strokeWidth="3.4"
            fill="#FAF9F5"
          />
          <path
            d="M77 136 C64 128, 56 115, 60 100 C68 108, 73 120, 77 136 Z"
            strokeWidth="3"
            fill="#FAF9F5"
          />
          <path
            d="M83 136 C96 128, 104 115, 100 100 C92 108, 87 120, 83 136 Z"
            strokeWidth="3"
            fill="#FAF9F5"
          />
          <path
            d="M74 138 C57 135, 44 124, 40 110 C52 114, 64 123, 74 138 Z"
            strokeWidth="2.8"
          />
          <path
            d="M86 138 C103 135, 116 124, 120 110 C108 114, 96 123, 86 138 Z"
            strokeWidth="2.8"
          />
          <path d="M52 145 C66 141, 94 141, 108 145" strokeWidth="2.8" />
        </g>
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-cormorant italic font-bold tracking-[0.06em] text-[#171717] text-2xl md:text-3xl">
            Abhaya
          </span>
          {showTagline && (
            <span className="font-typewriter text-[9px] uppercase tracking-[0.18em] text-[#B52D27] mt-1">
              An Initiative by SFI MACE Unit
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Activist Editorial Divider with Lotus / Fist Accent
 */
export const BotanicalDivider = ({ className = "", label = "" }) => (
  <div className={`flex items-center justify-center gap-4 my-6 ${className}`} aria-hidden="true">
    <span className="h-0.5 w-16 sm:w-24 bg-[#171717]" />
    {label ? (
      <span className="font-typewriter text-[10px] uppercase tracking-[0.22em] text-[#B52D27] px-2">
        {label}
      </span>
    ) : (
      <span className="w-3 h-3 bg-[#B52D27] rotate-45 border border-[#171717]" />
    )}
    <span className="h-0.5 w-16 sm:w-24 bg-[#171717]" />
  </div>
);

/**
 * Realistic Torn Newspaper / Scrapbook Section Edge
 */
export const TornPaperDivider = ({
  fill = "#FAF9F5",
  bg = "#F3EBDD",
  flip = false,
  className = "",
}) => (
  <div
    className={`w-full overflow-hidden leading-none select-none ${
      flip ? "rotate-180" : ""
    } ${className}`}
    style={{ backgroundColor: bg }}
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 1440 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-5 sm:h-7 md:h-8 block"
      preserveAspectRatio="none"
    >
      <path
        d="M0 18 L34 6 L68 23 L108 9 L148 26 L195 7 L236 21 L284 10 L329 27 L378 8 L421 22 L468 6 L512 24 L560 11 L609 27 L654 9 L702 22 L749 7 L798 25 L846 10 L892 24 L940 8 L988 26 L1035 11 L1084 22 L1132 7 L1180 25 L1228 10 L1276 23 L1324 8 L1372 24 L1412 11 L1440 19 L1440 36 L0 36 Z"
        fill={fill}
      />
      <path
        d="M0 18 L34 6 L68 23 L108 9 L148 26 L195 7 L236 21 L284 10 L329 27 L378 8 L421 22 L468 6 L512 24 L560 11 L609 27 L654 9 L702 22 L749 7 L798 25 L846 10 L892 24 L940 8 L988 26 L1035 11 L1084 22 L1132 7 L1180 25 L1228 10 L1276 23 L1324 8 L1372 24 L1412 11 L1440 19"
        stroke="#171717"
        strokeWidth="1.5"
      />
    </svg>
  </div>
);

/**
 * Vintage Polaroid / Feminist Protest Artwork Card
 */
export const ScrapbookPhotoCard = ({
  src,
  alt,
  caption,
  stamp = "ABHAYA • MACE",
  rotation = "-rotate-2",
  tapePosition = "top-center",
  tapeVariant = "ivory",
  backingColor = "bg-[#D58D9D]",
  aspectClass = "",
  footerBanner = "",
  grayscale = false,
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);

  const tapeClasses = {
    "top-center": "-top-3 left-1/2 -translate-x-1/2 -rotate-2",
    "top-left": "-top-2.5 -left-4 -rotate-12",
    "top-right": "-top-2.5 -right-4 rotate-12",
  };

  return (
    <div className={`relative group ${rotation} ${className}`}>
      {/* Offset Collage Paper Cutout Backing */}
      <div
        className={`absolute -inset-2 ${backingColor} border-2 border-[#171717] rotate-2 -z-10`}
        aria-hidden="true"
      />

      {/* Masking Tape Strip */}
      <div
        className={`${
          tapeVariant === "pink" ? "paper-tape-pink" : "paper-tape"
        } ${tapeClasses[tapePosition] || tapeClasses["top-center"]}`}
      />

      {/* Polaroid / Poster Frame */}
      <figure className="polaroid-frame relative">
        <div
          className={`relative overflow-hidden bg-[#171717] border border-[#171717] ${aspectClass}`}
        >
          {!imgError && src ? (
            <img
              src={src}
              alt={alt}
              onError={() => setImgError(true)}
              loading="lazy"
              className={`w-full h-full object-cover ${
                grayscale ? "grayscale contrast-125" : ""
              } group-hover:scale-[1.02] transition-transform duration-500`}
            />
          ) : (
            <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-6 bg-[#171717] text-[#F3EBDD] text-center">
              <AbhayaLotusLogo size={54} />
              <p className="font-cormorant italic text-lg mt-3 text-[#F3EBDD]">
                {caption || "Her Safety. Her Voice. Her Rights."}
              </p>
            </div>
          )}

          {footerBanner && (
            <div className="bg-[#AA9024] text-[#171717] border-t-2 border-[#171717] py-1.5 px-3 text-center">
              <span className="font-bebas text-3xl sm:text-4xl tracking-[0.14em] uppercase leading-none block">
                {footerBanner}
              </span>
            </div>
          )}
        </div>

        {/* Handwritten Scrapbook Caption & Typewriter Stamp */}
        {(caption || stamp) && (
          <figcaption className="pt-3 flex items-baseline justify-between gap-2">
            <span className="font-caveat text-xl sm:text-2xl text-[#171717] font-semibold leading-tight">
              {caption}
            </span>
            {stamp && (
              <span className="font-typewriter text-[9px] uppercase tracking-[0.16em] text-[#B52D27] shrink-0">
                {stamp}
              </span>
            )}
          </figcaption>
        )}
      </figure>
    </div>
  );
};

/**
 * Handwritten Activist Margin Annotation
 */
export const HandwrittenNote = ({
  children,
  className = "",
  arrow = false,
}) => (
  <div
    className={`inline-flex items-center gap-2 font-caveat text-2xl text-[#B52D27] font-semibold select-none ${className}`}
  >
    <span>{children}</span>
    {arrow && (
      <svg
        width="34"
        height="18"
        viewBox="0 0 34 18"
        fill="none"
        className="text-[#B52D27] shrink-0"
      >
        <path
          d="M2 12 C12 4, 22 4, 31 11 M25 6 L31 11 L24 15"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </div>
);
