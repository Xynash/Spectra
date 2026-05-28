"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CookieBanner({ onAccept, onDecline }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("spectra_consent");
    if (!consent) setTimeout(() => setVisible(true), 1200);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("spectra_consent", "accepted");
    setVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorage.setItem("spectra_consent", "declined");
    setVisible(false);
    onDecline?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-full max-w-xl px-4">
      <div className="bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl shrink-0">🍪</span>
          <div>
            <p className="font-black text-sm text-zinc-900 uppercase tracking-tight">We use cookies</p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
              We use cookies to personalise your experience and remember your preferences on Spectra.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleDecline}
            className="flex-1 sm:flex-none px-4 py-2 border-2 border-zinc-200 rounded-xl text-xs font-black text-zinc-500 uppercase tracking-wide hover:border-zinc-400 transition-all"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 sm:flex-none px-5 py-2 bg-zinc-900 text-white border-2 border-black rounded-xl text-xs font-black uppercase tracking-wide hover:bg-zinc-700 transition-all"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

