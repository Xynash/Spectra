"use client";
import React, { useState, useEffect, useRef } from "react";

const STAGES = [
  {
    id: "github",
    emoji: "🐙",
    label: "GitHub",
    sublabel: "Fetching repo DNA",
    color: "#18181b",
  },
  {
    id: "scraper",
    emoji: "🔬",
    label: "Scraper",
    sublabel: "Pruning file tree",
    color: "#3b82f6",
  },
  {
    id: "ai",
    emoji: "🧠",
    label: "AI Brain",
    sublabel: "Mapping architecture",
    color: "#8b5cf6",
  },
  {
    id: "map",
    emoji: "🗺️",
    label: "Spectra Map",
    sublabel: "Blueprint ready!",
    color: "#10b981",
  },
];

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

export default function SimulationWidget() {
  const [running,     setRunning]     = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [packetPos,   setPacketPos]   = useState(null);
  const [logs,        setLogs]        = useState([]);
  const [done,        setDone]        = useState(false);
  const [btnPressed,  setBtnPressed]  = useState(false); // ← click animation state
  const timerRefs = useRef([]);

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

  const handleButtonClick = (action) => {
    // Trigger press animation
    setBtnPressed(true);
    setTimeout(() => setBtnPressed(false), 180);
    action();
  };

  const run = () => {
    reset();
    setRunning(true);

    const stagePcts = [8, 33, 58, 83];
    let delay = 0;

    STAGES.forEach((stage, i) => {
      const t1 = setTimeout(() => setActiveStage(i), delay);
      timerRefs.current.push(t1);

      const logIdx = Math.floor((i / STAGES.length) * LOG_MESSAGES.length);
      const t2 = setTimeout(() => {
        setLogs(p => [...p, LOG_MESSAGES[logIdx]].slice(-5));
      }, delay + 100);
      timerRefs.current.push(t2);

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
        const t3 = setTimeout(() => {
          setLogs(p => [...p, LOG_MESSAGES[logIdx + 1] || ""].slice(-5));
        }, delay + 900);
        timerRefs.current.push(t3);
      }

      delay += 1500;
    });

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
    // ── Positioned top-right of the reveal page ──────────────────────────────
    <div className="fixed top-6 right-6 z-50 w-[420px]">
      <div className="bg-white border-2 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

        {/* Header */}
        <div className="px-5 py-3.5 border-b-2 border-black bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
              spectra.pipeline — live simulation
            </span>
          </div>

          {/* ── Run / Stop button with click animation ── */}
          <button
            onClick={() => handleButtonClick(running ? reset : run)}
            className={`
              px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest
              border-2 transition-all duration-75 select-none
              ${running
                ? "border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                : "border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white"
              }
              ${btnPressed
                ? "scale-90 brightness-75 shadow-none translate-y-[2px]"
                : "scale-100 shadow-sm"
              }
            `}
            style={{
              boxShadow: btnPressed
                ? "none"
                : running
                  ? "2px 2px 0px rgba(248,113,113,0.5)"
                  : "2px 2px 0px rgba(52,211,153,0.5)",
            }}
          >
            {running ? "⏹ Stop" : done ? "🔄 Replay" : "▶ Run"}
          </button>
        </div>

        {/* Pipeline track */}
        <div className="px-5 pt-6 pb-3 bg-zinc-50">
          <div className="relative flex items-center justify-between">

            {/* Base track */}
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
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full z-20"
                style={{
                  left: `calc(${
                    packetPos.fromPct +
                    (packetPos.toPct - packetPos.fromPct) * packetPos.pct
                  }% - 7px)`,
                  background: packetPos.color,
                  boxShadow: `0 0 10px ${packetPos.color}, 0 0 4px ${packetPos.color}`,
                }}
              />
            )}

            {/* Stage nodes */}
            {STAGES.map((stage, i) => {
              const isActive = activeStage === i;
              const isDone   = activeStage > i || done;
              return (
                <div key={stage.id} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border-2 transition-all duration-300 ${
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
                    <p className={`text-[9px] font-black uppercase tracking-wide transition-colors ${
                      isActive ? "text-zinc-900" : "text-zinc-400"
                    }`}>
                      {stage.label}
                    </p>
                    {isActive && (
                      <p className="text-[7px] text-zinc-500 font-medium mt-0.5 animate-pulse">
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
        <div className="mx-5 mb-5 bg-zinc-900 rounded-2xl p-3.5 min-h-[100px] font-mono">
          {logs.length === 0 && (
            <p className="text-[9px] text-zinc-600 italic">
              {done ? "Simulation complete." : "Hit ▶ Run to see the pipeline in action…"}
            </p>
          )}
          {logs.map((log, i) => (
            <p
              key={i}
              className={`text-[10px] leading-relaxed transition-all ${
                i === logs.length - 1 ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              {i === logs.length - 1 && running && (
                <span className="inline-block w-1 h-2.5 bg-emerald-400 mr-1 animate-pulse align-middle" />
              )}
              {log}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">
            From URL to map in ~3 seconds
          </p>
          {done && (
            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[8px] font-black text-emerald-600 uppercase tracking-wide animate-pulse">
              ✅ Blueprint deployed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}