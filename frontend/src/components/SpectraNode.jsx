"use client";
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, Zap, Target, Box, Code2, ShieldCheck, Terminal } from 'lucide-react';

const iconMap = {
  core: <Target size={16} className="text-rose-500" />,
  logic: <Cpu size={16} className="text-blue-500" />,
  api: <Terminal size={16} className="text-emerald-500" />,
  infra: <Box size={16} className="text-zinc-500" />,
  entry: <Code2 size={16} className="text-amber-500" />
};

export default function SpectraNode({ data }) {
  const layer = data.layer || 'logic';
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
      <div className="relative bg-white/90 backdrop-blur-xl border border-zinc-200 rounded-2xl p-6 min-w-[320px] shadow-sm transition-all group-hover:border-blue-400/50">
        <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-2 !h-2 !border-none" />
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-zinc-50 rounded-lg border border-zinc-100">{iconMap[layer]}</div>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{layer}</span>
          </div>
          <div className="flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-black text-emerald-700 uppercase">Live_Node</span>
          </div>
        </div>

        <h4 className="text-lg font-black text-zinc-900 mb-2 leading-tight tracking-tighter uppercase italic pr-4">
          {data.label}
        </h4>
        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed opacity-80">
          {data.description}
        </p>

        <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
           <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-zinc-100 rounded text-[8px] font-bold text-zinc-400 uppercase">v2.5.0</span>
              <span className="px-2 py-0.5 bg-zinc-100 rounded text-[8px] font-bold text-zinc-400 uppercase">Secure</span>
           </div>
           <ShieldCheck size={14} className="text-zinc-200" />
        </div>

        <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2 !border-none" />
      </div>
    </div>
  );
}