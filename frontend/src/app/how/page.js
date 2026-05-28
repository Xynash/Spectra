"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, Brain, Zap, Sparkles, Star } from "lucide-react";

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-[#FCFAF7] bg-dots flex flex-col items-center py-20 px-6 relative overflow-hidden">
      {/* Centered Back Button */}
      <Link href="/" className="inline-flex items-center space-x-3 font-black text-xs uppercase mb-20 hover:text-emerald-600 transition-all group z-50">
        <div className="p-3 bg-white border-2 border-black rounded-xl dj-shadow-sm group-hover:-translate-x-1 transition-transform">
          <ArrowLeft size={16} />
        </div>
        <span>Headquarters</span>
      </Link>

      <div className="max-w-6xl w-full text-center flex flex-col items-center relative z-10">
        <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter leading-[0.8] mb-12 text-black uppercase">
          The engine <br /> behind the <span className="italic text-emerald-500 underline decoration-black decoration-8">curtain.</span>
        </h1>
        
        <p className="text-xl md:text-3xl text-zinc-400 max-w-4xl mb-32 font-medium leading-relaxed italic">
          "Spectra isn't just a UI. It's a high-performance pipeline that converts 
          chaotic source code into structured architectural intelligence."
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
          <TechCard icon={<Cpu size={48} />} step="01" title="DNA Ingestion" desc="GitHub GraphQL API integration to extract full-scale repository trees." />
          <TechCard icon={<Brain size={48} />} step="02" title="AST Decryption" desc="Tree-sitter parsing for multi-language semantic logic mapping." />
          <TechCard icon={<Zap size={48} />} step="03" title="RAG Reveal" desc="Vector-embedded search for real-time natural language codebase chat." />
        </div>
      </div>
      
      <div className="mt-40 opacity-10 rotate-12"><Sparkles size={200} /></div>
    </main>
  );
}

function TechCard({ icon, step, title, desc }) {
  return (
    <div className="bg-white border-4 border-black p-12 rounded-[4rem] dj-shadow hover:-translate-y-4 transition-all group flex flex-col items-center">
      <div className="w-24 h-24 bg-emerald-100 border-2 border-black rounded-[2rem] flex items-center justify-center text-black group-hover:rotate-12 transition-transform mb-10">
        {icon}
      </div>
      <span className="font-black text-6xl opacity-5 italic text-black mb-4">{step}</span>
      <h3 className="text-3xl font-black mb-6 tracking-tighter text-black uppercase">{title}</h3>
      <p className="text-zinc-500 font-bold leading-relaxed">{desc}</p>
    </div>
  );
}
