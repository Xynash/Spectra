"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Star, Zap, Github } from "lucide-react";

const COMPLEXITY_COLOR = {
  Low:      "bg-emerald-500",
  Medium:   "bg-amber-400",
  High:     "bg-orange-500",
  Critical: "bg-red-500",
};

const COMPLEXITY_WIDTH = {
  Low: "45%", Medium: "60%", High: "80%", Critical: "95%",
};

export default function ProjectRow({ projects }) {
  const router = useRouter();

  const handleAnalyze = (e, owner, repo) => {
    e.stopPropagation();
    const url = `https://github.com/${owner}/${repo}`;
    // Store in sessionStorage for the home page to pick up
    sessionStorage.setItem("spectra_auto_analyze", url);
    router.push("/");
  };

  return (
    <div className="flex gap-6 overflow-x-auto px-10 pb-4 scrollbar-hide justify-center flex-wrap">
      {projects.map((p) => {
        const complexity = p.complexity || "High";
        const barColor   = COMPLEXITY_COLOR[complexity] || "bg-orange-500";
        const barWidth   = COMPLEXITY_WIDTH[complexity]  || "75%";
        const ghUrl      = `https://github.com/${p.owner || p.title.toLowerCase()}/${p.repo || p.title.toLowerCase()}`;

        return (
          <div
            key={p.id}
            className={`${p.color} rounded-[2rem] border-4 border-black flex-shrink-0 w-[220px] overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-105 hover:-translate-y-1`}
            style={{ boxShadow: "5px 5px 0px 0px rgba(0,0,0,1)" }}
            onClick={() => handleAnalyze({ stopPropagation: () => {} }, p.owner || p.title.toLowerCase(), p.repo || p.title.toLowerCase())}
          >
            {/* Top row: tag + icons */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="bg-white/20 backdrop-blur-sm text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wide border border-black/10">
                {p.tag}
              </span>
              <div className="flex items-center gap-1.5">
                {/* GitHub icon */}
                <a
                  href={ghUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="w-7 h-7 bg-black/80 hover:bg-black rounded-lg flex items-center justify-center transition-all"
                  title="View on GitHub"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
                {/* Analyze button */}
                <button
                  onClick={e => handleAnalyze(e, p.owner || p.title.toLowerCase(), p.repo || p.title.toLowerCase())}
                  className="w-7 h-7 bg-black/80 hover:bg-black rounded-lg flex items-center justify-center transition-all"
                  title="Analyze with Spectra"
                >
                  <Zap size={12} className="text-white"/>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="px-4 py-2">
              <h3 className="font-black text-xl text-black uppercase tracking-tighter leading-none">{p.title}</h3>
              <p className="font-black text-sm opacity-50 uppercase tracking-tight mt-0.5 italic">{p.subtitle}</p>
            </div>

            {/* Description */}
            {p.description && (
              <div className="px-4 py-1">
                <p className="text-[10px] text-black/60 font-medium leading-relaxed line-clamp-2">{p.description}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="flex items-center gap-1 text-[10px] font-black text-black/70">
                <Star size={11} fill="currentColor"/> {p.stars}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black text-black/70">
                <Zap size={11}/> ACTIVE NOW
              </span>
              {p.language && (
                <span className="ml-auto text-[9px] font-black text-black/50 uppercase">{p.language}</span>
              )}
            </div>

            {/* Complexity bar */}
            <div className="bg-black/80 mx-3 mb-3 rounded-xl px-3 py-2.5">
              <div className="flex justify-between mb-1.5">
                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Logic Depth</span>
                <span className="text-[8px] font-black text-white uppercase tracking-wide">{complexity}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: barWidth }}/>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

