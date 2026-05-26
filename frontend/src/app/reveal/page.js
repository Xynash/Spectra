"use client";
import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  MarkerType, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../../lib/store";
import SpectraNode from "../../components/SpectraNode";
import {
  ArrowLeft, BookOpen, Target, MessageSquare, X, Loader2,
  ShieldCheck, RefreshCw, GitBranch, Zap, AlertTriangle,
  FileCode, Users, Lightbulb, Rocket, Brain, Star, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Edge style ───────────────────────────────────────────────────────────────
const defaultEdgeOptions = {
  type: "smoothstep", animated: true,
  style: { stroke: "#94a3b8", strokeWidth: 2, opacity: 0.7 },
  labelStyle: { fill: "#1e293b", fontWeight: 900, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" },
  labelBgPadding: [6, 3],
  labelBgStyle: { fill: "#fff", stroke: "#e2e8f0", strokeWidth: 1 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8", width: 18, height: 18 },
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const TIER_Y = { 0: 0, 1: 420, 2: 840, 3: 1260 };
const NODE_W = 340;
const H_GAP  = 70;

function computeLayout(nodes, edges) {
  const tiers = { 0: [], 1: [], 2: [], 3: [] };
  nodes.forEach(n => {
    const t = n.data?.tier ?? 1;
    if (tiers[t]) tiers[t].push({ ...n });
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

const TIER_META = [
  { tier: 0, label: "Tier 0 · Root Identity",  color: "bg-rose-500"    },
  { tier: 1, label: "Tier 1 · Major Domains",  color: "bg-blue-500"    },
  { tier: 2, label: "Tier 2 · Sub-Systems",    color: "bg-emerald-500" },
  { tier: 3, label: "Tier 3 · Execution DNA",  color: "bg-zinc-800"    },
];

const COMPLEXITY_CONFIG = {
  beginner:     { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Beginner Friendly" },
  intermediate: { color: "bg-amber-100 text-amber-700 border-amber-200",       label: "Intermediate"      },
  advanced:     { color: "bg-red-100 text-red-700 border-red-200",             label: "Advanced"          },
};

// ─── No data screen ───────────────────────────────────────────────────────────
function NoDataScreen() {
  const router = useRouter();
  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8F9FB] gap-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-16 h-16 bg-zinc-100 rounded-3xl flex items-center justify-center">
          <AlertTriangle size={28} className="text-zinc-400" />
        </div>
        <h2 className="font-black text-2xl text-zinc-800 uppercase tracking-tighter">No Analysis Yet</h2>
        <p className="text-sm text-zinc-400 font-medium leading-relaxed">
          Paste a GitHub URL on the home page and hit Analyze to generate your architectural map.
        </p>
      </div>
      <button onClick={() => router.push("/")}
        className="px-10 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
        ← Back to Spectra
      </button>
    </main>
  );
}

// ─── Node Explain Panel ───────────────────────────────────────────────────────
function NodeExplainPanel({ nodeData, repoUrl, onClose }) {
  const [loading,     setLoading]     = useState(true);
  const [explanation, setExplanation] = useState(null);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    if (!nodeData) return;
    setLoading(true);
    setError(null);
    setExplanation(null);

    fetch("http://localhost:8000/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        node_label:       nodeData.label,
        node_description: nodeData.description || "",
        node_layer:       nodeData.layer || "logic",
        node_tier:        nodeData.tier ?? 1,
        repo_url:         repoUrl,
      }),
    })
      .then(r => r.json())
      .then(data => { setExplanation(data); setLoading(false); })
      .catch(e  => { setError("Could not load explanation."); setLoading(false); });
  }, [nodeData, repoUrl]);

  const complexity = explanation?.complexity || "intermediate";
  const cplx       = COMPLEXITY_CONFIG[complexity] || COMPLEXITY_CONFIG.intermediate;

  return (
    <div className="w-[480px] bg-white border-l border-zinc-200 z-[60] flex flex-col shadow-2xl h-full">

      {/* Header */}
      <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-start bg-zinc-900 text-white">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={13} className="text-zinc-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">AI Explanation</span>
          </div>
          <h2 className="font-black text-xl tracking-tighter uppercase italic truncate">
            {nodeData?.label}
          </h2>
          <p className="text-[10px] text-zinc-400 font-medium mt-0.5 line-clamp-1">
            {nodeData?.description}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors ml-3 shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
              <Loader2 size={22} className="animate-spin text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-zinc-700 uppercase tracking-tight">Asking Sentinel…</p>
              <p className="text-xs text-zinc-400 mt-1">Groq is analyzing this component</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-7 flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={24} className="text-red-400" />
            <p className="text-sm font-bold text-zinc-600">{error}</p>
          </div>
        )}

        {explanation && !loading && (
          <div className="p-7 space-y-6">

            {/* Complexity badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cplx.color}`}>
                {cplx.label}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Tier {nodeData?.tier} · {nodeData?.layer}
              </span>
            </div>

            {/* What it does */}
            <ExplainSection
              icon={<Target size={15} className="text-rose-500" />}
              title="What it does"
              color="rose"
              content={explanation.what_it_does}
            />

            {/* Why it exists */}
            <ExplainSection
              icon={<Lightbulb size={15} className="text-amber-500" />}
              title="Why it exists"
              color="amber"
              content={explanation.why_it_exists}
            />

            {/* How it works */}
            <ExplainSection
              icon={<Brain size={15} className="text-blue-500" />}
              title="How it works"
              color="blue"
              content={explanation.how_it_works}
            />

            {/* Who uses it */}
            <ExplainSection
              icon={<Users size={15} className="text-violet-500" />}
              title="Who uses it"
              color="violet"
              content={explanation.who_uses_it}
            />

            {/* Where to start */}
            <ExplainSection
              icon={<Rocket size={15} className="text-emerald-500" />}
              title="Where to start as a newcomer"
              color="emerald"
              content={explanation.newcomer_start}
            />

            {/* Key files */}
            {explanation.key_files?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileCode size={14} className="text-zinc-500" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Key Files</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {explanation.key_files.map((f, i) => (
                    <span key={i}
                      className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-black font-mono tracking-wide">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contribute tip */}
            {explanation.contribute_tip && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={13} className="text-emerald-600" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Contribution Tip</span>
                </div>
                <p className="text-[12px] text-emerald-800 font-medium leading-relaxed">
                  {explanation.contribute_tip}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ExplainSection({ icon, title, color, content }) {
  const colorMap = {
    rose:    "bg-rose-50 border-rose-100",
    amber:   "bg-amber-50 border-amber-100",
    blue:    "bg-blue-50 border-blue-100",
    violet:  "bg-violet-50 border-violet-100",
    emerald: "bg-emerald-50 border-emerald-100",
  };
  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color] || "bg-zinc-50 border-zinc-100"}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-[12px] text-zinc-700 font-medium leading-relaxed">{content}</p>
    </div>
  );
}

// ─── Main Reveal Content ──────────────────────────────────────────────────────
function RevealContent() {
  const { revelationData, activePanel, setActivePanel, activeRepoUrl, clearRevelation } = useStore();

  const [nodes,       setNodes,      onNodesChange] = useNodesState([]);
  const [edges,       setEdges,      onEdgesChange] = useEdgesState([]);
  const [isBuilding,  setIsBuilding]                = useState(true);
  const [builtTiers,  setBuiltTiers]                = useState([]);
  const [clickedNode, setClickedNode]               = useState(null); // node being explained
  const { fitView }                                  = useReactFlow();

  const nodeTypes = useMemo(() => ({ default: SpectraNode }), []);

  const hasData = (
    revelationData &&
    Array.isArray(revelationData.nodes) &&
    revelationData.nodes.length >= 3
  );

  const source = useMemo(() => {
    if (!hasData) return null;
    const d = revelationData;
    const needsLayout = d.nodes.some(n => !n.position);
    return needsLayout ? { ...d, nodes: computeLayout(d.nodes, d.edges || []) } : d;
  }, [revelationData, hasData]);

  const isFallback       = source?.source === "fallback";
  const fallbackFileCount = source?.file_count || 0;

  const sortedNodes = useMemo(() => {
    if (!source) return [];
    return [...source.nodes].sort((a, b) => {
      const ta = a.data?.tier ?? 1, tb = b.data?.tier ?? 1;
      return ta !== tb ? ta - tb : (a.position?.x ?? 0) - (b.position?.x ?? 0);
    });
  }, [source]);

  const allEdges = useMemo(() => {
    if (!source) return [];
    return (source.edges || []).map((e, i) => ({ ...e, id: e.id || `e_${i}` }));
  }, [source]);

  // ── Tier-by-tier reveal ───────────────────────────────────────────────────
  useEffect(() => {
    if (!source) return;
    setNodes([]); setEdges([]); setIsBuilding(true); setBuiltTiers([]);

    const tierGroups = {};
    sortedNodes.forEach(n => {
      const t = n.data?.tier ?? 1;
      tierGroups[t] = tierGroups[t] || [];
      tierGroups[t].push(n);
    });

    const tiers        = Object.keys(tierGroups).map(Number).sort();
    const addedNodeIds = new Set();
    let step           = 0;

    const revealNextTier = () => {
      if (step >= tiers.length) {
        setIsBuilding(false);
        setTimeout(() => fitView({ padding: 0.15, duration: 1200 }), 100);
        return;
      }
      const tier      = tiers[step];
      const tierNodes = tierGroups[tier];
      setNodes(prev => [...prev, ...tierNodes]);
      setBuiltTiers(prev => [...prev, tier]);
      tierNodes.forEach(n => addedNodeIds.add(n.id));
      setEdges(prev => {
        const newEdges = allEdges.filter(
          e => addedNodeIds.has(e.source) && addedNodeIds.has(e.target) && !prev.find(p => p.id === e.id)
        );
        return [...prev, ...newEdges];
      });
      setTimeout(() => fitView({ padding: 0.25, duration: 800 }), 80);
      step++;
      setTimeout(revealNextTier, step === 1 ? 600 : 900);
    };

    const t = setTimeout(revealNextTier, 300);
    return () => clearTimeout(t);
  }, [source, fitView, sortedNodes, allEdges]);

  // ── Node click handler ────────────────────────────────────────────────────
  const onNodeClick = useCallback((event, node) => {
    // Don't explain the root node
    if ((node.data?.tier ?? 0) === 0) return;
    setClickedNode(node.data);
    // Close other panels when explain opens
    setActivePanel(null);
  }, [setActivePanel]);

  if (!hasData) return <NoDataScreen />;

  const repoName = activeRepoUrl
    ? activeRepoUrl.replace("https://github.com/", "").replace("http://github.com/", "")
    : source?.repo || "Unknown Repository";

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
          {isFallback && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
              <Zap size={11} className="text-amber-500" />
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
                Structural map · {fallbackFileCount} files
              </span>
            </div>
          )}
          {isBuilding ? (
            <span className="flex items-center text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
              <Loader2 size={10} className="animate-spin mr-1.5" /> Decomposing DNA…
            </span>
          ) : (
            <span className="flex items-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              <ShieldCheck size={10} className="mr-1" /> Blueprint Deployed · {sortedNodes.length} nodes
            </span>
          )}

          {!isBuilding && (
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl">
              <ChevronRight size={10} className="text-zinc-400" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Click any node to explore</span>
            </div>
          )}

          <button onClick={clearRevelation}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 rounded-xl text-[10px] font-black uppercase text-zinc-500 hover:bg-zinc-50 transition-all">
            <RefreshCw size={11} /> New Analysis
          </button>
          <button className="bg-zinc-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider shadow hover:scale-105 transition-all">
            Export Map
          </button>
        </div>
      </nav>

      <div className="flex-1 flex relative overflow-hidden">

        {/* ── Action Deck ── */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50 p-2 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/50">
          <DeckButton active={activePanel === "guide"} onClick={() => { setActivePanel("guide"); setClickedNode(null); }} icon={<BookOpen size={20} />}     label="Guide" />
          <DeckButton active={activePanel === "scope"} onClick={() => { setActivePanel("scope"); setClickedNode(null); }} icon={<Target size={20} />}       label="Scope" />
          <DeckButton active={activePanel === "chat"}  onClick={() => { setActivePanel("chat");  setClickedNode(null); }} icon={<MessageSquare size={20} />} label="Chat"  />
        </div>

        {/* ── Tier Rail ── */}
        <div className="absolute left-[140px] top-0 bottom-0 w-px bg-zinc-200/80 z-10 pointer-events-none">
          {TIER_META.map(({ tier, label, color }) => (
            <TierPill key={tier} label={label} color={color}
              visible={builtTiers.includes(tier)}
              style={{ top: `calc(${TIER_Y[tier]}px * 0.18 + 60px)` }}
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
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.05}
            maxZoom={2}
          >
            <Background variant="dots" gap={28} size={1} color="#cbd5e1" />
            <Controls className="rounded-2xl shadow-sm" />
            <MiniMap
              className="rounded-[2rem] overflow-hidden border border-zinc-200"
              nodeColor={n => ["#f43f5e","#3b82f6","#10b981","#18181b"][n.data?.tier ?? 1] || "#94a3b8"}
            />
          </ReactFlow>
        </div>

        {/* ── Node Explain Panel (click) ── */}
        {clickedNode && (
          <NodeExplainPanel
            nodeData={clickedNode}
            repoUrl={activeRepoUrl}
            onClose={() => setClickedNode(null)}
          />
        )}

        {/* ── Standard Side Panel (deck buttons) ── */}
        {activePanel && !clickedNode && (
          <SidePanel
            panel={activePanel}
            onClose={() => setActivePanel(null)}
            repoName={repoName}
            nodes={sortedNodes}
            activeRepoUrl={activeRepoUrl}
          />
        )}
      </div>
    </main>
  );
}

// ─── Standard Side Panel (Guide / Scope / Chat) ───────────────────────────────
function SidePanel({ panel, onClose, repoName, nodes, activeRepoUrl }) {
  const [chatMsg,  setChatMsg]  = useState("");
  const [chatResp, setChatResp] = useState("");
  const [chatLoad, setChatLoad] = useState(false);

  const tierCounts = [0,1,2,3].map(t => ({
    tier: t, count: nodes.filter(n => (n.data?.tier ?? 1) === t).length,
    label: ["Root","Domains","Sub-Systems","DNA"][t],
  }));

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    setChatLoad(true); setChatResp("");
    try {
      const res  = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMsg, repo_url: activeRepoUrl }),
      });
      const data = await res.json();
      setChatResp(data.answer || "No response.");
    } catch { setChatResp("Sentinel offline."); }
    finally { setChatLoad(false); }
  };

  return (
    <div className="w-[440px] bg-white border-l border-zinc-200 z-[60] flex flex-col shadow-2xl">
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
        {panel === "scope" && (
          <>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              This map contains <strong className="text-zinc-900">{nodes.length} architectural nodes</strong> across 4 tiers.
            </p>
            <div className="space-y-3">
              {tierCounts.map(({ tier, count, label }) => (
                <div key={tier} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${["bg-rose-500","bg-blue-500","bg-emerald-500","bg-zinc-800"][tier]}`} />
                    <span className="text-xs font-black text-zinc-700 uppercase tracking-wide">Tier {tier} · {label}</span>
                  </div>
                  <span className="text-xs font-black text-zinc-400">{count} node{count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[11px] font-bold text-zinc-500 italic leading-relaxed">
                "Click any node to get a plain-English breakdown of what it does and how to contribute."
              </p>
            </div>
          </>
        )}

        {panel === "guide" && (
          <>
            <p className="text-xs text-zinc-500 font-medium">3-step onboarding guide for <strong className="text-zinc-900">{repoName}</strong>.</p>
            {[
              { step: "01", title: "Start at the Root", body: "The Tier 0 node (top of the map) tells you what this project does. Read its description, then clone the repo." },
              { step: "02", title: "Pick a Domain", body: "Click any Tier 1 node that interests you. The panel will explain what that domain does, why it exists, and where to start." },
              { step: "03", title: "Drill Down", body: "Follow edges down to Tier 2 and Tier 3. Click each node for a full AI breakdown — key files, how it works, and how to contribute." },
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

        {panel === "chat" && (
          <div className="flex flex-col gap-4 h-full">
            <p className="text-xs text-zinc-500 font-medium">
              Ask Sentinel anything about <strong className="text-zinc-900">{repoName}</strong>.
            </p>
            <div className="flex-1 min-h-[140px] bg-zinc-50 rounded-2xl border border-zinc-100 p-4">
              {chatLoad && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs font-bold">Sentinel thinking…</span>
                </div>
              )}
              {!chatLoad && chatResp && <p className="text-[12px] text-zinc-700 font-medium leading-relaxed">{chatResp}</p>}
              {!chatLoad && !chatResp && (
                <p className="text-[11px] text-zinc-300 font-bold italic">
                  e.g. "Where is authentication handled?" or "What does the API layer do?"
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Ask about this repo…"
                className="flex-1 border-2 border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-zinc-400 transition-colors"
              />
              <button onClick={sendChat} disabled={chatLoad}
                className="px-5 py-3 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:scale-105 transition-all disabled:opacity-40">
                Ask
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function TierPill({ label, color, visible, style }) {
  return (
    <div className={`absolute left-3 flex items-center gap-3 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`} style={style}>
      <div className={`px-3 py-1 ${color} text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow`}>
        {label}
      </div>
    </div>
  );
}

function DeckButton({ icon, onClick, active, label }) {
  return (
    <button onClick={onClick} title={label}
      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm
        ${active ? "bg-zinc-900 text-white scale-110 shadow-xl" : "bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"}`}>
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