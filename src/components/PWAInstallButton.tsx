import React, { useState } from 'react';
import { Download, Share2, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, installPWA } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled) return null;

  // Chromium / Android / Desktop flow with beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        id="pwa-install-button"
        onClick={installPWA}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#CBA358] to-[#B88C3E] text-[#14181B] text-xs font-bold shadow-md shadow-[#CBA358]/20 hover:brightness-110 active:scale-95 transition-all duration-200 ${className}`}
        title="Instalar aplicativo na tela de início"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit manual flow)
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#20272E] text-[#CBA358] border border-[#CBA358]/40 text-xs font-bold hover:bg-[#28313A] transition-all duration-200 ${className}`}
          title="Instalar no iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#1A2026] border border-[#2D3642] p-6 shadow-2xl relative text-left">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-[#8895A3] hover:text-white hover:bg-[#252E38]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img
                  src="./favicon.png"
                  alt="Lucas Hoffmann Barber"
                  className="w-12 h-12 rounded-xl object-cover border border-[#CBA358]/30"
                />
                <div>
                  <h3 className="text-base font-bold text-white">Instalar App no iOS</h3>
                  <p className="text-xs text-[#8895A3]">Lucas Hoffmann Barber</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#CBD5E1] bg-[#14191D] p-4 rounded-xl border border-[#232A32] mb-5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#CBA358]/20 text-[#CBA358] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    Toque no botão de <strong>Compartilhar</strong> <Share2 className="w-3.5 h-3.5 inline text-[#38BDF8]" /> na barra inferior do Safari.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#CBA358]/20 text-[#CBA358] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Role o menu para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#CBA358]/20 text-[#CBA358] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    Confirme tocando em <strong>Adicionar</strong> no topo direito. O app abrirá em tela cheia como aplicativo nativo!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#CBA358] text-[#14181B] font-bold text-xs hover:brightness-110 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
