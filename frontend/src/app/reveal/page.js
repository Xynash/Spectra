"use client";
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  MarkerType, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../../lib/store';
import SpectraNode from '../../components/SpectraNode';
import {
  ArrowLeft, BookOpen, Target, MessageSquare, X,
  Loader2, ShieldCheck, RefreshCw, GitBranch,
} from 'lucide-react';
import Link from 'next/link';

// ─── Edge style ──────────────────────────────────────────────────────────────
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 2, opacity: 0.7 },
  labelStyle: {
    fill: '#1e293b', fontWeight: 900, fontSize: 9,
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  labelBgPadding: [6, 3],
  labelBgStyle: { fill: '#fff', stroke: '#e2e8f0', strokeWidth: 1 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 18, height: 18 },
};

// ─── Expert fallback (used when no data from backend) ────────────────────────
const FALLBACK_DATA = {
  nodes: [
    { id: 'r',    data: { label: 'MESHERY_MGMT_PLANE',  layer: 'core',  tier: 0, description: 'Central orchestration plane for service mesh management.' }},
    { id: 'd1',   data: { label: 'ADAPTER_FRAMEWORK',   layer: 'logic', tier: 1, description: 'Standardised interface bridging multiple mesh implementations.' }},
    { id: 'd2',   data: { label: 'SERVER_RUNTIME',      layer: 'api',   tier: 1, description: 'Go-based HTTP/gRPC core handling state and business logic.' }},
    { id: 'd3',   data: { label: 'UI_CONSOLE',          layer: 'ui',    tier: 1, description: 'React/Next.js dashboard for user interactions and visualisation.' }},
    { id: 'd4',   data: { label: 'OPERATOR_CTRL',       layer: 'infra', tier: 1, description: 'Kubernetes operator managing cluster-level mesh lifecycle.' }},
    { id: 's1',   data: { label: 'ISTIO_ADAPTER',       layer: 'logic', tier: 2, description: 'Envoy-based sidecar control and telemetry relay.' }},
    { id: 's2',   data: { label: 'LINKERD_ADAPTER',     layer: 'logic', tier: 2, description: 'Rust-specific mesh orchestration and proxy wiring.' }},
    { id: 's3',   data: { label: 'REST_CONTROLLERS',    layer: 'api',   tier: 2, description: 'Endpoint definitions routing internal and external traffic.' }},
    { id: 's4',   data: { label: 'GRAPHQL_LAYER',       layer: 'api',   tier: 2, description: 'Federated query interface for schema-driven data access.' }},
    { id: 's5',   data: { label: 'COMPONENT_LIB',       layer: 'ui',    tier: 2, description: 'Shared UI primitives built on MeshMap design system.' }},
    { id: 's6',   data: { label: 'CRD_MANAGER',         layer: 'infra', tier: 2, description: 'Custom Resource Definition lifecycle and schema validation.' }},
    { id: 'e1',   data: { label: 'main.go',             layer: 'entry', tier: 3, description: 'Binary entry point — bootstraps server and adapter registry.' }},
    { id: 'e2',   data: { label: 'server.go',           layer: 'entry', tier: 3, description: 'HTTP listener init, middleware chain, and route mounting.' }},
    { id: 'e3',   data: { label: 'pages/_app.js',       layer: 'entry', tier: 3, description: 'Next.js app shell — global state, theming, and layout.' }},
  ],
  edges: [
    { source: 'r',  target: 'd1', label: 'DEPLOYS'      },
    { source: 'r',  target: 'd2', label: 'INITIALISES'  },
    { source: 'r',  target: 'd3', label: 'RENDERS'      },
    { source: 'r',  target: 'd4', label: 'OPERATES'     },
    { source: 'd1', target: 's1', label: 'FORKS'        },
    { source: 'd1', target: 's2', label: 'FORKS'        },
    { source: 'd2', target: 's3', label: 'ROUTES'       },
    { source: 'd2', target: 's4', label: 'EXPOSES'      },
    { source: 'd3', target: 's5', label: 'IMPORTS'      },
    { source: 'd4', target: 's6', label: 'MANAGES'      },
    { source: 's3', target: 'e1', label: 'EXECUTES'     },
    { source: 's3', target: 'e2', label: 'MOUNTS'       },
    { source: 's5', target: 'e3', label: 'BOOTSTRAPS'   },
  ],
};

