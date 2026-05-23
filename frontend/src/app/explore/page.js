"use client";
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Search, Sparkles, Rocket, Globe } from "lucide-react";

const ProjectRow = dynamic(() => import('../../components/ProjectRow'), { ssr: false });

const MOCK_DB = [
  { id: 1, title: "meshery/meshery", color: "bg-[#FFD600]", tag: "Cloud Native", stars: "4.2k", complexity: "High" },
  { id: 2, title: "spectra/core-ai", color: "bg-[#FF5C00]", tag: "AI/ML", stars: "1.1k", complexity: "Medium" },
  { id: 3, title: "kubernetes/k8s", color: "bg-[#00F0FF]", tag: "Infrastructure", stars: "102k", complexity: "Critical" },
  { id: 4, title: "facebook/react", color: "bg-[#7000FF]", tag: "Frontend", stars: "210k", complexity: "High" },
  { id: 5, title: "envoyproxy/envoy", color: "bg-emerald-400", tag: "Security", stars: "24k", complexity: "Critical" },
  { id: 6, title: "layer5io/ui", color: "bg-rose-400", tag: "Frontend", stars: "800", complexity: "Medium" },
];

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");

  const filteredProjects = useMemo(() => {
    return MOCK_DB.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(query.toLowerCase());
      const matchesTag = activeTag === "All" || p.tag === activeTag;
      return matchesSearch && matchesTag;
    });
  }, [query, activeTag]);

  return (
    <main className="min-h-screen bg-[#FCFAF7] bg-dots flex flex-col items-center py-20 px-6">
      
      {/* 1. CENTERED HEADER */}
      <div className="max-w-4xl w-full text-center flex flex-col items-center mb-32">
        <Link href="/" className="inline-flex items-center space-x-2 font-black text-xs uppercase mb-12 hover:text-emerald-500 transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> <span>Return to Base</span>
        </Link>
        <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter text-black italic leading-[0.8] mb-12 uppercase">
          Explore the <br /> <span className="text-blue-500 underline decoration-black decoration-8">Spectrum.</span>
        </h1>

        {/* --- WORKING SEARCH BAR --- */}
        <div className="w-full max-w-2xl relative mt-10">
          <div className="bg-white border-4 border-black p-6 rounded-[2.5rem] dj-shadow flex items-center group focus-within:-translate-y-2 transition-all">
            <Search className="text-zinc-300 mr-4" size={32} />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by repository name or technology..." 
              className="bg-transparent outline-none font-bold text-2xl flex-1 text-black placeholder:text-zinc-200"
            />
          </div>
        </div>
      </div>

      {/* 2. CENTERED FILTERS */}
      <div className="flex flex-wrap justify-center gap-4 mb-32 max-w-4xl">
        {["All", "Cloud Native", "AI/ML", "Frontend", "Infrastructure", "Security"].map((tag) => (
          <button 
            key={tag} 
            onClick={() => setActiveTag(tag)}
            className={`px-8 py-3 border-2 border-black rounded-full text-[11px] font-black uppercase transition-all dj-shadow-sm active:translate-y-1 ${activeTag === tag ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'}`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 3. CENTERED RESULTS */}
      <div className="w-full flex flex-col items-center gap-40">
          <section className="w-full flex flex-col items-center">
              <div className="flex items-center justify-center space-x-4 mb-16">
                  <div className="w-12 h-12 bg-emerald-400 border-2 border-black rounded-2xl flex items-center justify-center dj-shadow-sm rotate-3">
                      <Rocket size={24} className="text-black" />
                  </div>
                  <h2 className="font-black text-4xl tracking-tighter text-black uppercase">Live Query Results</h2>
              </div>
              <ProjectRow projects={filteredProjects} />
          </section>
      </div>

      <footer className="mt-60 pb-20 text-center opacity-20">
         <span className="font-black text-[10px] uppercase tracking-[1em] text-black">Spectra // Indexing the world's code</span>
      </footer>
    </main>
  );
}