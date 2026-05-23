"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import { Search, ArrowRight, Zap, Code, Layers, Sparkles, Rocket, Star, Cpu, Moon, Sun, Loader2, Globe } from "lucide-react";

const TechTicker = dynamic(() => import('../components/TechTicker'), { ssr: false });
const ProjectRow = dynamic(() => import('../components/ProjectRow'), { ssr: false });
const Sentinel = dynamic(() => import('../components/Sentinel'), { ssr: false });

const GithubIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LANDING_PROJECTS = [
  { id: 1, title: "meshery/meshery", color: "bg-[#FFD600]", tag: "Go / React", stars: "4.2k", complexity: "High" },
  { id: 2, title: "spectra/core-ai", color: "bg-[#FF5C00]", tag: "Python / RAG", stars: "1.1k", complexity: "Medium" },
  { id: 3, title: "kubernetes/k8s", color: "bg-[#00F0FF]", tag: "Go / Cloud", stars: "102k", complexity: "Critical" },
  { id: 4, title: "facebook/react", color: "bg-[#7000FF]", tag: "JS / Library", stars: "210k", complexity: "High" },
];

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setRevelationData = useStore((state) => state.setRevelationData);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const handleAnalyze = async () => {
    if (!repoUrl) return alert("Paste a GitHub URL first.");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setRevelationData(data.graph);
        router.push('/reveal');
      } else {
        // FALLBACK FOR 429 ERRORS
        setRevelationData({
          nodes: [{ id: '1', data: { label: 'Repository Root', layer: 'infra' }, position: { x: 250, y: 0 } }, { id: '2', data: { label: 'Logic Layer', layer: 'logic' }, position: { x: 250, y: 150 } }],
          edges: [{ id: 'e1-2', source: '1', target: '2', animated: true }]
        });
        router.push('/reveal');
      }
    } catch (err) { alert("Backend offline."); } finally { setLoading(false); }
  };

  return (
    <main className={`min-h-screen relative flex flex-col items-center pt-6 bg-dots transition-all duration-700 overflow-x-hidden ${isDark ? "bg-[#050505] text-white" : "bg-[#FCFAF7] text-black"}`}>
      <div className={`fixed top-20 left-10 opacity-20 animate-pulse transition-colors ${isDark ? "text-purple-400" : "text-rose-400"}`}><Star size={100} fill="currentColor" /></div>
      <div className={`fixed bottom-40 left-20 opacity-20 animate-bounce transition-colors ${isDark ? "text-blue-600" : "text-blue-400"}`}><Cpu size={80} /></div>
      <div className={`fixed top-40 right-10 opacity-20 transition-colors ${isDark ? "text-purple-600" : "text-amber-400"}`}><Sparkles size={120} /></div>

      <nav className="w-full max-w-6xl flex items-center justify-between px-10 py-6 z-50">
        <div className="flex items-center space-x-3 group">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center dj-shadow-sm border-2 border-black transition-all ${isDark ? "bg-white text-black" : "bg-black text-white"}`}><GithubIcon size={24} /></div>
          <span className="font-black text-3xl tracking-tighter uppercase">SPECTRA.</span>
        </div>
        <div className={`hidden md:flex items-center space-x-10 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
          <Link href="/how" className="hover:text-emerald-500 transition-colors">How it works</Link>
          <Link href="/explore" className="hover:text-emerald-500 transition-colors">Explore</Link>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsDark(!isDark)} className={`p-3 border-2 border-black rounded-xl dj-shadow-sm transition-all ${isDark ? "bg-zinc-800 text-yellow-400" : "bg-white text-black"}`}>{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
          <Link href="/explore" className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest dj-shadow-sm transition-all ${isDark ? "bg-purple-600 text-white" : "bg-black text-white"}`}>Explore Repos</Link>
        </div>
      </nav>

      <section className="text-center px-4 max-w-6xl mt-20 mb-32 z-10 flex flex-col items-center">
        <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter leading-[0.8] mb-10 uppercase text-center">
          A codebase <br /> intelligence <br /> 
          <span className="flex items-center justify-center flex-wrap">with a <div className="inline-block w-28 h-28 md:w-40 md:h-40 mx-6 translate-y-4"><Sentinel /></div><span className={`${isDark ? "text-purple-500" : "text-emerald-500"} italic underline decoration-black decoration-8 px-4 transition-colors`}>twist.</span></span>
        </h1>
        <p className={`text-xl md:text-3xl font-medium max-w-3xl mx-auto mb-16 mt-20 leading-relaxed italic ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>"The ultimate repo intelligence for everyone. <br /> Map, learn, and contribute—seamlessly."</p>

        {/* CENTERED SEARCH BAR */}
        <div className="w-full max-w-3xl relative group mb-10">
          <div className={`border-4 border-black p-6 rounded-[2.5rem] dj-shadow flex items-center transition-all group-focus-within:-translate-y-2 ${isDark ? "bg-zinc-900" : "bg-white"}`}>
            <Search className="ml-4 text-zinc-400" size={32} />
            <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="Paste GitHub Repository URL..." className={`flex-1 bg-transparent border-none outline-none px-6 font-bold text-2xl transition-colors ${isDark ? "text-white" : "text-black"}`} />
            <button onClick={handleAnalyze} disabled={loading} className={`border-2 border-black px-12 py-5 rounded-2xl font-black text-black hover:scale-105 transition-all text-xl flex items-center gap-3 ${isDark ? "bg-purple-600" : "bg-emerald-500"} disabled:opacity-50`}>
               {loading ? <Loader2 className="animate-spin" /> : <Rocket size={24} />}
               <span>{loading ? "SCANNING" : "ANALYZE"}</span>
            </button>
          </div>
        </div>
      </section>

      <div className="w-full mb-40 mt-10"><TechTicker /></div>

      <section className={`w-full py-40 border-y-4 border-black transition-colors relative overflow-hidden ${isDark ? "bg-zinc-900/50" : "bg-[#F3F1EE]"}`}>
        <div className="max-w-6xl mx-auto px-10 mb-20 text-center">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-4">Latest <span className={isDark ? "text-purple-500" : "text-emerald-500"}>Revelations.</span></h2>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-[10px]">Architectural index of the open source galaxy</p>
        </div>
        <ProjectRow projects={LANDING_PROJECTS} />
        <div className="mt-24 flex justify-center">
          <Link href="/explore" className={`border-4 border-black px-12 py-5 rounded-2xl font-black uppercase text-sm dj-shadow transition-all flex items-center gap-4 group ${isDark ? "bg-zinc-800 text-white hover:bg-white hover:text-black" : "bg-white text-black hover:bg-black hover:text-white"}`}>
            <span>Enter the full spectrum</span>
            <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>

      <section className="py-40 flex flex-col items-center text-center max-w-7xl px-6 relative z-10">
         <h2 className="text-7xl md:text-[10rem] font-black tracking-tighter mb-10 leading-[0.8] uppercase text-center">We didn't reinvent the <br /> wheel. Just analysis.</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mt-40 w-full">
            <FeatureItem icon={<Sparkles size={48} />} color={isDark ? "bg-purple-900" : "bg-amber-300"} title="Auto Scan" isDark={isDark} />
            <FeatureItem icon={<Code size={48} />} color={isDark ? "bg-blue-900" : "bg-rose-400"} title="Logic Map" isDark={isDark} />
            <FeatureItem icon={<Layers size={48} />} color={isDark ? "bg-emerald-900" : "bg-blue-400"} title="Deep Context" isDark={isDark} />
         </div>
      </section>

      <footer className={`w-full border-t-4 border-black py-24 flex flex-col items-center transition-colors ${isDark ? "bg-[#050505]" : "bg-white"}`}>
         <div className={`p-6 rounded-3xl dj-shadow-sm mb-12 border-2 border-black ${isDark ? "bg-white text-black" : "bg-black text-white"}`}><GithubIcon size={48} /></div>
         <span className="font-black text-xs uppercase tracking-[1em] opacity-30 text-center">SPECTRA // 2025</span>
      </footer>
    </main>
  );
}

function FeatureItem({ icon, color, title, isDark }) {
  return (
    <div className="flex flex-col items-center group cursor-help">
      <div className={`w-32 h-32 ${color} rounded-[3rem] border-4 border-black dj-shadow-sm flex items-center justify-center mb-10 group-hover:rotate-6 transition-transform ${isDark ? "text-white" : "text-black"}`}>{icon}</div>
      <h4 className="text-4xl font-black tracking-tighter uppercase">{title}</h4>
      <div className={`w-10 h-1.5 rounded-full mt-6 opacity-20 group-hover:w-20 transition-all ${isDark ? "bg-white" : "bg-black"}`} />
    </div>
  );
}