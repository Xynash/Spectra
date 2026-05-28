"use client";
import { motion } from "framer-motion";

const projects = [
  { id: 1, title: "Layer5/Meshery", color: "bg-[#FFD600]", tag: "Cloud Native" },
  { id: 2, title: "Spectra/Core", color: "bg-[#FF5C00]", tag: "AI Engine" },
  { id: 3, title: "React/Graph", color: "bg-[#00F0FF]", tag: "Visualization" },
  { id: 4, title: "Tree-Sitter/AST", color: "bg-[#7000FF]", tag: "Static Analysis" },
];

export default function ProjectGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-7xl px-6 my-20">
      {projects.map((p) => (
        <motion.div
          key={p.id}
          whileHover={{ scale: 1.02 }}
          className={`${p.color} border-2 border-black rounded-3xl p-8 h-80 flex flex-col justify-between group cursor-pointer shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all`}
        >
          <div className="flex justify-between items-start">
             <span className="bg-white border-2 border-black px-3 py-1 rounded-full text-[10px] font-bold uppercase">
               {p.tag}
             </span>
          </div>
          <div>
            <h3 className="text-2xl font-black leading-tight mb-2 text-black">{p.title}</h3>
            <div className="w-10 h-1 bg-black rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
