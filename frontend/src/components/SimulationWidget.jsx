"use client";
import React, { useState, useEffect } from "react";
import { X, ChevronRight, Sparkles, Code2, GitBranch, Users, Star, Rocket } from "lucide-react";

const ROLES = [
  { id: "student",       label: "Student",              emoji: "🎓", desc: "Learning to code or studying CS" },
  { id: "developer",     label: "Developer",            emoji: "💻", desc: "Building software professionally" },
  { id: "contributor",   label: "Open Source Contributor", emoji: "🌍", desc: "Contributing to open source projects" },
  { id: "recruiter",     label: "Recruiter / Manager",  emoji: "🔍", desc: "Evaluating codebases and developers" },
];

const GOALS = [
  { id: "understand",  label: "Understand a codebase fast",   emoji: "⚡" },
  { id: "contribute",  label: "Find where to contribute",     emoji: "🚀" },
  { id: "onboard",     label: "Onboard onto a new project",   emoji: "🗺️" },
  { id: "evaluate",    label: "Evaluate code quality",        emoji: "🔬" },
  { id: "learn",       label: "Learn from great codebases",   emoji: "📚" },
];

export default function IntroModal({ onComplete }) {
  const [visible, setVisible]   = useState(false);
  const [step,    setStep]       = useState(0); // 0=name, 1=role, 2=goal, 3=done
  const [name,    setName]       = useState("");
  const [role,    setRole]       = useState(null);
  const [goals,   setGoals]      = useState([]);
  const [animate, setAnimate]    = useState(true);

  useEffect(() => {
    const profile = localStorage.getItem("spectra_profile");
    const consent = localStorage.getItem("spectra_consent");
    if (!profile && consent === "accepted") {
      setTimeout(() => setVisible(true), 400);
    }
  }, []);

  const nextStep = () => {
    setAnimate(false);
    setTimeout(() => { setStep(s => s + 1); setAnimate(true); }, 200);
  };

  const handleComplete = () => {
    const profile = { name, role, goals, joinedAt: new Date().toISOString() };
    localStorage.setItem("spectra_profile", JSON.stringify(profile));
    setStep(3);
    setTimeout(() => { setVisible(false); onComplete?.(profile); }, 2200);
  };

  const toggleGoal = (id) => {
    setGoals(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id]);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>

      <div className={`relative bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden transition-all duration-300 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

        {/* Progress bar */}
        <div className="h-1 bg-zinc-100">
          <div className="h-full bg-zinc-900 transition-all duration-500 rounded-full"
            style={{ width: `${((step) / 3) * 100}%` }} />
        </div>

        {/* Step 0 — Name */}
        {step === 0 && (
          <div className="p-8">
            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={26} className="text-white" />
            </div>
            <h2 className="font-black text-2xl text-zinc-900 uppercase tracking-tighter mb-1">
              Welcome to Spectra.
            </h2>
            <p className="text-sm text-zinc-500 font-medium mb-8 leading-relaxed">
              The codebase intelligence tool that makes any repo feel like home.
              Let's personalise your experience — takes 30 seconds.
            </p>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
              What should we call you?
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && nextStep()}
              placeholder="Your name or handle…"
              autoFocus
              className="w-full border-2 border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
            />
            <button
              onClick={nextStep}
              disabled={!name.trim()}
              className="mt-4 w-full py-3.5 bg-zinc-900 disabled:opacity-40 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1 — Role */}
        {step === 1 && (
          <div className="p-8">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Hey {name} 👋</p>
            <h2 className="font-black text-xl text-zinc-900 uppercase tracking-tighter mb-6">
              What describes you best?
            </h2>
            <div className="space-y-2.5">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => { setRole(r.id); setTimeout(nextStep, 260); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.01] ${
                    role === r.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
                  }`}>
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <p className="font-black text-sm text-zinc-900 uppercase tracking-tight">{r.label}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Goals */}
        {step === 2 && (
          <div className="p-8">
            <h2 className="font-black text-xl text-zinc-900 uppercase tracking-tighter mb-2">
              What do you want to do?
            </h2>
            <p className="text-xs text-zinc-400 font-medium mb-6">Pick all that apply.</p>
            <div className="space-y-2">
              {GOALS.map(g => (
                <button key={g.id} onClick={() => toggleGoal(g.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    goals.includes(g.id) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:border-zinc-400"
                  }`}>
                  <span className="text-lg">{g.emoji}</span>
                  <span className={`font-black text-xs uppercase tracking-wide ${goals.includes(g.id) ? "text-white" : "text-zinc-700"}`}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={handleComplete}
              disabled={goals.length === 0}
              className="mt-5 w-full py-3.5 bg-zinc-900 disabled:opacity-40 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
            >
              Let's Go <Rocket size={15} />
            </button>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
              <Star size={36} className="text-white" fill="white" />
            </div>
            <h2 className="font-black text-2xl text-zinc-900 uppercase tracking-tighter mb-2">
              You're all set, {name}!
            </h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              Spectra is ready for you. Paste any GitHub URL and watch the magic happen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}