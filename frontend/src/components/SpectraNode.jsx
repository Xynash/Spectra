"use client";
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, Zap, Target, Box, Code2, Globe } from 'lucide-react';

const iconMap = {
  core: <Target size={18} className="text-rose-500" />,
  logic: <Cpu size={18} className="text-blue-500" />,
  api: <Globe size={18} className="text-emerald-500" />,
  infra: <Box size={18} className="text-zinc-500" />,
  entry: <Code2 size={18} className="text-amber-500" />
};

export default function SpectraNode({ data }) {
  const layer = data.layer || 'logic';

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-zinc-900/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700" />
      
      <div className="relative bg-white border border-zinc-200 rounded-[2rem] p-8 min-w-[320px] shadow-sm hover:border-zinc-400 transition-all">
        <Handle type="target" position={Position.Top} className="!bg-zinc-300 !w-3 !h-3 !border-white" />
        
        <div className="flex justify-between items-center mb-6">
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 group-hover:scale-110 transition-transform">
            {iconMap[layer] || iconMap.logic}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest leading-none mb-1">Architecture</span>
            <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-tighter">{layer}</span>
          </div>
        </div>

        <h4 className="text-xl font-black text-zinc-900 mb-3 tracking-tighter uppercase italic leading-none">
          {data.label}
        </h4>
        
        <p className="text-xs text-zinc-500 font-medium leading-relaxed opacity-80">
          {data.description || "Synthesizing logical dependencies..."}
        </p>

        <div className="mt-6 pt-6 border-t border-zinc-50 flex items-center justify-between">
            <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-zinc-200" />
                <div className="w-1 h-1 rounded-full bg-zinc-200" />
                <div className="w-1 h-1 rounded-full bg-zinc-200" />
            </div>
            <span className="text-[9px] font-bold text-zinc-300">ID: REVELATION_0X{Math.floor(Math.random()*1000)}</span>
        </div>

        <Handle type="source" position={Position.Bottom} className="!bg-zinc-300 !w-3 !h-3 !border-white" />
      </div>
    </div>
  );
}