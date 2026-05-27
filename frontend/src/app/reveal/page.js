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
  Send, ChevronDown, ChevronRight, Star, Rocket, Brain,
  FileCode, Users, Lightbulb, CheckCircle, Circle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Edge styles ──────────────────────────────────────────────────────────────
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

// ─── No data ──────────────────────────────────────────────────────────────────
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
          Paste a GitHub URL on the home page and hit Analyze to generate your map.
        </p>
      </div>
      <button onClick={() => router.push("/")}
        className="px-10 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
        ← Back to Spectra
      </button>
    </main>
  );
}

// ─── GUIDE PANEL ─────────────────────────────────────────────────────────────
function GuidePanel({ onClose, repoName, activeRepoUrl, nodes }) {
  const [guide,   setGuide]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (!activeRepoUrl) return;
    setLoading(true);

    const domainNodes = nodes
      .filter(n => (n.data?.tier ?? 0) >= 1)
      .slice(0, 12)
      .map(n => `${n.data?.label} (${n.data?.layer}): ${n.data?.description}`)
      .join("\n");

    fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo_url: activeRepoUrl,
        message: `You are a senior developer helping a complete newcomer understand the "${repoName}" repository.

Here are the key components of this repo:
${domainNodes}

Generate a thorough onboarding guide in plain, friendly English. Return ONLY a JSON object with this shape:
{
  "repo_summary": "2-3 sentences: what this project does, who uses it, and why it matters in the real world.",
  "tech_stack": ["technology1", "technology2", "technology3"],
  "difficulty": "Beginner / Intermediate / Advanced",
  "time_to_understand": "e.g. 2-3 hours to get the big picture",
  "steps": [
    {
      "number": 1,
      "title": "Short action title",
      "what_to_do": "Exactly what to do in plain English, like a friend texting you instructions.",
      "why_it_matters": "Why this step matters for understanding the codebase.",
      "files_to_open": ["file1.py", "file2.md"]
    }
  ],
  "biggest_gotcha": "The one thing that confuses most newcomers about this repo, explained clearly.",
  "first_contribution": "The single best first issue or area to contribute to as a newcomer."
}
Return ONLY the JSON. No markdown, no backticks.`,
      }),
    })
      .then(r => r.json())
      .then(data => {
        try {
          const raw = data.answer || "{}";
          const clean = raw.replace(/```json|```/g, "").trim();
          setGuide(JSON.parse(clean));
        } catch {
          setGuide({ error: true, raw: data.answer });
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [activeRepoUrl]);

  const toggleCheck = (i) => setChecked(p => ({ ...p, [i]: !p[i] }));

  return (
    <div className="w-[480px] bg-white border-l border-zinc-200 flex flex-col shadow-2xl h-full">
      {/* Header */}
      <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-center bg-gradient-to-r from-zinc-900 to-zinc-800 text-white shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={13} className="text-zinc-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Onboarding Guide</span>
          </div>
          <h2 className="font-black text-lg tracking-tighter uppercase italic">{repoName}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-700 rounded-xl text-zinc-400 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 size={28} className="animate-spin text-zinc-300" />
            <div className="text-center">
              <p className="text-sm font-black text-zinc-700 uppercase tracking-tight">Generating your guide…</p>
              <p className="text-xs text-zinc-400 mt-1">AI is reading the codebase for you</p>
            </div>
          </div>
        )}

        {!loading && guide && !guide.error && (
          <div className="p-7 space-y-7">

            {/* Repo summary */}
            <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-sm text-zinc-700 font-medium leading-relaxed">{guide.repo_summary}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {(guide.tech_stack || []).map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-wide">{t}</span>
                ))}
              </div>
            </div>

            {/* Difficulty + time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Difficulty</p>
                <p className="text-sm font-black text-blue-800">{guide.difficulty}</p>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Time to grasp</p>
                <p className="text-sm font-black text-emerald-800">{guide.time_to_understand}</p>
              </div>
            </div>

            {/* Steps */}
            <div>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Your Onboarding Roadmap</h3>
              <div className="space-y-4">
                {(guide.steps || []).map((step, i) => (
                  <div key={i}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${checked[i] ? "bg-emerald-50 border-emerald-200 opacity-70" : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"}`}
                    onClick={() => toggleCheck(i)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {checked[i]
                          ? <CheckCircle size={18} className="text-emerald-500" />
                          : <Circle size={18} className="text-zinc-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-black text-zinc-400 uppercase">Step {step.number}</span>
                        </div>
                        <h4 className={`font-black text-sm uppercase tracking-tight mb-2 ${checked[i] ? "line-through text-zinc-400" : "text-zinc-900"}`}>
                          {step.title}
                        </h4>
                        <p className="text-[12px] text-zinc-600 font-medium leading-relaxed mb-2">
                          {step.what_to_do}
                        </p>
                        <p className="text-[11px] text-zinc-400 italic leading-relaxed mb-3">
                          💡 {step.why_it_matters}
                        </p>
                        {step.files_to_open?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {step.files_to_open.map((f, j) => (
                              <span key={j} className="px-2 py-1 bg-zinc-100 rounded-lg text-[9px] font-black font-mono text-zinc-600">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Biggest gotcha */}
            {guide.biggest_gotcha && (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚠️</span>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Common Gotcha for Newcomers</span>
                </div>
                <p className="text-[12px] text-amber-900 font-medium leading-relaxed">{guide.biggest_gotcha}</p>
              </div>
            )}

            {/* First contribution */}
            {guide.first_contribution && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Your First Contribution</span>
                </div>
                <p className="text-[12px] text-emerald-900 font-medium leading-relaxed">{guide.first_contribution}</p>
              </div>
            )}
          </div>
        )}

        {!loading && guide?.error && (
          <div className="p-7">
            <p className="text-xs text-zinc-500 font-medium leading-relaxed whitespace-pre-wrap">{guide.raw}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCOPE PANEL ─────────────────────────────────────────────────────────────
function ScopePanel({ onClose, repoName, activeRepoUrl, nodes }) {
  const [scope,   setScope]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [openTier, setOpenTier] = useState(1);

  const tierCounts = [0,1,2,3].map(t => ({
    tier: t,
    count: nodes.filter(n => (n.data?.tier ?? 1) === t).length,
    label: ["Root","Major Domains","Sub-Systems","Entry Points"][t],
    color: ["bg-rose-500","bg-blue-500","bg-emerald-500","bg-zinc-800"][t],
    nodes: nodes.filter(n => (n.data?.tier ?? 1) === t),
  }));

  useEffect(() => {
    if (!activeRepoUrl) return;
    setLoading(true);

    const allNodes = nodes
      .map(n => `${n.data?.label}: ${n.data?.description}`)
      .join("\n");

    fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo_url: activeRepoUrl,
        message: `You are explaining the "${repoName}" codebase architecture to a newcomer.

Components found:
${allNodes}

Return ONLY a JSON object:
{
  "what_is_this": "Plain English: what does this project do? Imagine explaining to a non-technical friend.",
  "who_uses_it": "Who are the real-world users or developers who use this project?",
  "why_it_exists": "What problem does this solve? What existed before it?",
  "how_it_all_connects": "In 2-3 sentences, explain how the major parts talk to each other — like explaining plumbing.",
  "real_world_analogy": "Give one real-world analogy that explains what this codebase does (e.g. 'This is like the post office for...')",
  "strengths": ["strength1", "strength2", "strength3"],
  "good_for_learning": ["concept1", "concept2", "concept3"]
}
Return ONLY the JSON. No markdown.`,
      }),
    })
      .then(r => r.json())
      .then(data => {
        try {
          const clean = (data.answer || "{}").replace(/```json|```/g, "").trim();
          setScope(JSON.parse(clean));
        } catch { setScope(null); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeRepoUrl]);

  return (
    <div className="w-[480px] bg-white border-l border-zinc-200 flex flex-col shadow-2xl h-full">
      {/* Header */}
      <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={13} className="text-blue-200" />
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-200">Architecture Scope</span>
          </div>
          <h2 className="font-black text-lg tracking-tighter uppercase italic">{repoName}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-xl text-blue-200 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 size={28} className="animate-spin text-zinc-300" />
            <p className="text-sm font-black text-zinc-700 uppercase tracking-tight">Mapping the codebase…</p>
          </div>
        )}

        {!loading && (
          <div className="p-7 space-y-6">

            {/* What is this */}
            {scope?.what_is_this && (
              <div className="p-5 bg-zinc-900 text-white rounded-2xl">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">In Plain English</p>
                <p className="text-sm font-medium leading-relaxed">{scope.what_is_this}</p>
              </div>
            )}

            {/* Real world analogy */}
            {scope?.real_world_analogy && (
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">🎯 Real World Analogy</p>
                <p className="text-sm text-amber-900 font-medium leading-relaxed italic">"{scope.real_world_analogy}"</p>
              </div>
            )}

            {/* Who uses it + why it exists */}
            <div className="grid grid-cols-1 gap-3">
              {scope?.who_uses_it && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={13} className="text-blue-500" />
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Who Uses It</span>
                  </div>
                  <p className="text-[12px] text-zinc-700 font-medium leading-relaxed">{scope.who_uses_it}</p>
                </div>
              )}
              {scope?.why_it_exists && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={13} className="text-rose-500" />
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Why It Exists</span>
                  </div>
                  <p className="text-[12px] text-zinc-700 font-medium leading-relaxed">{scope.why_it_exists}</p>
                </div>
              )}
              {scope?.how_it_all_connects && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={13} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">How It All Connects</span>
                  </div>
                  <p className="text-[12px] text-zinc-700 font-medium leading-relaxed">{scope.how_it_all_connects}</p>
                </div>
              )}
            </div>

            {/* Node breakdown by tier — accordion */}
            <div>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Architecture Breakdown</h3>
              <div className="space-y-2">
                {tierCounts.map(({ tier, count, label, color, nodes: tnodes }) => (
                  <div key={tier} className="border border-zinc-100 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenTier(openTier === tier ? null : tier)}
                      className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        <span className="text-xs font-black text-zinc-700 uppercase tracking-wide">Tier {tier} · {label}</span>
                        <span className="px-2 py-0.5 bg-white border border-zinc-200 rounded-full text-[9px] font-black text-zinc-500">
                          {count}
                        </span>
                      </div>
                      {openTier === tier ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
                    </button>
                    {openTier === tier && (
                      <div className="divide-y divide-zinc-50">
                        {tnodes.map((n, i) => (
                          <div key={i} className="px-5 py-4">
                            <p className="text-[11px] font-black text-zinc-800 uppercase tracking-tight mb-1">{n.data?.label}</p>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{n.data?.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Good for learning */}
            {scope?.good_for_learning?.length > 0 && (
              <div className="p-5 bg-violet-50 border border-violet-100 rounded-2xl">
                <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-3">📚 Good for Learning</p>
                <div className="flex flex-wrap gap-2">
                  {scope.good_for_learning.map((c, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white border border-violet-200 rounded-xl text-[10px] font-black text-violet-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {scope?.strengths?.length > 0 && (
              <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">⚡ Strengths of this Codebase</p>
                <div className="space-y-2">
                  {scope.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Star size={11} className="text-amber-400 mt-0.5 shrink-0" fill="currentColor" />
                      <p className="text-[11px] text-zinc-600 font-medium">{s}</p>
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
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hey! I'm Sentinel 👋 Ask me anything about **${repoName}** — where things live, how parts connect, what a file does, or where to start contributing. I'll explain it like a senior dev texting you.`,
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = React.useRef(null);

  const QUICK_QUESTIONS = [
    "Where should I start as a newcomer?",
    "What's the most important file in this repo?",
    "How does the main feature work?",
    "What's the hardest part to understand?",
    "How do I run this project locally?",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const res  = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, repo_url: activeRepoUrl }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.answer || "Sorry, I couldn't get an answer." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sentinel is offline right now. Check the backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[480px] bg-white border-l border-zinc-200 flex flex-col shadow-2xl h-full">
      {/* Header */}
      <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={13} className="text-emerald-200" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Ask Sentinel</span>
          </div>
          <h2 className="font-black text-lg tracking-tighter uppercase italic">{repoName}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-emerald-700 rounded-xl text-emerald-200 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Quick questions */}
      <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 shrink-0">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Quick Ask</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => send(q)} disabled={loading}
              className="shrink-0 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-[10px] font-bold text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors whitespace-nowrap">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                <Brain size={13} className="text-emerald-600" />
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[12px] font-medium leading-relaxed ${
              m.role === "user"
                ? "bg-zinc-900 text-white rounded-br-sm"
                : "bg-zinc-50 border border-zinc-100 text-zinc-700 rounded-bl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center mr-2 shrink-0">
              <Brain size={13} className="text-emerald-600" />
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-zinc-400" />
              <span className="text-[11px] text-zinc-400 font-medium">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-zinc-100 shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask anything about this codebase…"
            disabled={loading}
            className="flex-1 border-2 border-zinc-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-400 transition-colors disabled:opacity-50"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-colors">
            <Send size={16} />
          </button>
        </div>
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
  const { fitView }                                 = useReactFlow();
  const nodeTypes = useMemo(() => ({ default: SpectraNode }), []);

  const hasData = revelationData && Array.isArray(revelationData.nodes) && revelationData.nodes.length >= 3;

  const source = useMemo(() => {
    if (!hasData) return null;
    const d = revelationData;
    const needsLayout = d.nodes.some(n => !n.position);
    return needsLayout ? { ...d, nodes: computeLayout(d.nodes, d.edges || []) } : d;
  }, [revelationData, hasData]);

  const isFallback        = source?.source === "fallback";
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

  useEffect(() => {
    if (!source) return;
    setNodes([]); setEdges([]); setIsBuilding(true); setBuiltTiers([]);

    const tierGroups = {};
    sortedNodes.forEach(n => {
      const t = n.data?.tier ?? 1;
      tierGroups[t] = tierGroups[t] || [];
      tierGroups[t].push(n);
    });

    const tiers = Object.keys(tierGroups).map(Number).sort();
    const addedIds = new Set();
    let step = 0;

    const revealNext = () => {
      if (step >= tiers.length) {
        setIsBuilding(false);
        setTimeout(() => fitView({ padding: 0.15, duration: 1200 }), 100);
        return;
      }
      const tier = tiers[step];
      const tierNodes = tierGroups[tier];
      setNodes(prev => [...prev, ...tierNodes]);
      setBuiltTiers(prev => [...prev, tier]);
      tierNodes.forEach(n => addedIds.add(n.id));
      setEdges(prev => {
        const newEdges = allEdges.filter(
          e => addedIds.has(e.source) && addedIds.has(e.target) && !prev.find(p => p.id === e.id)
        );
        return [...prev, ...newEdges];
      });
      setTimeout(() => fitView({ padding: 0.25, duration: 800 }), 80);
      step++;
      setTimeout(revealNext, step === 1 ? 600 : 900);
    };

    const t = setTimeout(revealNext, 300);
    return () => clearTimeout(t);
  }, [source]);

  if (!hasData) return <NoDataScreen />;

  const repoName = activeRepoUrl
    ? activeRepoUrl.replace("https://github.com/", "").replace("http://github.com/", "")
    : source?.repo || "Unknown Repository";

  return (
    <main className="h-screen w-screen flex flex-col bg-[#F8F9FB] overflow-hidden font-sans">

      {/* Navbar */}
      <nav className="px-6 py-3 border-b border-zinc-200 flex justify-between items-center bg-white/95 backdrop-blur-xl z-[100] shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all">
            <ArrowLeft size={17} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <GitBranch size={13} className="text-zinc-400" />
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest truncate max-w-[300px]">{repoName}</span>
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
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Structural · {fallbackFileCount} files</span>
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

        {/* Action Deck */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50 p-2 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/50">
          <DeckButton active={activePanel === "guide"} onClick={() => setActivePanel("guide")} icon={<BookOpen size={20} />}     label="Guide" />
          <DeckButton active={activePanel === "scope"} onClick={() => setActivePanel("scope")} icon={<Target size={20} />}       label="Scope" />
          <DeckButton active={activePanel === "chat"}  onClick={() => setActivePanel("chat")}  icon={<MessageSquare size={20} />} label="Chat"  />
        </div>

        {/* Tier Rail */}
        <div className="absolute left-[140px] top-0 bottom-0 w-px bg-zinc-200/80 z-10 pointer-events-none">
          {TIER_META.map(({ tier, label, color }) => (
            <TierPill key={tier} label={label} color={color}
              visible={builtTiers.includes(tier)}
              style={{ top: `calc(${TIER_Y[tier]}px * 0.18 + 60px)` }}
            />
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes} edges={edges}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView minZoom={0.03} maxZoom={2}
          >
            <Background variant="dots" gap={28} size={1} color="#cbd5e1" />
            <Controls className="rounded-2xl shadow-sm" />
            <MiniMap
              className="rounded-[2rem] overflow-hidden border border-zinc-200"
              nodeColor={n => ["#f43f5e","#3b82f6","#10b981","#18181b"][n.data?.tier ?? 1] || "#94a3b8"}
            />
          </ReactFlow>
        </div>

        {/* Side Panels */}
        {activePanel === "guide" && (
          <GuidePanel onClose={() => setActivePanel(null)} repoName={repoName} activeRepoUrl={activeRepoUrl} nodes={sortedNodes} />
        )}
        {activePanel === "scope" && (
          <ScopePanel onClose={() => setActivePanel(null)} repoName={repoName} activeRepoUrl={activeRepoUrl} nodes={sortedNodes} />
        )}
        {activePanel === "chat" && (
          <ChatPanel onClose={() => setActivePanel(null)} repoName={repoName} activeRepoUrl={activeRepoUrl} />
        )}
      </div>
    </main>
  );
}

function TierPill({ label, color, visible, style }) {
  return (
    <div className={`absolute left-3 flex items-center gap-3 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`} style={style}>
      <div className={`px-3 py-1 ${color} text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow`}>{label}</div>
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
  return <ReactFlowProvider><RevealContent /></ReactFlowProvider>;
}