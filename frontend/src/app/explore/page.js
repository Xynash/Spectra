"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Star, Zap, Github, ExternalLink } from "lucide-react";
import { REPOS, CATEGORIES } from "../../lib/mockData";
import { useStore } from "../../lib/store";

const COMPLEXITY_COLOR = { Low: "bg-emerald-500", Medium: "bg-amber-400", High: "bg-orange-500", Critical: "bg-red-500" };
const COMPLEXITY_WIDTH = { Low: "45%", Medium: "60%", High: "80%", Critical: "95%" };

function RepoCard({ p, onAnalyze }) {
  const ghUrl     = `https://github.com/${p.owner}/${p.repo}`;
  const barColor  = COMPLEXITY_COLOR[p.complexity] || "bg-orange-500";
  const barWidth  = COMPLEXITY_WIDTH[p.complexity]  || "75%";

  return (
    <div
      className={`${p.color} rounded-[1.75rem] border-4 border-black overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-[1.03] hover:-translate-y-1`}
      style={{ boxShadow: "5px 5px 0px 0px rgba(0,0,0,1)" }}
      onClick={() => onAnalyze(p.owner, p.repo)}
    >
      {/* Top row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <span className="bg-white/20 text-black text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide border border-black/10">
          {p.tag}
        </span>
        <div className="flex items-center gap-1.5">
          <a href={ghUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="w-6 h-6 bg-black/80 hover:bg-black rounded-lg flex items-center justify-center transition-all"
            title="View on GitHub">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <button onClick={e => { e.stopPropagation(); onAnalyze(p.owner, p.repo); }}
            className="w-6 h-6 bg-black/80 hover:bg-black rounded-lg flex items-center justify-center transition-all"
            title="Analyze with Spectra">
            <Zap size={11} className="text-emerald-400"/>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 py-2">
        <h3 className="font-black text-lg text-black uppercase tracking-tighter leading-none">{p.title}</h3>
        <p className="font-black text-xs opacity-50 uppercase tracking-tight mt-0.5 italic">{p.subtitle}</p>
      </div>

      {/* Description */}
      <div className="px-4 pb-1">
        <p className="text-[10px] text-black/60 font-medium leading-relaxed line-clamp-2">{p.description}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 px-4 py-1.5">
        <span className="flex items-center gap-1 text-[10px] font-black text-black/70">
          <Star size={10} fill="currentColor"/> {p.stars}
        </span>
        <span className="text-[9px] font-black text-black/50 uppercase">{p.language}</span>
      </div>

      {/* Bar */}
      <div className="bg-black/80 mx-3 mb-3 rounded-xl px-3 py-2">
        <div className="flex justify-between mb-1">
          <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">Logic Depth</span>
          <span className="text-[7px] font-black text-white uppercase">{p.complexity || "High"}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full`} style={{ width: barWidth }}/>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const router = useRouter();
  const setRevelationData = useStore(s => s.setRevelationData);
  const setActiveRepoUrl  = useStore(s => s.setActiveRepoUrl);
  const clearRevelation   = useStore(s => s.clearRevelation);

  const filtered = useMemo(() => {
    return REPOS.filter(r => {
      const matchCat = category === "All" || r.tag === category;
      const matchSearch = !search || [r.title, r.subtitle, r.description, r.language, r.owner, r.repo]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [category, search]);

  const handleAnalyze = async (owner, repo) => {
    const url = `https://github.com/${owner}/${repo}`;
    clearRevelation();
    setActiveRepoUrl(url);

    try {
      const res  = await fetch("http://localhost:8000/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok && data.graph) {
        setRevelationData(data.graph);
        router.push("/reveal");
      } else {
        alert("Analysis failed. Check your backend.");
      }
    } catch {
      alert("Backend offline. Is uvicorn running on port 8000?");
    }
  };

  return (
    <main className="min-h-screen bg-[#FCFAF7] text-black">
      {/* Header */}
      <div className="border-b-4 border-black bg-white px-10 py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 border-2 border-black rounded-xl hover:bg-zinc-50 transition-all">
            <ArrowLeft size={18}/>
          </div>
          <span className="font-black text-xl uppercase tracking-tighter">← Return to Base</span>
        </Link>
        <div className="text-right">
          <h1 className="font-black text-4xl uppercase tracking-tighter italic">Explore the Spectrum.</h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">{REPOS.length} repos indexed · Click any card to analyze</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-zinc-100 px-10 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, language, technology…"
              className="w-full pl-10 pr-4 py-3 border-2 border-zinc-200 focus:border-zinc-900 rounded-2xl text-sm font-bold outline-none transition-all"
            />
          </div>
          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full border-2 text-[10px] font-black uppercase tracking-wide transition-all ${
                  category === c
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-10 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            {filtered.length} repos · Live query results
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="text-5xl">🔍</span>
            <p className="font-black text-xl uppercase text-zinc-400">No repos match your search</p>
            <button onClick={() => { setSearch(""); setCategory("All"); }}
              className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filtered.map(p => (
              <RepoCard key={p.id} p={p} onAnalyze={handleAnalyze}/>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-black py-10 text-center">
        <span className="font-black text-xs uppercase tracking-[0.8em] opacity-30">
          SPECTRA // THE ONBOARDING STANDARD // 2025
        </span>
      </footer>
    </main>
  );
}