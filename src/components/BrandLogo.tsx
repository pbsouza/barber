import React, { useState } from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'badge';
  className?: string;
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  className = '',
  showSubtitle = true,
}) => {
  const [imgError, setImgError] = useState(false);

  // Icon only: Shield with Scissors & Razor (Image 2 - Favicon / Emblem)
  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#2A333C] to-[#161B1F] p-[1.5px] shadow-lg shadow-[#CBA358]/10 border border-[#CBA358]/40 group-hover:border-[#CBA358] transition-all duration-300">
          <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#181D21] flex items-center justify-center">
            {!imgError ? (
              <img
                src="/favicon.png"
                alt="Lucas Hoffmann Barber"
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover p-1"
              />
            ) : (
              <svg viewBox="0 0 100 100" className="w-7 h-7 text-[#CBA358]" fill="none" stroke="currentColor">
                <path d="M50 15 C65 15 75 12 75 12 C77 38 75 62 50 85 C25 62 23 38 25 12 C25 12 35 15 50 15 Z" strokeWidth="4" />
                <path d="M36 68 L64 32 M34 72 A6 6 0 1 0 46 72 A6 6 0 1 0 34 72" strokeWidth="3" />
                <path d="M68 68 L52 48 L42 34 C40 30 46 26 52 30 L66 44" strokeWidth="3" />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact header logo: Elegant shield + crisp luxury typography
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        <div className="relative group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#2D3640] via-[#20272D] to-[#15191C] p-[1.5px] shadow-md shadow-black/60 border border-[#CBA358]/40 group-hover:border-[#E5C158] transition-all duration-300">
            <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#181D21] flex items-center justify-center">
              {!imgError ? (
                <img
                  src="/favicon.png"
                  alt="Lucas Hoffmann Barber"
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover p-1 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-[#CBA358] font-bold text-base">LH</div>
              )}
            </div>
          </div>
          {/* Subtle golden halo glow */}
          <div className="absolute -inset-0.5 rounded-2xl bg-[#CBA358]/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl font-black tracking-wider text-[#F6F2EA] font-['Cabinet_Grotesk',sans-serif] uppercase">
              LUCAS
            </span>
            <span className="text-lg sm:text-xl font-black tracking-wider text-[#CBA358] font-['Cabinet_Grotesk',sans-serif] uppercase">
              HOFFMANN
            </span>
          </div>
          {showSubtitle && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] uppercase font-extrabold tracking-[0.25em] text-[#A6B2BD]">
                BARBER
              </span>
              <span className="w-1 h-1 rounded-full bg-[#CBA358]" />
              <span className="text-[9px] uppercase font-bold tracking-wider text-[#CBA358] px-1.5 py-0.2 rounded bg-[#CBA358]/10 border border-[#CBA358]/20">
                CLUBE EXCLUSIVO
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full Hero & Badge: Ornate vintage barbershop logo
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative mb-4 group max-w-[280px] sm:max-w-[340px]">
        <div className="rounded-3xl p-1 bg-gradient-to-b from-[#2F3740] via-[#20272E] to-[#14181B] border border-[#CBA358]/40 shadow-2xl shadow-black/80">
          <img
            src="/logo.jpg"
            alt="Lucas Hoffmann Barber - Logomarca Oficial"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-auto rounded-[22px] object-contain shadow-inner"
          />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#F6F2EA] font-['Cabinet_Grotesk',sans-serif]">
          LUCAS <span className="text-[#CBA358]">HOFFMANN</span>
        </h2>
        <p className="text-xs uppercase tracking-[0.3em] text-[#CBA358] font-bold">
          BARBER & ESTÉTICA MASCULINA
        </p>
      </div>
    </div>
  );
};
