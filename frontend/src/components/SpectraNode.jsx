"use client";
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, Target, Code2, ShieldCheck, Terminal, Layout, Database, MousePointer2, Zap, GitBranch } from 'lucide-react';

const LAYER_CONFIG = {
  core:              { icon: <Target size={13} />,    color: 'text-rose-500',    bg: 'bg-rose-50',    border: 'border-rose-200',    pill: 'bg-rose-500'    },
  logic:             { icon: <Cpu size={13} />,       color: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',    pill: 'bg-blue-500'    },
  api:               { icon: <Terminal size={13} />,  color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', pill: 'bg-emerald-500' },
  infra:             { icon: <Database size={13} />,  color: 'text-violet-500',  bg: 'bg-violet-50',  border: 'border-violet-200',  pill: 'bg-violet-500'  },
  ui:                { icon: <Layout size={13} />,    color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',   pill: 'bg-amber-500'   },
  entry:             { icon: <Code2 size={13} />,     color: 'text-zinc-500',    bg: 'bg-zinc-50',    border: 'border-zinc-200',    pill: 'bg-zinc-800'    },
  detail_what:       { icon: <Target size={13} />,    color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',    pill: 'bg-rose-500'    },
  detail_how:        { icon: <Cpu size={13} />,       color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    pill: 'bg-blue-500'    },
  detail_files:      { icon: <Code2 size={13} />,     color: 'text-zinc-600',    bg: 'bg-zinc-100',   border: 'border-zinc-200',    pill: 'bg-zinc-700'    },
  detail_contribute: { icon: <Zap size={13} />,       color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', pill: 'bg-emerald-600' },
  detail_why:        { icon: <GitBranch size={13} />, color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   pill: 'bg-amber-500'   },
};

const TIER_STYLES = {
  0: { width: 'w-[340px]', titleSize: 'text-xl',   padding: 'p-6' },
  1: { width: 'w-[280px]', titleSize: 'text-base', padding: 'p-5' },
  2: { width: 'w-[250px]', titleSize: 'text-sm',   padding: 'p-4' },
  3: { width: 'w-[220px]', titleSize: 'text-xs',   padding: 'p-3.5' },
  4: { width: 'w-[260px]', titleSize: 'text-xs',   padding: 'p-4' },
};

// ── Detail card ───────────────────────────────────────────────────────────────
function DetailNode({ data }) {
  const cfg = LAYER_CONFIG[data.layer] || LAYER_CONFIG.detail_what;
  return (
    <div className="w-[260px] bg-white border-2 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5" style={{ borderColor: 'inherit' }}>
      <Handle type="target" position={Position.Top} className="!bg-zinc-200 !w-1.5 !h-1.5 !border !border-white" />
      <div className={`px-4 py-2.5 ${cfg.bg} border-b ${cfg.border} flex items-center gap-2`}>
        <span className={cfg.color}>{cfg.icon}</span>
        <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{data.detailType}</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">{data.label}</p>
        {data.files?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-100">
            {data.files.slice(0, 4).map((f, i) => (
              <span key={i} className="px-2 py-1 bg-zinc-900 text-white rounded-lg text-[8px] font-black font-mono">{f}</span>
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-200 !w-1.5 !h-1.5 !border !border-white" />
    </div>
  );
}

// ── Architecture node ─────────────────────────────────────────────────────────
export default function SpectraNode({ data }) {
  const [hovered, setHovered] = useState(false);

  const layer    = data.layer || 'logic';
  const tier     = data.tier  ?? 1;
  const isRoot   = tier === 0;
  const isDetail = layer.startsWith('detail_');

  if (isDetail) return <DetailNode data={data} />;

  const cfg = LAYER_CONFIG[layer] || LAYER_CONFIG.logic;
  const ts  = TIER_STYLES[Math.min(tier, 4)] || TIER_STYLES[1];
  const isClickable = !isRoot;

  return (
    <div
      className="group relative cursor-pointer select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Expanded ring — INSIDE the outer div, no overflow ── */}
      {data.isExpanded && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{ boxShadow: '0 0 0 2px #18181b' }}
        />
      )}

      {/* ── Hover dashed ring ── */}
      {isClickable && hovered && !data.isExpanded && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{ boxShadow: '0 0 0 2px #d4d4d8', borderStyle: 'dashed' }}
        />
      )}

      <div className={`
        relative bg-white border rounded-2xl shadow-sm ${ts.padding} ${ts.width}
        transition-all duration-200
        group-hover:shadow-md group-hover:-translate-y-0.5
        ${isRoot
          ? 'border-zinc-800 shadow-md'
          : data.isExpanded
            ? 'border-zinc-400 bg-zinc-50/80'
            : 'border-zinc-200 hover:border-zinc-300'
        }
      `}>
        {!isRoot && (
          <Handle type="target" position={Position.Top}
            className="!bg-zinc-300 !w-2 !h-2 !border-2 !border-white !rounded-full" />
        )}

        {/* Header: layer badge + tier + status */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.border} ${cfg.color}`}>
            {cfg.icon}
            <span>{layer}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black text-white uppercase ${cfg.pill}`}>
              T{tier}
            </span>
            {data.isExpanded ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 text-white rounded-md text-[8px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" /> open
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md text-[8px] font-black text-emerald-700 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> live
              </span>
            )}
          </div>
        </div>

        {/* Label */}
        <h4 className={`font-black text-zinc-900 tracking-tighter uppercase italic leading-snug mb-2 ${ts.titleSize}`}>
          {data.label}
        </h4>

        {/* Description */}
        {data.description && (
          <p className={`text-zinc-500 font-medium leading-relaxed ${tier <= 1 ? 'text-[12px]' : 'text-[11px]'} ${tier >= 3 ? 'line-clamp-1' : 'line-clamp-2'}`}>
            {data.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between">
          <span className="px-2 py-0.5 bg-zinc-100 rounded text-[8px] font-bold text-zinc-400 uppercase tracking-wide">
            {isRoot ? 'Root' : `Layer ${tier}`}
          </span>
          {isClickable && (hovered || data.isExpanded) && (
            <span className="flex items-center gap-1 text-[8px] font-black text-zinc-400 uppercase tracking-wide">
              <MousePointer2 size={9} />
              {data.isExpanded ? 'Collapse' : 'Expand'}
            </span>
          )}
          {isRoot && <ShieldCheck size={12} className="text-zinc-300" />}
        </div>

        <Handle type="source" position={Position.Bottom}
          className="!bg-zinc-300 !w-2 !h-2 !border-2 !border-white !rounded-full" />
      </div>
    </div>
  );
}