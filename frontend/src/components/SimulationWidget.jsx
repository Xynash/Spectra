"use client";
import React, { useState, useEffect, useRef } from "react";
import { Play, Square, ChevronDown, ChevronUp, X } from "lucide-react";

const STAGES = [
  { id: "github",  emoji: "🐙", label: "GitHub",      sublabel: "Fetching repo DNA",      color: "#18181b" },
  { id: "scraper", emoji: "🔬", label: "Scraper",     sublabel: "Pruning file tree",      color: "#3b82f6" },
  { id: "ai",      emoji: "🧠", label: "AI Brain",    sublabel: "Mapping architecture",   color: "#8b5cf6" },
  { id: "map",     emoji: "🗺️",  label: "Spectra Map", sublabel: "Blueprint ready!",       color: "#10b981" },
];

const LOG_MESSAGES = [
  "📡 Connecting to GitHub API…",
  "✅ Repository found",
  "🌿 Fetching file tree (recursive)…",
  "✂️  Pruning → 142 meaningful paths",
  "🧠 Sending to Groq LLaMA-70B…",
  "⚡ AI responded in 1.2s",
  "🔍 Parsing 14 nodes, 13 edges…",
  "🎨 Computing tier layout…",
  "🗺️  Blueprint deployed — ready!",
];

export default function SimulationWidget({ fullWidth = false }) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [running,     setRunning]     = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [doneStages,  setDoneStages]  = useState([]);
  const [packetPos,   setPacketPos]   = useState(null);
  const [logs,        setLogs]        = useState([]);
  const [done,        setDone]        = useState(false);
  const [btnPulse,    setBtnPulse]    = useState(false);
  const timers = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const reset = () => {
    clearTimers();
    setRunning(false); setActiveStage(-1); setDoneStages([]);
    setPacketPos(null); setLogs([]); setDone(false);
  };

  const run = () => {
    reset();
    setBtnPulse(true);
    setTimeout(() => setBtnPulse(false), 600);
    setRunning(true);

    const stagePcts = [10, 36, 62, 88];
    let delay = 0;

    STAGES.forEach((stage, i) => {
      // Light up stage
      const t1 = setTimeout(() => {
        setActiveStage(i);
        setLogs(p => [...p, LOG_MESSAGES[i * 2]].slice(-4));
      }, delay);
      timers.current.push(t1);

      // Fly packet to next stage
      if (i < STAGES.length - 1) {
        const fromPct = stagePcts[i];
        const toPct   = stagePcts[i + 1];
        const color   = STAGES[i + 1].color;
        const STEPS   = 28;
        for (let s = 0; s <= STEPS; s++) {
          const t = setTimeout(() => {
            setPacketPos({ x: fromPct + (toPct - fromPct) * (s / STEPS), color });
          }, delay + 500 + s * 20);
          timers.current.push(t);
        }
        const t2 = setTimeout(() => {
          setLogs(p => [...p, LOG_MESSAGES[i * 2 + 1]].slice(-4));
          setDoneStages(p => [...p, i]);
        }, delay + 500 + STEPS * 20);
        timers.current.push(t2);
      }

      delay += 1600;
    });

    // Finish
    const tEnd = setTimeout(() => {
      setDoneStages([0,1,2,3]);
      setDone(true); setRunning(false);
      setActiveStage(-1); setPacketPos(null);
      setLogs(p => [...p, "🎉 Map is live!"].slice(-4));
    }, delay + 200);
    timers.current.push(tEnd);
  };

  useEffect(() => () => clearTimers(), []);

  return (
    <div className={`${fullWidth ? "w-full" : "w-[320px]"} bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300`}>

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400"/>
            <div className="w-2 h-2 rounded-full bg-amber-400"/>
            <div className="w-2 h-2 rounded-full bg-emerald-400"/>
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">pipeline</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Run / Stop button with click ripple */}
          <button
            onClick={running ? reset : run}
            className={`relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all duration-200 border overflow-hidden
              ${running
                ? "border-red-400 text-red-400 hover:bg-red-400/10"
                : "border-emerald-400 text-emerald-400 hover:bg-emerald-400/10"
              }
              ${btnPulse ? "scale-95" : "scale-100"}
            `}
          >
            {/* Click ripple */}
            {btnPulse && (
              <span className="absolute inset-0 rounded-lg bg-emerald-400/30 animate-ping" />
            )}
            {running
              ? <><Square size={9}/> Stop</>
              : done
                ? <><Play size={9}/> Replay</>
                : <><Play size={9}/> Run</>
            }
          </button>
          <button onClick={() => setCollapsed(p => !p)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            {collapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Pipeline track */}
          <div className="px-4 pt-4 pb-2 bg-zinc-50">
            <div className="relative flex items-center justify-between h-12">
              {/* Track */}
              <div className="absolute left-[10%] right-[10%] h-0.5 bg-zinc-200 top-1/2 -translate-y-1/2 rounded-full"/>
              {/* Progress fill */}
              {doneStages.length > 0 && (
                <div className="absolute h-0.5 top-1/2 -translate-y-1/2 rounded-full transition-all duration-700"
                  style={{
                    left: "10%",
                    width: `${(doneStages.length / (STAGES.length)) * 78}%`,
                    background: STAGES[Math.min(doneStages.length, STAGES.length-1)].color,
                  }}
                />
              )}
              {/* Flying packet */}
              {packetPos && (
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-20 transition-none"
                  style={{
                    left: `calc(${packetPos.x}% - 6px)`,
                    background: packetPos.color,
                    boxShadow: `0 0 10px ${packetPos.color}, 0 0 4px ${packetPos.color}`,
                  }}
                />
              )}
              {/* Stage nodes */}
              {STAGES.map((s, i) => {
                const isActive = activeStage === i;
                const isDone   = doneStages.includes(i);
                return (
                  <div key={s.id} className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition-all duration-300 ${
                      isActive ? "scale-125 border-transparent shadow-lg" :
                      isDone   ? "scale-110 border-transparent opacity-90" :
                                 "bg-white border-zinc-200 grayscale opacity-50 scale-100"
                    }`}
                      style={isActive || isDone ? { background: s.color } : {}}>
                      {isDone && !isActive ? "✅" : s.emoji}
                    </div>
                    <p className={`text-[7px] font-black uppercase tracking-wide transition-colors ${isActive ? "text-zinc-900" : "text-zinc-400"}`}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terminal log */}
          <div className="mx-3 mb-3 bg-zinc-900 rounded-xl p-3 min-h-[72px]">
            {logs.length === 0 ? (
              <p className="text-[9px] text-zinc-600 italic">
                {done ? "Complete." : "Hit Run to see the pipeline…"}
              </p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className={`text-[9px] leading-relaxed ${i === logs.length - 1 ? "text-emerald-400" : "text-zinc-600"}`}>
                  {i === logs.length - 1 && running && (
                    <span className="inline-block w-1 h-2.5 bg-emerald-400 mr-1 animate-pulse align-middle"/>
                  )}
                  {log}
                </p>
              ))
            )}
          </div>

          {done && (
            <div className="mx-3 mb-3 flex items-center justify-center gap-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">✅ Blueprint deployed</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}