"use client";
import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
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
  Send, ChevronDown, ChevronRight, Star, Rocket, Brain,
  Users, Lightbulb, CheckCircle, Circle, Play, Square,
} from "lucide-react";
import Link from "next/link";
import SimulationWidget from "../../components/SimulationWidget";
import { useRouter } from "next/navigation";

// ─── Edge styles ──────────────────────────────────────────────────────────────
const defaultEdgeOptions = {
  type: "smoothstep", animated: false,
  style: { stroke: "#cbd5e1", strokeWidth: 2, opacity: 0.8 },
  labelStyle: { fill: "#1e293b", fontWeight: 900, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" },
  labelBgPadding: [6, 3],
  labelBgStyle: { fill: "#fff", stroke: "#e2e8f0", strokeWidth: 1 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#cbd5e1", width: 16, height: 16 },
};

const detailEdgeStyle = {
  type: "smoothstep", animated: false,
  style: { stroke: "#e4e4e7", strokeWidth: 1.5, strokeDasharray: "5 4", opacity: 0.6 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#e4e4e7", width: 10, height: 10 },
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const TIER_Y   = { 0: 0, 1: 500, 2: 1000, 3: 1500 };
const NODE_W   = 300;
const H_GAP    = 80;
const DETAIL_W = 260;
const DETAIL_GAP = 20;

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
    let x = 2000 - totalW / 2;
    group.forEach(n => {
      n.position = { x: Math.round(x), y: TIER_Y[t] };
      positioned[n.id] = n;
      x += NODE_W + H_GAP;
    });
  });
  return Object.values(positioned);
}

// Detail nodes placed DIRECTLY below their parent — no fitView shift
function buildDetailNodes(parentNode, explanation) {
  const px  = parentNode.position.x;
  const py  = parentNode.position.y;
  const pid = parentNode.id;

  const cards = [
    { id: `${pid}_what`,       layer: "detail_what",       detailType: "What it does",       label: explanation.what_it_does,   files: [] },
    { id: `${pid}_why`,        layer: "detail_why",        detailType: "Why it exists",      label: explanation.why_it_exists,  files: [] },
    { id: `${pid}_how`,        layer: "detail_how",        detailType: "How it works",       label: explanation.how_it_works,   files: [] },
    { id: `${pid}_files`,      layer: "detail_files",      detailType: "Where to start",     label: explanation.newcomer_start, files: explanation.key_files || [] },
    { id: `${pid}_contribute`, layer: "detail_contribute", detailType: "First contribution", label: explanation.contribute_tip, files: [] },
  ];

  // Place in a tight row directly below the parent — no massive Y offset
  const totalW  = cards.length * (DETAIL_W + DETAIL_GAP) - DETAIL_GAP;
  const startX  = px + NODE_W / 2 - totalW / 2;
  const detailY = py + 220; // just below the node card

  const nodes = cards.map((c, i) => ({
    id: c.id, type: "default",
    position: { x: Math.round(startX + i * (DETAIL_W + DETAIL_GAP)), y: detailY },
    data: { label: c.label, layer: c.layer, tier: 4, detailType: c.detailType, files: c.files, isDetail: true },
  }));

  const edges = cards.map(c => ({
    id: `e_detail_${pid}_${c.id}`, source: pid, target: c.id, ...detailEdgeStyle,
  }));

  return { nodes, edges };
}

const TIER_META = [
  { tier: 0, label: "Tier 0 · Root",        color: "bg-rose-500"    },
  { tier: 1, label: "Tier 1 · Domains",     color: "bg-blue-500"    },
  { tier: 2, label: "Tier 2 · Sub-Systems", color: "bg-emerald-500" },
  { tier: 3, label: "Tier 3 · DNA",         color: "bg-zinc-800"    },
];

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
          Paste a GitHub URL on the home page and hit Analyze.
        </p>
      </div>
      <button onClick={() => router.push("/")}
        className="px-10 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">
        ← Back to Spectra
      </button>
    </main>
  );
}