// ─── Layout engine (mirrors engine.py compute_tree_layout) ───────────────────
const TIER_Y   = { 0: 0, 1: 420, 2: 840, 3: 1260 };
const NODE_W   = 340;
const H_GAP    = 70;

function computeLayout(nodes, edges) {
  const tiers = { 0: [], 1: [], 2: [], 3: [] };
  nodes.forEach(n => {
    const t = n.data?.tier ?? 1;
    tiers[t].push({ ...n });
  });

  const childrenOf = {};
  edges.forEach(e => {
    childrenOf[e.source] = childrenOf[e.source] || [];
    childrenOf[e.source].push(e.target);
  });

  const positioned = {};

  Object.keys(tiers).forEach(tierStr => {
    const t = Number(tierStr);
    const group = tiers[t];
    if (!group.length) return;

    const totalW = group.length * (NODE_W + H_GAP) - H_GAP;
    let x = 1000 - totalW / 2;

    group.forEach(n => {
      n.position = { x: Math.round(x), y: TIER_Y[t] };
      positioned[n.id] = n;
      x += NODE_W + H_GAP;
    });
  });

  return Object.values(positioned);
}

// ─── Main reveal content ──────────────────────────────────────────────────────
function RevealContent() {
  const { revelationData, activePanel, setActivePanel, activeRepoUrl, clearRevelation } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isBuilding, setIsBuilding]     = useState(true);
  const [builtTiers, setBuiltTiers]     = useState([]);
  const { fitView } = useReactFlow();

  const nodeTypes = useMemo(() => ({ default: SpectraNode }), []);

  // Resolve source: real data or fallback
  const source = useMemo(() => {
    const d = revelationData;
    if (d && Array.isArray(d.nodes) && d.nodes.length >= 3) {
      // Run layout if nodes lack positions
      const needsLayout = d.nodes.some(n => !n.position);
      if (needsLayout) {
        return { ...d, nodes: computeLayout(d.nodes, d.edges || []) };
      }
      return d;
    }
    return { ...FALLBACK_DATA, nodes: computeLayout(FALLBACK_DATA.nodes, FALLBACK_DATA.edges) };
  }, [revelationData]);

  // Sort nodes by tier then x for reveal order
  const sortedNodes = useMemo(() =>
    [...source.nodes].sort((a, b) => {
      const ta = a.data?.tier ?? 1, tb = b.data?.tier ?? 1;
      return ta !== tb ? ta - tb : (a.position?.x ?? 0) - (b.position?.x ?? 0);
    }), [source]);

  const allEdges = useMemo(() =>
    (source.edges || []).map((e, i) => ({ ...e, id: e.id || `e_${i}` })),
    [source]);

  // ── Tier-by-tier incremental reveal ────────────────────────────────────────
  useEffect(() => {
    setNodes([]); setEdges([]); setIsBuilding(true); setBuiltTiers([]);

    // Group nodes by tier
    const tierGroups = {};
    sortedNodes.forEach(n => {
      const t = n.data?.tier ?? 1;
      tierGroups[t] = tierGroups[t] || [];
      tierGroups[t].push(n);
    });

    const tiers = Object.keys(tierGroups).map(Number).sort();
    let addedNodeIds = new Set();
    let step = 0;

    const revealNextTier = () => {
      if (step >= tiers.length) {
        setIsBuilding(false);
        setTimeout(() => fitView({ padding: 0.15, duration: 1200 }), 100);
        return;
      }

      const currentTier = tiers[step];
      const tierNodes = tierGroups[currentTier];

      setNodes(prev => [...prev, ...tierNodes]);
      setBuiltTiers(prev => [...prev, currentTier]);
      tierNodes.forEach(n => addedNodeIds.add(n.id));

      // Add edges whose both endpoints are now visible
      setEdges(prev => {
        const newEdges = allEdges.filter(
          e => addedNodeIds.has(e.source) && addedNodeIds.has(e.target)
             && !prev.find(p => p.id === e.id)
        );
        return [...prev, ...newEdges];
      });

      setTimeout(() => fitView({ padding: 0.25, duration: 800 }), 80);
      step++;

      // Delay between tiers: root fast, then slower
      const delay = step === 1 ? 600 : 900;
      setTimeout(revealNextTier, delay);
    };

    const startTimer = setTimeout(revealNextTier, 300);
    return () => clearTimeout(startTimer);
  }, [source, fitView]);

  // ── Tier rail labels ────────────────────────────────────────────────────────
  const TIER_META = [
    { tier: 0, label: 'Tier 0 · Root Identity',  color: 'bg-rose-500',    y: TIER_Y[0] },
    { tier: 1, label: 'Tier 1 · Major Domains',  color: 'bg-blue-500',    y: TIER_Y[1] },
    { tier: 2, label: 'Tier 2 · Sub-Systems',    color: 'bg-emerald-500', y: TIER_Y[2] },
    { tier: 3, label: 'Tier 3 · Execution DNA',  color: 'bg-zinc-800',    y: TIER_Y[3] },
  ];

  const repoName = activeRepoUrl
    ? activeRepoUrl.replace('https://github.com/', '').replace('http://github.com/', '')
    : 'Unknown Repository';

  return (
    <main className="h-screen w-screen flex flex-col bg-[#F8F9FB] overflow-hidden font-sans">

      {/* ── Navbar ── */}
      <nav className="px-6 py-3 border-b border-zinc-200 flex justify-between items-center bg-white/95 backdrop-blur-xl z-[100] shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all">
            <ArrowLeft size={17} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <GitBranch size={13} className="text-zinc-400" />
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest truncate max-w-[300px]">
                {repoName}
              </span>
            </div>
            <h1 className="font-black text-sm tracking-tighter uppercase italic text-zinc-900 leading-none mt-0.5">
              Architectural Revelation
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isBuilding ? (
            <span className="flex items-center text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
              <Loader2 size={10} className="animate-spin mr-1.5" /> Decomposing DNA Silos…
            </span>
          ) : (
            <span className="flex items-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              <ShieldCheck size={10} className="mr-1" /> Blueprint Deployed · {sortedNodes.length} nodes
            </span>
          )}
          <button
            onClick={clearRevelation}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 rounded-xl text-[10px] font-black uppercase text-zinc-500 hover:bg-zinc-50 transition-all"
          >
            <RefreshCw size={11} /> New Analysis
          </button>
          <button className="bg-zinc-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider shadow hover:scale-105 transition-all">
            Export Map
          </button>
        </div>
      </nav>

      <div className="flex-1 flex relative">

        {/* ── Action Deck ── */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50 p-2 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/50">
          <DeckButton active={activePanel === 'guide'} onClick={() => setActivePanel('guide')} icon={<BookOpen size={20} />} label="Guide" />
          <DeckButton active={activePanel === 'scope'} onClick={() => setActivePanel('scope')} icon={<Target size={20} />}   label="Scope" />
          <DeckButton active={activePanel === 'chat'}  onClick={() => setActivePanel('chat')}  icon={<MessageSquare size={20} />} label="Chat" />
        </div>

        {/* ── Tier Rail ── */}
        <div className="absolute left-[140px] top-0 bottom-0 w-px bg-zinc-200/80 z-10 pointer-events-none">
          {TIER_META.map(({ tier, label, color }) => (
            <TierPill
              key={tier}
              label={label}
              color={color}
              visible={builtTiers.includes(tier)}
              style={{ top: `calc(${TIER_Y[tier]}px * 0.18 + 60px)` }}   // scaled visual hint
            />
          ))}
        </div>

        {/* ── React Flow Canvas ── */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            minZoom={0.05}
            maxZoom={2}
          >
            <Background variant="dots" gap={28} size={1} color="#cbd5e1" />
            <Controls className="rounded-2xl shadow-sm" />
            <MiniMap
              className="rounded-[2rem] overflow-hidden border border-zinc-200"
              nodeColor={(n) => {
                const t = n.data?.tier ?? 1;
                return ['#f43f5e','#3b82f6','#10b981','#18181b'][t] || '#94a3b8';
              }}
            />
          </ReactFlow>
        </div>

        {/* ── Side Panel ── */}
        {activePanel && (
          <SidePanel panel={activePanel} onClose={() => setActivePanel(null)} repoName={repoName} nodes={sortedNodes} />
        )}
      </div>
    </main>
  );
}

