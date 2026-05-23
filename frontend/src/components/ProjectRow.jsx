"use client";
import React from 'react';
import { motion } from "framer-motion";
import { Star, Zap, Code, ShieldCheck, ArrowUpRight, Activity } from "lucide-react";

export default function ProjectRow({ projects }) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="flex gap-12 overflow-x-auto no-scrollbar py-20 px-10 w-full justify-center perspective-1000">
      {projects.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 50, rotateX: 20 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.8, type: "spring" }}
          whileHover={{ 
            y: -25, 
            scale: 1.02,
            rotateY: 5,
            transition: { duration: 0.3 } 
          }}
          className={`${p.color} border-4 border-black rounded-[4rem] p-10 h-[520px] w-[420px] shrink-0 flex flex-col justify-between group cursor-pointer dj-shadow hover:shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden`}
        >
          {/* Animated Background Icon */}
          <div className="absolute -right-16 -top-16 opacity-5 group-hover:opacity-20 group-hover:rotate-90 transition-all duration-1000 text-black">
             <Code size={300} />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <span className="bg-white border-2 border-black px-5 py-2 rounded-full text-[10px] font-black uppercase text-black flex items-center gap-2 dj-shadow-sm">
                <ShieldCheck size={14} className="text-emerald-500" /> {p.tag}
              </span>
              <div className="bg-black text-white p-3 rounded-2xl group-hover:rotate-12 transition-transform">
                <ArrowUpRight size={20} />
              </div>
            </div>
            
            <h3 className="text-5xl font-black leading-[0.85] text-black tracking-tighter uppercase mb-2 group-hover:tracking-normal transition-all duration-500">
              {p.title.split('/')[0]} <br />
              <span className="italic text-black/40 group-hover:text-black transition-colors">
                {p.title.split('/')[1]}
              </span>
            </h3>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Stats Row */}
            <div className="flex space-x-4">
                <div className="bg-white/30 backdrop-blur-md border-2 border-black/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <Star size={16} fill="black" />
                    <span className="font-black text-sm">{p.stars}</span>
                </div>
                <div className="bg-white/30 backdrop-blur-md border-2 border-black/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <Activity size={16} className="text-black" />
                    <span className="font-black text-[10px] uppercase">Active Now</span>
                </div>
            </div>

            {/* Complexity Engine */}
            <div className="bg-black text-white rounded-[2.5rem] p-8 border-4 border-black dj-shadow-sm group-hover:bg-white group-hover:text-black transition-colors duration-500">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Logic Depth</span>
                </div>
                <span className="text-xs font-black uppercase italic">{p.complexity}</span>
              </div>
              <div className="w-full h-5 bg-zinc-800 border-2 border-black rounded-full overflow-hidden p-1">
                 <motion.div 
                   initial={{ width: 0 }}
                   whileInView={{ width: p.complexity === 'High' ? '75%' : p.complexity === 'Critical' ? '100%' : '50%' }}
                   transition={{ duration: 2, ease: "circOut" }}
                   className="h-full bg-emerald-400 rounded-full" 
                 />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}