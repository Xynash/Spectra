"use client";
import React, { useState, useEffect, useRef } from "react";

// ─── Cartoon pipeline simulation ──────────────────────────────────────────────
// Shows: GitHub → Scraper → AI Brain → Map as a fun animated flow

const STAGES = [
  {
    id: "github",
    emoji: "🐙",
    label: "GitHub",
    sublabel: "Fetching repo DNA",
    color: "#18181b",
    textColor: "#fff",
    shape: "rounded-2xl",
  },
  {
    id: "scraper",
    emoji: "🔬",
    label: "Scraper",
    sublabel: "Pruning file tree",
    color: "#3b82f6",
    textColor: "#fff",
    shape: "rounded-2xl",
  },
  {
    id: "ai",
    emoji: "🧠",
    label: "AI Brain",
    sublabel: "Mapping architecture",
    color: "#8b5cf6",
    textColor: "#fff",
    shape: "rounded-2xl",
  },
  {
    id: "map",
    emoji: "🗺️",
    label: "Spectra Map",
    sublabel: "Blueprint ready!",
    color: "#10b981",
    textColor: "#fff",
    shape: "rounded-2xl",
  },
];

// Tiny animated "data packet" flying between stages
function Packet({ from, to, progress, color }) {
  const x = from + (to - from) * progress;
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg transition-none"
      style={{ left: `${x}%`, background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

export default function SimulationWidget() {
  const [running,       setRunning]       = useState(false);
  const [activeStage,   setActiveStage]   = useState(-1);   // which stage is lit
  const [packetPos,     setPacketPos]     = useState(null);  // { fromPct, toPct, pct, color }
  const [logs,          setLogs]          = useState([]);
  const [done,          setDone]          = useState(false);
  const timerRefs                         = useRef([]);

  const LOG_MESSAGES = [
    "📡 Connecting to GitHub API…",
    "✅ Repository found — tiangolo/fastapi",
    "🌿 Fetching file tree (recursive)…",
    "✂️  Pruning 847 files → 142 meaningful paths",
    "🧠 Sending context to Groq LLaMA-70B…",
    "⚡ Groq responded in 1.2s",
    "🔍 Parsing 14 nodes, 13 edges…",
    "🎨 Computing tier layout…",
    "🗺️  Blueprint deployed — 14 nodes ready!",
  ];

  const clear = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  const reset = () => {
    clear();
    setRunning(false);
    setActiveStage(-1);
    setPacketPos(null);
    setLogs([]);
    setDone(false);
  };

  const run = () => {
    reset();
    setRunning(true);

    // Stage positions as percentage of bar width
    const stagePcts = [8, 33, 58, 83];

    let delay = 0;

    STAGES.forEach((stage, i) => {
      // Light up stage
      const t1 = setTimeout(() => setActiveStage(i), delay);
      timerRefs.current.push(t1);

      // Add log
      const logIdx = Math.floor((i / STAGES.length) * LOG_MESSAGES.length);
      const t2 = setTimeout(() => {
        setLogs(p => [...p, LOG_MESSAGES[logIdx]].slice(-5));
      }, delay + 100);
      timerRefs.current.push(t2);

      // Animate packet to next stage
      if (i < STAGES.length - 1) {
        const fromPct = stagePcts[i];
        const toPct   = stagePcts[i + 1];
        const color   = STAGES[i + 1].color;
        const STEPS   = 30;
        for (let s = 0; s <= STEPS; s++) {
          const t = setTimeout(() => {
            setPacketPos({ fromPct, toPct, pct: s / STEPS, color });
          }, delay + 600 + s * 18);
          timerRefs.current.push(t);
        }
        // Extra log mid-flight
        const t3 = setTimeout(() => {
          setLogs(p => [...p, LOG_MESSAGES[logIdx + 1] || ""].slice(-5));
        }, delay + 900);
        timerRefs.current.push(t3);
      }

      delay += 1500;
    });

    // Done
    const tDone = setTimeout(() => {
      setDone(true);
      setRunning(false);
      setPacketPos(null);
      setActiveStage(-1);
      setLogs(p => [...p, "🎉 Done! Map is live."].slice(-5));
    }, delay + 300);
    timerRefs.current.push(tDone);
  };

  useEffect(() => () => clear(), []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white border-2 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-black bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              spectra.pipeline — live simulation
            </span>
          </div>
          <button
            onClick={running ? reset : run}
            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
              running
                ? "border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                : "border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white"
            }`}
          >
            {running ? "⏹ Stop" : done ? "🔄 Replay" : "▶ Run"}
          </button>
        </div>

        {/* Pipeline track */}
        <div className="px-6 pt-8 pb-4 bg-zinc-50">
          <div className="relative flex items-center justify-between">

            {/* Track line */}
            <div className="absolute left-[8%] right-[8%] h-0.5 bg-zinc-200 top-1/2 -translate-y-1/2 rounded-full" />

            {/* Animated fill */}
            {activeStage >= 0 && (
              <div
                className="absolute h-0.5 bg-zinc-900 top-1/2 -translate-y-1/2 rounded-full transition-all duration-700"
                style={{
                  left: "8%",
                  width: `${(activeStage / (STAGES.length - 1)) * 84}%`,
                }}
              />
            )}

            {/* Flying packet */}
            {packetPos && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-20 transition-none"
                style={{
                  left: `calc(${packetPos.fromPct + (packetPos.toPct - packetPos.fromPct) * packetPos.pct}% - 8px)`,
                  background: packetPos.color,
                  boxShadow: `0 0 12px ${packetPos.color}, 0 0 4px ${packetPos.color}`,
                }}
              />
            )}

            {/* Stage nodes */}
            {STAGES.map((stage, i) => {
              const isActive = activeStage === i;
              const isDone   = activeStage > i || done;
              return (
                <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-300 ${
                      isActive
                        ? "scale-125 shadow-xl border-transparent"
                        : isDone
                        ? "scale-110 border-transparent opacity-90"
                        : "bg-white border-zinc-200 grayscale opacity-50"
                    }`}
                    style={isActive || isDone ? { background: stage.color } : {}}
                  >
                    {isDone && !isActive ? "✅" : stage.emoji}
                  </div>
                  <div className="text-center">
                    <p className={`text-[10px] font-black uppercase tracking-wide transition-colors ${isActive ? "text-zinc-900" : "text-zinc-400"}`}>
                      {stage.label}
                    </p>
                    {isActive && (
                      <p className="text-[8px] text-zinc-500 font-medium mt-0.5 animate-pulse">
                        {stage.sublabel}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terminal log */}
        <div className="mx-6 mb-6 bg-zinc-900 rounded-2xl p-4 min-h-[120px] font-mono">
          {logs.length === 0 && (
            <p className="text-[10px] text-zinc-600 italic">
              {done ? "Simulation complete." : "Hit ▶ Run to see the pipeline in action…"}
            </p>
          )}
          {logs.map((log, i) => (
            <p key={i}
              className={`text-[11px] leading-relaxed transition-all ${
                i === logs.length - 1 ? "text-emerald-400" : "text-zinc-500"
              }`}>
              {i === logs.length - 1 && running && (
                <span className="inline-block w-1.5 h-3 bg-emerald-400 mr-1 animate-pulse align-middle" />
              )}
              {log}
            </p>
          ))}
        </div>

        {/* Fun footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
            From URL to map in ~3 seconds
          </p>
          {done && (
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-black text-emerald-600 uppercase tracking-wide animate-pulse">
              ✅ Blueprint deployed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}