import React, { useState } from 'react';
import emblemImg from '../assets/images/lucas_hoffmann_favicon_1788556005744.jpg';
import fullLogoImg from '../assets/images/lucas_hoffmann_logo_1788556017884.jpg';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'badge';
  className?: string;
  showSubtitle?: boolean;
}

export const BrasaoShieldCrest: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 128 128" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5D77F" />
        <stop offset="50%" stopColor="#CBA358" />
        <stop offset="100%" stopColor="#9E782E" />
      </linearGradient>
    </defs>
    {/* Outer Shield Crest */}
    <path
      d="M 64 16 C 80 16, 96 11, 96 11 C 98 44, 96 80, 64 112 C 32 80, 30 44, 32 11 C 32 11, 48 16, 64 16 Z"
      stroke="url(#shieldGoldGrad)"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#181D21"
    />
    {/* Inner detail border */}
    <path
      d="M 64 24 C 77 24, 88 20, 88 20 C 90 46, 88 74, 64 100 C 40 74, 38 46, 40 20 C 40 20, 51 24, 64 24 Z"
      stroke="url(#shieldGoldGrad)"
      strokeWidth="1.5"
      strokeOpacity="0.4"
      fill="none"
    />
    {/* Crossed scissors and razor */}
    <g stroke="url(#shieldGoldGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1="42" y1="84" x2="86" y2="40" strokeWidth="4.5" />
      <circle cx="40" cy="88" r="8" strokeWidth="3" />
      <circle cx="64" cy="62" r="2.5" fill="#CBA358" stroke="none" />
      <path d="M 88 88 L 68 64 L 54 44 C 52 38, 58 32, 66 38 L 84 56 Z" strokeWidth="3.5" fill="#CBA358" fillOpacity="0.25" />
      <circle cx="88" cy="88" r="7" strokeWidth="3" />
    </g>
  </svg>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  className = '',
  showSubtitle = true,
}) => {
  const [imgError, setImgError] = useState(false);

  // Icon only: Shield with Scissors & Razor (Emblem / Brasão)
  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#2A333C] to-[#161B1F] p-[1.5px] shadow-lg shadow-[#CBA358]/15 border border-[#CBA358]/40 group-hover:border-[#CBA358] transition-all duration-300">
          <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#181D21] flex items-center justify-center">
            {!imgError ? (
              <img
                src={emblemImg}
                alt="Brasão Lucas Hoffmann Barber"
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover p-1"
              />
            ) : (
              <BrasaoShieldCrest className="w-7 h-7" />
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
                  src={emblemImg}
                  alt="Brasão Lucas Hoffmann Barber"
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover p-1 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <BrasaoShieldCrest className="w-7 h-7" />
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
          {!imgError ? (
            <img
              src={fullLogoImg}
              alt="Lucas Hoffmann Barber - Logomarca Oficial"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              className="w-full h-auto rounded-[22px] object-contain shadow-inner"
            />
          ) : (
            <div className="p-8 flex flex-col items-center justify-center">
              <BrasaoShieldCrest className="w-20 h-20 mb-2" />
            </div>
          )}
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
