"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight, Rocket, Sparkles, CheckCircle, Circle } from "lucide-react";

// ─── Data structure ───────────────────────────────────────────────────────────
const ROLES = [
  { id: "student",     label: "Student",                  emoji: "🎓", desc: "Learning CS or software development" },
  { id: "developer",   label: "Developer",                emoji: "💻", desc: "Building software professionally"    },
  { id: "contributor", label: "Open Source Contributor",  emoji: "🌍", desc: "Contributing to open source repos"   },
  { id: "recruiter",   label: "Recruiter / Manager",      emoji: "🔍", desc: "Evaluating codebases or developers"  },
  { id: "other",       label: "Just Exploring",           emoji: "👀", desc: "Curious about what this does"        },
];

const EXPERIENCE = [
  { id: "beginner",      label: "Beginner",      desc: "< 1 year coding",       emoji: "🌱" },
  { id: "intermediate",  label: "Intermediate",  desc: "1–3 years",             emoji: "⚡" },
  { id: "experienced",   label: "Experienced",   desc: "3–7 years",             emoji: "🔥" },
  { id: "expert",        label: "Expert",        desc: "7+ years",              emoji: "🚀" },
];

const GOALS = [
  { id: "understand",  label: "Understand a codebase fast",    emoji: "⚡" },
  { id: "contribute",  label: "Find where to contribute",      emoji: "🛠️" },
  { id: "onboard",     label: "Onboard onto a new project",    emoji: "🗺️" },
  { id: "evaluate",    label: "Evaluate code quality",         emoji: "🔬" },
  { id: "learn",       label: "Learn from great codebases",    emoji: "📚" },
  { id: "interview",   label: "Prep for interviews",           emoji: "🎯" },
];

const HEAR_FROM = [
  "GitHub", "Twitter / X", "LinkedIn", "A friend", "YouTube", "Google Search", "Other"
];

