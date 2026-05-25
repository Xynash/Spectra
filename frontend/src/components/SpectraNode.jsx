"use client";
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, Target, Box, Code2, ShieldCheck, Terminal, Layout, Database } from 'lucide-react';

const LAYER_CONFIG = {
  core:   { icon: <Target size={15} />,   color: 'text-rose-500',    bg: 'bg-rose-50',    border: 'border-rose-200',   pill: 'bg-rose-500'    },
  logic:  { icon: <Cpu size={15} />,      color: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',   pill: 'bg-blue-500'    },
  api:    { icon: <Terminal size={15} />, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200',pill: 'bg-emerald-500' },
  infra:  { icon: <Database size={15} />, color: 'text-violet-500',  bg: 'bg-violet-50',  border: 'border-violet-200', pill: 'bg-violet-500'  },
  ui:     { icon: <Layout size={15} />,   color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',  pill: 'bg-amber-500'   },
  entry:  { icon: <Code2 size={15} />,    color: 'text-zinc-500',    bg: 'bg-zinc-50',    border: 'border-zinc-200',   pill: 'bg-zinc-800'    },
};

const TIER_STYLES = {
  0: { width: 'min-w-[380px]', titleSize: 'text-2xl', accent: 'from-rose-500/10 to-rose-500/5' },
  1: { width: 'min-w-[300px]', titleSize: 'text-lg',  accent: 'from-blue-500/10 to-blue-500/5' },
  2: { width: 'min-w-[260px]', titleSize: 'text-base',accent: 'from-emerald-500/10 to-emerald-500/5' },
  3: { width: 'min-w-[220px]', titleSize: 'text-sm',  accent: 'from-zinc-500/10 to-zinc-500/5' },
};

export default function SpectraNode({ data }) {
  const layer = data.layer || 'logic';
  const tier  = data.tier  ?? 1;
  const cfg   = LAYER_CONFIG[layer] || LAYER_CONFIG.logic;
  const ts    = TIER_STYLES[tier]   || TIER_STYLES[1];

  const isRoot = tier === 0;

  return (
    <div className="group relative">
      {/* Glow halo */}
      <div className={`absolute -inset-1 bg-gradient-to-br ${ts.accent} rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-500`} />

      <div
        className={`
          relative bg-white/95 backdrop-blur-xl border rounded-2xl p-5 shadow-sm
          transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5
          ${ts.width}
          ${isRoot ? 'border-zinc-900 ring-2 ring-zinc-900/10' : 'border-zinc-200 group-hover:border-zinc-400/60'}
        `}
      >
        {/* Top Handle */}
        {!isRoot && (
          <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-2 !h-2 !border-2 !border-white" />
        )}

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.border}`}>
            <span className={cfg.color}>{cfg.icon}</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{layer}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tier badge */}
            <span className={`px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider ${cfg.pill}`}>
              T{tier}
            </span>
            {/* Live pulse */}
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-emerald-700 uppercase">live</span>
            </div>
          </div>
        </div>

        {/* Label */}
        <h4 className={`font-black text-zinc-900 tracking-tighter uppercase italic leading-tight mb-2 ${ts.titleSize}`}>
          {data.label}
        </h4>

        {/* Description */}
        {data.description && (
          <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
            {data.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="px-2 py-0.5 bg-zinc-100 rounded text-[8px] font-bold text-zinc-400 uppercase">
              {isRoot ? 'Root' : `Layer ${tier}`}
            </span>
          </div>
          <ShieldCheck size={13} className="text-zinc-200" />
        </div>

        {/* Bottom Handle */}
        <Handle type="source" position={Position.Bottom} className="!bg-zinc-400 !w-2 !h-2 !border-2 !border-white" />
      </div>
    </div>
  );
}