// ─── GUIDE PANEL ─────────────────────────────────────────────────────────────
function GuidePanel({ onClose, repoName, activeRepoUrl, nodes }) {
  const [guide, setGuide]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (!activeRepoUrl) return;
    const domainNodes = nodes.filter(n => (n.data?.tier ?? 0) >= 1).slice(0, 12)
      .map(n => `${n.data?.label} (${n.data?.layer}): ${n.data?.description}`).join("\n");
    fetch("https://spectra-lzee.onrender.com/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: activeRepoUrl, message: `You are a senior developer helping a complete newcomer understand the "${repoName}" repository.\n\nKey components:\n${domainNodes}\n\nGenerate a thorough onboarding guide. Return ONLY JSON:\n{"repo_summary":"2-3 sentences about what this does and why it matters","tech_stack":["tech1","tech2"],"difficulty":"Beginner/Intermediate/Advanced","time_to_understand":"e.g. 2-3 hours","steps":[{"number":1,"title":"title","what_to_do":"plain English instructions","why_it_matters":"why this matters","files_to_open":["file.py"]}],"biggest_gotcha":"one thing that confuses newcomers","first_contribution":"best first contribution for newcomers"}\nReturn ONLY the JSON.` }),
    })
    .then(r => r.json())
    .then(data => {
      try { setGuide(JSON.parse((data.answer || "{}").replace(/```json|```/g, "").trim())); }
      catch { setGuide({ error: true, raw: data.answer }); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeRepoUrl]);

  return (
    <div className="w-[460px] bg-white border-l border-zinc-100 flex flex-col shadow-2xl h-full">
      <div className="px-6 py-5 flex justify-between items-center bg-zinc-900 text-white shrink-0">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">📖 Onboarding Guide</p>
          <h2 className="font-black text-base tracking-tighter uppercase italic truncate max-w-[320px]">{repoName}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-700 rounded-xl text-zinc-400"><X size={15}/></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <LoadingState label="Building your onboarding guide…" sub="AI is reading the codebase" />}
        {!loading && guide && !guide.error && (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[12px] text-zinc-700 font-medium leading-relaxed">{guide.repo_summary}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(guide.tech_stack||[]).map((t,i) => (
                  <span key={i} className="px-2.5 py-1 bg-zinc-900 text-white rounded-full text-[9px] font-black uppercase">{t}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Difficulty</p>
                <p className="text-xs font-black text-blue-800">{guide.difficulty}</p>
              </div>
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Time to grasp</p>
                <p className="text-xs font-black text-emerald-800">{guide.time_to_understand}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Your Roadmap</p>
              <div className="space-y-2.5">
                {(guide.steps||[]).map((step,i) => (
                  <div key={i} onClick={() => setChecked(p=>({...p,[i]:!p[i]}))}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${checked[i]?"bg-emerald-50 border-emerald-200":"bg-white border-zinc-200 hover:border-zinc-300"}`}>
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-0.5">
                        {checked[i] ? <CheckCircle size={16} className="text-emerald-500"/> : <Circle size={16} className="text-zinc-300"/>}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Step {step.number}</p>
                        <h4 className={`font-black text-xs uppercase tracking-tight mb-1.5 ${checked[i]?"line-through text-zinc-400":"text-zinc-900"}`}>{step.title}</h4>
                        <p className="text-[11px] text-zinc-600 font-medium leading-relaxed mb-1.5">{step.what_to_do}</p>
                        <p className="text-[10px] text-zinc-400 italic mb-2">💡 {step.why_it_matters}</p>
                        {step.files_to_open?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {step.files_to_open.map((f,j) => (
                              <span key={j} className="px-2 py-0.5 bg-zinc-100 rounded text-[8px] font-black font-mono text-zinc-500">{f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {guide.biggest_gotcha && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">⚠️ Common Gotcha</p>
                <p className="text-[11px] text-amber-900 font-medium leading-relaxed">{guide.biggest_gotcha}</p>
              </div>
            )}
            {guide.first_contribution && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">🚀 First Contribution</p>
                <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">{guide.first_contribution}</p>
              </div>
            )}
          </div>
        )}
        {!loading && guide?.error && (
          <div className="p-6"><p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-wrap">{guide.raw}</p></div>
        )}
      </div>
    </div>
  );
}

// ─── SCOPE PANEL ─────────────────────────────────────────────────────────────
function ScopePanel({ onClose, repoName, activeRepoUrl, nodes }) {
  const [scope, setScope]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [openTier, setOpenTier] = useState(1);

  const tierData = [0,1,2,3].map(t => ({
    tier: t, label: ["Root","Major Domains","Sub-Systems","Entry Points"][t],
    color: ["bg-rose-500","bg-blue-500","bg-emerald-500","bg-zinc-800"][t],
    count: nodes.filter(n=>(n.data?.tier??1)===t).length,
    nodes: nodes.filter(n=>(n.data?.tier??1)===t),
  }));

  useEffect(() => {
    if (!activeRepoUrl) return;
    const allNodes = nodes.map(n=>`${n.data?.label}: ${n.data?.description}`).join("\n");
    fetch("https://spectra-lzee.onrender.com/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ repo_url: activeRepoUrl, message: `Explain the "${repoName}" codebase to a newcomer.\n\nComponents:\n${allNodes}\n\nReturn ONLY JSON:\n{"what_is_this":"plain English explanation","who_uses_it":"real-world users","why_it_exists":"problem it solves","how_it_all_connects":"how parts talk to each other","real_world_analogy":"one real-world analogy","strengths":["s1","s2","s3"],"good_for_learning":["c1","c2","c3"]}\nReturn ONLY the JSON.` }),
    })
    .then(r=>r.json())
    .then(data => {
      try { setScope(JSON.parse((data.answer||"{}").replace(/```json|```/g,"").trim())); }
      catch { setScope(null); }
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [activeRepoUrl]);

  return (
    <div className="w-[460px] bg-white border-l border-zinc-100 flex flex-col shadow-2xl h-full">
      <div className="px-6 py-5 flex justify-between items-center bg-blue-600 text-white shrink-0">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 mb-1">🎯 Architecture Scope</p>
          <h2 className="font-black text-base tracking-tighter uppercase italic truncate max-w-[320px]">{repoName}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-xl text-blue-200"><X size={15}/></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <LoadingState label="Mapping the architecture…" sub="Analyzing components" />}
        {!loading && (
          <div className="p-6 space-y-4">
            {scope?.what_is_this && (
              <div className="p-4 bg-zinc-900 text-white rounded-2xl">
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">In Plain English</p>
                <p className="text-[12px] font-medium leading-relaxed">{scope.what_is_this}</p>
              </div>
            )}
            {scope?.real_world_analogy && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">🎯 Real World Analogy</p>
                <p className="text-[12px] text-amber-900 font-medium italic leading-relaxed">"{scope.real_world_analogy}"</p>
              </div>
            )}
            <div className="space-y-2">
              {scope?.who_uses_it && (
                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">👥 Who Uses It</p>
                  <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">{scope.who_uses_it}</p>
                </div>
              )}
              {scope?.why_it_exists && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
                  <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">💡 Why It Exists</p>
                  <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">{scope.why_it_exists}</p>
                </div>
              )}
              {scope?.how_it_all_connects && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">🔗 How It Connects</p>
                  <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">{scope.how_it_all_connects}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Architecture Breakdown</p>
              <div className="space-y-1.5">
                {tierData.map(({ tier, label, color, count, nodes: tnodes }) => (
                  <div key={tier} className="border border-zinc-100 rounded-xl overflow-hidden">
                    <button onClick={() => setOpenTier(openTier===tier?null:tier)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color}`}/>
                        <span className="text-[10px] font-black text-zinc-700 uppercase">Tier {tier} · {label}</span>
                        <span className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[8px] font-black text-zinc-400">{count}</span>
                      </div>
                      {openTier===tier ? <ChevronDown size={12} className="text-zinc-400"/> : <ChevronRight size={12} className="text-zinc-400"/>}
                    </button>
                    {openTier===tier && (
                      <div className="divide-y divide-zinc-50">
                        {tnodes.map((n,i) => (
                          <div key={i} className="px-4 py-3">
                            <p className="text-[10px] font-black text-zinc-800 uppercase mb-0.5">{n.data?.label}</p>
                            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{n.data?.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {scope?.good_for_learning?.length > 0 && (
              <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
                <p className="text-[8px] font-black text-violet-500 uppercase tracking-widest mb-2">📚 Good for Learning</p>
                <div className="flex flex-wrap gap-1.5">
                  {scope.good_for_learning.map((c,i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-violet-200 rounded-lg text-[9px] font-black text-violet-700">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {scope?.strengths?.length > 0 && (
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">⚡ Strengths</p>
                <div className="space-y-1.5">
                  {scope.strengths.map((s,i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Star size={10} className="text-amber-400 mt-0.5 shrink-0" fill="currentColor"/>
                      <p className="text-[10px] text-zinc-600 font-medium">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHAT PANEL ───────────────────────────────────────────────────────────────
function ChatPanel({ onClose, repoName, activeRepoUrl }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    text: `Hey! I'm Sentinel 👋 Ask me anything about **${repoName}** — where things live, how parts connect, what a file does, or where to start contributing. Plain English, no jargon.`,
  }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const QUICK = [
    "Where should I start?",
    "What's the most important file?",
    "How does the main feature work?",
    "What's the hardest part to understand?",
    "How do I run this locally?",
  ];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(p => [...p, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res  = await fetch("https://spectra-lzee.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, repo_url: activeRepoUrl }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: "assistant", text: data.answer || "No answer received." }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", text: "Sentinel is offline. Check the backend." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="w-[460px] bg-white border-l border-zinc-100 flex flex-col shadow-2xl h-full">
      <div className="px-6 py-5 flex justify-between items-center bg-emerald-600 text-white shrink-0">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200 mb-1">💬 Ask Sentinel</p>
          <h2 className="font-black text-base tracking-tighter uppercase italic truncate max-w-[320px]">{repoName}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-emerald-700 rounded-xl text-emerald-200"><X size={15}/></button>
      </div>

      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 shrink-0">
        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Quick Ask</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUICK.map((q,i) => (
            <button key={i} onClick={() => send(q)} disabled={loading}
              className="shrink-0 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-[9px] font-bold text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors whitespace-nowrap">
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m,i) => (
          <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
            {m.role==="assistant" && (
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                <Brain size={11} className="text-emerald-600"/>
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[11px] font-medium leading-relaxed ${
              m.role==="user"?"bg-zinc-900 text-white rounded-br-sm":"bg-zinc-50 border border-zinc-100 text-zinc-700 rounded-bl-sm"
            }`}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center mr-2 shrink-0">
              <Brain size={11} className="text-emerald-600"/>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-zinc-400"/>
              <span className="text-[10px] text-zinc-400 font-medium">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 shrink-0">
        <div className="flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Ask anything about this codebase…" disabled={loading}
            className="flex-1 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-emerald-400 transition-colors disabled:opacity-50"
          />
          <button onClick={()=>send()} disabled={loading||!input.trim()}
            className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors">
            <Send size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared loading state ─────────────────────────────────────────────────────
function LoadingState({ label, sub }) {
  return (
    <div className="flex flex-col items-center justify-center h-56 gap-4">
      <Loader2 size={24} className="animate-spin text-zinc-300"/>
      <div className="text-center">
        <p className="text-xs font-black text-zinc-700 uppercase tracking-tight">{label}</p>
        {sub && <p className="text-[10px] text-zinc-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── MAIN REVEAL ─────────────────────────────────────────────────────────────
function RevealContent() {
  const { revelationData, activePanel, setActivePanel, activeRepoUrl, clearRevelation } = useStore();

  const [nodes,      setNodes,      onNodesChange] = useNodesState([]);
  const [edges,      setEdges,      onEdgesChange] = useEdgesState([]);
  const [isBuilding, setIsBuilding]                = useState(true);
  const [builtTiers, setBuiltTiers]                = useState([]);
  const [expandedId, setExpandedId]                = useState(null);
  const [loadingId,  setLoadingId]                 = useState(null);
  // Flow simulation state
  const [simulating, setSimulating]                = useState(false);
  const simTimers                                  = useRef([]);

  const { fitView, setCenter } = useReactFlow();
  const nodeTypes = useMemo(() => ({ default: SpectraNode }), []);

  const hasData = revelationData && Array.isArray(revelationData.nodes) && revelationData.nodes.length >= 3;

  const source = useMemo(() => {
    if (!hasData) return null;
    const d = revelationData;
    return d.nodes.some(n => !n.position)
      ? { ...d, nodes: computeLayout(d.nodes, d.edges || []) }
      : d;
  }, [revelationData, hasData]);

  const sortedNodes = useMemo(() => {
    if (!source) return [];
    return [...source.nodes].sort((a,b) => {
      const ta=a.data?.tier??1, tb=b.data?.tier??1;
      return ta!==tb ? ta-tb : (a.position?.x??0)-(b.position?.x??0);
    });
  }, [source]);

  const allEdges = useMemo(() => {
    if (!source) return [];
    return (source.edges||[]).map((e,i) => ({ ...e, id: e.id||`e_${i}` }));
  }, [source]);

  // ── Tier-by-tier reveal (no fitView mid-reveal) ───────────────────────────
  useEffect(() => {
    if (!source) return;
    setNodes([]); setEdges([]); setIsBuilding(true); setBuiltTiers([]);
    setExpandedId(null); setLoadingId(null);

    const tierGroups = {};
    sortedNodes.forEach(n => {
      const t = n.data?.tier ?? 1;
      tierGroups[t] = tierGroups[t] || [];
      tierGroups[t].push(n);
    });

    const tiers    = Object.keys(tierGroups).map(Number).sort();
    const addedIds = new Set();
    let step       = 0;

    const revealNext = () => {
      if (step >= tiers.length) {
        setIsBuilding(false);
        // Only ONE fitView at the very end
        setTimeout(() => fitView({ padding: 0.2, duration: 1000 }), 200);
        return;
      }
      const tier      = tiers[step];
      const tierNodes = tierGroups[tier];
      setNodes(prev => [...prev, ...tierNodes]);
      setBuiltTiers(prev => [...prev, tier]);
      tierNodes.forEach(n => addedIds.add(n.id));
      setEdges(prev => {
        const newEdges = allEdges.filter(
          e => addedIds.has(e.source) && addedIds.has(e.target) && !prev.find(p => p.id===e.id)
        );
        return [...prev, ...newEdges];
      });
      step++;
      setTimeout(revealNext, step === 1 ? 700 : 1000);
    };

    const t = setTimeout(revealNext, 400);
    return () => clearTimeout(t);
  }, [source]);

  // ── Collapse node ─────────────────────────────────────────────────────────
  const collapseNode = useCallback((nid) => {
    setNodes(prev =>
      prev.filter(n => !n.id.startsWith(`${nid}_`))
          .map(n => n.id===nid ? { ...n, data: { ...n.data, isExpanded: false } } : n)
    );
    setEdges(prev => prev.filter(e => !e.id.startsWith(`e_detail_${nid}_`)));
    setExpandedId(null);
  }, []);

  // ── Node click: auto-collapse prev, expand new ────────────────────────────
  const onNodeClick = useCallback(async (event, node) => {
    const tier     = node.data?.tier ?? 0;
    const isDetail = node.data?.isDetail;
    if (tier === 0 || isDetail || loadingId) return;

    const nid = node.id;

    // Same node → collapse
    if (expandedId === nid) { collapseNode(nid); return; }

    // Auto-collapse previous — NO fitView
    if (expandedId) collapseNode(expandedId);

    setLoadingId(nid);
    setNodes(prev => prev.map(n => n.id===nid ? { ...n, data: { ...n.data, isExpanded: true } } : n));

    try {
      const res = await fetch("https://spectra-lzee.onrender.com/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_label: node.data.label, node_description: node.data.description || "",
          node_layer: node.data.layer || "logic", node_tier: tier, repo_url: activeRepoUrl,
        }),
      });
      const explanation = await res.json();
      const { nodes: dNodes, edges: dEdges } = buildDetailNodes(node, explanation);
      setNodes(prev => [...prev, ...dNodes]);
      setEdges(prev => [...prev, ...dEdges]);
      setExpandedId(nid);

      // Pan gently to the clicked node — NO fitView (keeps zoom level intact)
      setCenter(
        node.position.x + NODE_W / 2,
        node.position.y + 300,
        { duration: 600, zoom: undefined }
      );
    } catch {
      setNodes(prev => prev.map(n => n.id===nid ? { ...n, data: { ...n.data, isExpanded: false } } : n));
    } finally { setLoadingId(null); }
  }, [expandedId, loadingId, activeRepoUrl, collapseNode, setCenter]);

  // ── Flow simulation ───────────────────────────────────────────────────────
  const startSimulation = useCallback(() => {
    if (simulating) {
      // Stop simulation — reset all edges
      simTimers.current.forEach(clearTimeout);
      simTimers.current = [];
      setSimulating(false);
      setEdges(prev => prev.map(e => ({
        ...e,
        animated: false,
        style: { ...e.style, stroke: "#cbd5e1", strokeWidth: 2 },
        markerEnd: { ...e.markerEnd, color: "#cbd5e1" },
      })));
      return;
    }

    setSimulating(true);
    // Build tier-ordered edge sequence
    const edgesByTier = [0,1,2].map(t => allEdges.filter(e => {
      const srcNode = sortedNodes.find(n => n.id === e.source);
      return (srcNode?.data?.tier ?? 0) === t;
    }));

    const colors = ["#f43f5e","#3b82f6","#10b981"];

    const resetEdge = (eid) => {
      setEdges(prev => prev.map(e => e.id===eid ? {
        ...e, animated: false,
        style: { ...e.style, stroke: "#cbd5e1", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#cbd5e1", width: 16, height: 16 },
      } : e));
    };

    let delay = 0;
    edgesByTier.forEach((tierEdges, tierIdx) => {
      const color = colors[tierIdx] || "#94a3b8";
      tierEdges.forEach(edge => {
        const t1 = setTimeout(() => {
          setEdges(prev => prev.map(e => e.id===edge.id ? {
            ...e, animated: true,
            style: { ...e.style, stroke: color, strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
          } : e));
        }, delay);
        const t2 = setTimeout(() => resetEdge(edge.id), delay + 1200);
        simTimers.current.push(t1, t2);
        delay += 180;
      });
      delay += 400; // pause between tiers
    });

    // Auto-stop after all animations
    const stopT = setTimeout(() => setSimulating(false), delay + 600);
    simTimers.current.push(stopT);
  }, [simulating, allEdges, sortedNodes]);

  if (!hasData) return <NoDataScreen />;

  const repoName = activeRepoUrl
    ? activeRepoUrl.replace("https://github.com/","").replace("http://github.com/","")
    : source?.repo || "Unknown";

  return (
    <main className="h-screen w-screen flex flex-col bg-[#F8F9FB] overflow-hidden font-sans">

      {/* Navbar */}
      <nav className="px-5 py-3 border-b border-zinc-200 flex justify-between items-center bg-white/95 backdrop-blur-xl z-[100] shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all">
            <ArrowLeft size={16}/>
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <GitBranch size={12} className="text-zinc-400"/>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest truncate max-w-[280px]">{repoName}</span>
            </div>
            <h1 className="font-black text-xs tracking-tighter uppercase italic text-zinc-900 leading-none mt-0.5">
              Architectural Revelation
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loadingId && (
            <span className="flex items-center text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
              <Loader2 size={9} className="animate-spin mr-1"/> Expanding…
            </span>
          )}
          {isBuilding ? (
            <span className="flex items-center text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
              <Loader2 size={9} className="animate-spin mr-1"/> Building map…
            </span>
          ) : (
            <span className="flex items-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              <ShieldCheck size={9} className="mr-1"/> {sortedNodes.length} nodes · click to explore
            </span>
          )}

          {/* Flow simulation button */}
          {!isBuilding && (
            <button onClick={startSimulation}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                simulating
                  ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                  : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}>
              {simulating ? <><Square size={10}/> Stop</> : <><Play size={10}/> Simulate Flow</>}
            </button>
          )}

          <button onClick={clearRevelation}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-xl text-[9px] font-black uppercase text-zinc-500 hover:bg-zinc-50 transition-all">
            <RefreshCw size={10}/> New
          </button>
          <button className="bg-zinc-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider shadow hover:scale-105 transition-all">
            Export
          </button>
        </div>
      </nav>

      <div className="flex-1 flex relative overflow-hidden">

        {/* Action Deck */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-50 p-2 bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-white/50">
          <DeckButton active={activePanel==="guide"} onClick={()=>setActivePanel("guide")} icon={<BookOpen size={18}/>} label="Guide"/>
          <DeckButton active={activePanel==="scope"} onClick={()=>setActivePanel("scope")} icon={<Target size={18}/>}   label="Scope"/>
          <DeckButton active={activePanel==="chat"}  onClick={()=>setActivePanel("chat")}  icon={<MessageSquare size={18}/>} label="Chat"/>
        </div>

        {/* Tier Rail */}
        <div className="absolute left-[130px] top-0 bottom-0 w-px bg-zinc-200/60 z-10 pointer-events-none">
          {TIER_META.map(({ tier, label, color }) => (
            <TierPill key={tier} label={label} color={color}
              visible={builtTiers.includes(tier)}
              style={{ top: `calc(${TIER_Y[tier]}px * 0.14 + 50px)` }}
            />
          ))}
        </div>

        {/* Canvas — flex-1 ensures it never shrinks when panel opens */}
        <div className="flex-1 relative min-w-0">
          {/* Simulation widget — top right */}
          <div className="absolute top-4 right-4 z-50">
            <SimulationWidget />
          </div>
          <ReactFlow
            nodes={nodes} edges={edges}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.03} maxZoom={2.5}
            nodesDraggable={true}
          >
            <Background variant="dots" gap={32} size={1} color="#e2e8f0"/>
            <Controls className="rounded-2xl shadow-sm"/>
            <MiniMap
              className="rounded-2xl overflow-hidden border border-zinc-200"
              nodeColor={n => {
                if (n.data?.isDetail) return "#f4f4f5";
                return ["#f43f5e","#3b82f6","#10b981","#18181b"][n.data?.tier??1]||"#94a3b8";
              }}
            />
          </ReactFlow>
        </div>

        {/* Side Panels — absolute so they DON'T affect canvas width */}
        {activePanel === "guide" && (
          <div className="absolute right-0 top-0 bottom-0 z-50 shadow-2xl">
            <GuidePanel onClose={()=>setActivePanel(null)} repoName={repoName} activeRepoUrl={activeRepoUrl} nodes={sortedNodes}/>
          </div>
        )}
        {activePanel === "scope" && (
          <div className="absolute right-0 top-0 bottom-0 z-50 shadow-2xl">
            <ScopePanel onClose={()=>setActivePanel(null)} repoName={repoName} activeRepoUrl={activeRepoUrl} nodes={sortedNodes}/>
          </div>
        )}
        {activePanel === "chat" && (
          <div className="absolute right-0 top-0 bottom-0 z-50 shadow-2xl">
            <ChatPanel onClose={()=>setActivePanel(null)} repoName={repoName} activeRepoUrl={activeRepoUrl}/>
          </div>
        )}
      </div>
    </main>
  );
}

function TierPill({ label, color, visible, style }) {
  return (
    <div className={`absolute left-3 transition-all duration-700 ${visible?"opacity-100 translate-x-0":"opacity-0 -translate-x-4"}`} style={style}>
      <div className={`px-2.5 py-1 ${color} text-white rounded-full text-[7px] font-black uppercase tracking-widest shadow`}>{label}</div>
    </div>
  );
}

function DeckButton({ icon, onClick, active, label }) {
  return (
    <button onClick={onClick} title={label}
      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${
        active ? "bg-zinc-900 text-white scale-110 shadow-xl" : "bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
      }`}>
      {icon}
    </button>
  );
}

export default function RevealPage() {
  return <ReactFlowProvider><RevealContent /></ReactFlowProvider>;
}