export default function IntroModal({ onComplete }) {
  const [visible, setVisible] = useState(false);
  const [step,    setStep]    = useState(0);
  const [sliding, setSliding] = useState(false);

  // Form data
  const [name,       setName]       = useState("");
  const [role,       setRole]       = useState(null);
  const [experience, setExperience] = useState(null);
  const [goals,      setGoals]      = useState([]);
  const [hearFrom,   setHearFrom]   = useState(null);

  useEffect(() => {
    const profile = localStorage.getItem("spectra_profile");
    const consent = localStorage.getItem("spectra_consent");
    if (!profile && consent === "accepted") {
      setTimeout(() => setVisible(true), 500);
    }
  }, []);

  const goNext = () => {
    setSliding(true);
    setTimeout(() => { setStep(s => s + 1); setSliding(false); }, 220);
  };

  const toggleGoal = (id) =>
    setGoals(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id]);

  const handleSubmit = () => {
    const profile = {
      name, role, experience, goals, hearFrom,
      joinedAt: new Date().toISOString(),
      version: "1.0",
    };
    localStorage.setItem("spectra_profile", JSON.stringify(profile));
    setStep(4); // success screen
    setTimeout(() => { setVisible(false); onComplete?.(profile); }, 2000);
  };

  if (!visible) return null;

  const TOTAL_STEPS = 4;
  const progress    = (step / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>

      <div className={`relative bg-white w-full max-w-md rounded-3xl border-2 border-black overflow-hidden transition-all duration-300
        ${sliding ? "opacity-0 translate-y-3 scale-[0.98]" : "opacity-100 translate-y-0 scale-100"}`}
        style={{ boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}>

        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-100">
          <div className="h-full bg-zinc-900 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}/>
        </div>

        {/* Step indicator */}
        {step < 4 && (
          <div className="px-7 pt-5 flex items-center justify-between">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
              Step {step + 1} of {TOTAL_STEPS}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                  i <= step ? "w-5 bg-zinc-900" : "w-3 bg-zinc-200"
                }`}/>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 0: Name ── */}
        {step === 0 && (
          <div className="px-7 py-6">
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mb-5">
              <Sparkles size={22} className="text-white"/>
            </div>
            <h2 className="font-black text-2xl text-zinc-900 uppercase tracking-tighter mb-1">
              Welcome to Spectra.
            </h2>
            <p className="text-sm text-zinc-500 font-medium mb-6 leading-relaxed">
              The codebase intelligence tool that makes any repo feel like home. Quick intro — 4 steps, 30 seconds.
            </p>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
              What should we call you?
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && goNext()}
              placeholder="Your name or handle…"
              autoFocus
              className="w-full border-2 border-zinc-200 focus:border-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all"
            />
            <button onClick={goNext} disabled={!name.trim()}
              className="mt-4 w-full py-3.5 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-30 hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
              Continue <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* ── Step 1: Role ── */}
        {step === 1 && (
          <div className="px-7 py-6">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Hey {name} 👋</p>
            <h2 className="font-black text-xl text-zinc-900 uppercase tracking-tighter mb-5">
              What describes you?
            </h2>
            <div className="space-y-2">
              {ROLES.map(r => (
                <button key={r.id}
                  onClick={() => { setRole(r.id); setTimeout(goNext, 220); }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    role === r.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
                  }`}>
                  <span className="text-xl shrink-0">{r.emoji}</span>
                  <div>
                    <p className="font-black text-xs text-zinc-900 uppercase tracking-tight">{r.label}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{r.desc}</p>
                  </div>
                  {role === r.id && <CheckCircle size={16} className="text-zinc-900 ml-auto shrink-0"/>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Experience ── */}
        {step === 2 && (
          <div className="px-7 py-6">
            <h2 className="font-black text-xl text-zinc-900 uppercase tracking-tighter mb-1">
              Your experience level?
            </h2>
            <p className="text-xs text-zinc-400 font-medium mb-5">Helps us tailor your onboarding guide.</p>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {EXPERIENCE.map(e => (
                <button key={e.id}
                  onClick={() => { setExperience(e.id); setTimeout(goNext, 220); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    experience === e.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:border-zinc-400"
                  }`}>
                  <span className="text-2xl">{e.emoji}</span>
                  <div className="text-center">
                    <p className={`font-black text-xs uppercase tracking-tight ${experience === e.id ? "text-white" : "text-zinc-800"}`}>{e.label}</p>
                    <p className={`text-[9px] font-medium ${experience === e.id ? "text-zinc-300" : "text-zinc-400"}`}>{e.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Goals + How they heard ── */}
        {step === 3 && (
          <div className="px-7 py-6">
            <h2 className="font-black text-xl text-zinc-900 uppercase tracking-tighter mb-1">
              What do you want to do?
            </h2>
            <p className="text-xs text-zinc-400 font-medium mb-4">Pick all that apply.</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {GOALS.map(g => (
                <button key={g.id} onClick={() => toggleGoal(g.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] ${
                    goals.includes(g.id) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:border-zinc-400"
                  }`}>
                  <span className="text-sm">{g.emoji}</span>
                  <span className={`font-black text-[9px] uppercase tracking-wide leading-tight ${goals.includes(g.id) ? "text-white" : "text-zinc-700"}`}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>

            <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">
              How did you hear about Spectra?
            </label>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {HEAR_FROM.map(h => (
                <button key={h} onClick={() => setHearFrom(h)}
                  className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wide transition-all ${
                    hearFrom === h ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}>
                  {h}
                </button>
              ))}
            </div>

            <button onClick={handleSubmit} disabled={goals.length === 0}
              className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-30 hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
              Launch Spectra <Rocket size={15}/>
            </button>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && (
          <div className="px-7 py-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-5 animate-bounce"
              style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="font-black text-2xl text-zinc-900 uppercase tracking-tighter mb-2">
              You're all set, {name}!
            </h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-xs">
              Paste any GitHub URL and watch Spectra turn it into an architectural map.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