// ─── Side Panel ───────────────────────────────────────────────────────────────
function SidePanel({ panel, onClose, repoName, nodes }) {
  const tierCounts = [0,1,2,3].map(t => ({
    tier: t,
    count: nodes.filter(n => (n.data?.tier ?? 1) === t).length,
    label: ['Root','Domains','Sub-Systems','DNA'][t],
  }));

  return (
    <div className="w-[440px] bg-white border-l border-zinc-200 z-[60] flex flex-col animate-in slide-in-from-right duration-400 shadow-2xl">
      <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black tracking-tighter capitalize text-zinc-900 italic underline decoration-emerald-500 decoration-[6px]">
            {panel} Context
          </h2>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{repoName}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {panel === 'scope' && (
          <>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              This map contains <strong className="text-zinc-900">{nodes.length} architectural nodes</strong> across 4 tiers.
            </p>
            <div className="space-y-3">
              {tierCounts.map(({ tier, count, label }) => (
                <div key={tier} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${['bg-rose-500','bg-blue-500','bg-emerald-500','bg-zinc-800'][tier]}`} />
                    <span className="text-xs font-black text-zinc-700 uppercase tracking-wide">Tier {tier} · {label}</span>
                  </div>
                  <span className="text-xs font-black text-zinc-400">{count} node{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[11px] font-bold text-zinc-500 italic leading-relaxed">
                "Drag to explore. Scroll to zoom. Click a node to inspect its architectural role."
              </p>
            </div>
          </>
        )}

        {panel === 'guide' && (
          <>
            <p className="text-xs text-zinc-500 font-medium">3-step onboarding guide for <strong className="text-zinc-900">{repoName}</strong>.</p>
            {[
              { step: '01', title: 'Clone & Orient', body: 'Start at the Root (Tier 0) node — that\'s the project\'s mission. Clone the repo and open the top-level folders matching the Tier 1 Domain nodes.' },
              { step: '02', title: 'Trace a Path', body: 'Pick one Domain that interests you. Follow edges downward through Tier 2 Sub-Systems to the Tier 3 DNA entry files. Open those files first.' },
              { step: '03', title: 'Find Your Entry Point', body: 'Tier 3 nodes (dark badges) are runnable entry points — main.go, index.ts, server.py etc. Run one and read the first 50 lines. You\'re in.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4">
                <span className="text-3xl font-black text-zinc-200 shrink-0 leading-none">{step}</span>
                <div>
                  <h4 className="font-black text-sm text-zinc-900 uppercase tracking-tight mb-1">{title}</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </>
        )}

        {panel === 'chat' && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
              <MessageSquare size={20} className="text-zinc-400" />
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">RAG Chat — Coming Soon</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[260px]">
              Vector-embedded codebase search. Ask "Where is auth handled?" and Spectra will highlight the node.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function TierPill({ label, color, visible, style }) {
  return (
    <div
      className={`absolute left-3 flex items-center gap-3 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
      style={style}
    >
      <div className={`px-3 py-1 ${color} text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow`}>
        {label}
      </div>
    </div>
  );
}

function DeckButton({ icon, onClick, active, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${active ? 'bg-zinc-900 text-white scale-110 shadow-xl' : 'bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}
    >
      {icon}
    </button>
  );
}

export default function RevealPage() {
  return (
    <ReactFlowProvider>
      <RevealContent />
    </ReactFlowProvider>
  );
}