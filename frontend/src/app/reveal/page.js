"use client";
import React, { useMemo, useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  MarkerType, 
  useNodesState, 
  useEdgesState, 
  useReactFlow, 
  ReactFlowProvider 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../../lib/store';
import { useRouter } from 'next/navigation';
import SpectraNode from '../../components/SpectraNode';
import { 
  ArrowLeft, 
  BookOpen, 
  Target, 
  Users, 
  MessageSquare, 
  X, 
  Layout, 
  Loader2, 
  RefreshCcw, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

function RevealContent() {
  const { revelationData, activePanel, setActivePanel } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isBuilding, setIsBuilding] = useState(true);
  const { fitView } = useReactFlow();
  const router = useRouter();

  const nodeTypes = useMemo(() => ({ default: SpectraNode }), []);

  const defaultEdgeOptions = { 
    type: 'smoothstep', 
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2.5, opacity: 0.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  };

  useEffect(() => {
    // 1. DATA VALIDATION & FALLBACK
    const sourceData = (revelationData && revelationData.nodes?.length > 0) ? revelationData : {
        nodes: [
            { id: '1', data: { label: 'Spectral Breach', layer: 'core', description: 'The AI is currently processing. Returning to standby.' }, position: { x: 600, y: 0 } },
            { id: '2', data: { label: 'Standby Logic', layer: 'logic', description: 'Re-syncing frequencies.' }, position: { x: 600, y: 300 } },
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
    };

    // 2. PREPARE STAGGERED REVEAL
    // Sort by Y so the top layers appear first
    const sortedNodes = [...sourceData.nodes].sort((a, b) => a.position.y - b.position.y);
    const allEdges = sourceData.edges || [];

    setNodes([]);
    setEdges([]);
    setIsBuilding(true);

    let i = 0;
    const interval = setInterval(() => {
      if (i < sortedNodes.length) {
        const nextNode = sortedNodes[i];
        
        // Add the node to the canvas
        setNodes((prev) => [...prev, nextNode]);

        // Find edges where the target is the newly added node AND the source already exists
        const validEdges = allEdges.filter(e => 
            e.target === nextNode.id && sortedNodes.slice(0, i).some(n => n.id === e.source)
        );
        
        if (validEdges.length > 0) {
            setEdges((prev) => [...prev, ...validEdges]);
        }

        i++;
        // Smoothly adjust the camera to keep the growing tree in the center
        setTimeout(() => fitView({ padding: 0.4, duration: 500 }), 50);
      } else {
        setIsBuilding(false);
        clearInterval(interval);
        // Final "Cinematic" view adjustment
        fitView({ padding: 0.2, duration: 1000 });
      }
    }, 800); // 800ms per logic layer drop

    return () => clearInterval(interval);
  }, [revelationData, fitView, setNodes, setEdges]);

  return (
    <main className="h-screen w-screen flex flex-col bg-[#F8F9FB] overflow-hidden font-sans">
      
      {/* --- TOP HUD (SYSTEM STATUS) --- */}
      <nav className="px-8 py-4 border-b border-zinc-200 flex justify-between items-center bg-white/90 backdrop-blur-xl z-[100]">
        <div className="flex items-center space-x-6">
          <Link href="/" className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all">
            <ArrowLeft size={18} className="text-zinc-600" />
          </Link>
          <div className="h-6 w-[1px] bg-zinc-200" />
          <div className="flex flex-col">
            <h1 className="font-bold text-sm tracking-tight text-zinc-900 uppercase italic">Spectra Revelation Pipeline</h1>
            <div className="flex items-center gap-2">
                {isBuilding ? (
                    <span className="flex items-center text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
                        <Loader2 size={10} className="animate-spin mr-1.5"/> Deciphering DNA...
                    </span>
                ) : (
                    <span className="flex items-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        <ShieldAlert size={10} className="mr-1.5"/> Architecture Manifested
                    </span>
                )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <button onClick={() => window.location.reload()} className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-400 transition-colors">
                <RefreshCcw size={16} />
            </button>
            <button className="bg-zinc-900 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-zinc-200 hover:bg-black transition-all">
                Export Blueprint
            </button>
        </div>
      </nav>

      <div className="flex-1 flex relative">
        
        {/* --- LEFT NAVIGATION DOCK --- */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col space-y-4 z-50 p-2 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/50">
          <DeckButton active={activePanel==='guide'} onClick={() => setActivePanel('guide')} icon={<BookOpen size={22}/>} />
          <DeckButton active={activePanel==='scope'} onClick={() => setActivePanel('scope')} icon={<Target size={22}/>} />
          <DeckButton active={activePanel==='community'} onClick={() => setActivePanel('community')} icon={<Users size={22}/>} />
          <DeckButton active={activePanel==='chat'} onClick={() => setActivePanel('chat')} icon={<MessageSquare size={22}/>} />
        </div>

        {/* --- MAIN ARCHITECTURAL CANVAS --- */}
        <div className="flex-1 relative bg-dots">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
          >
            <Background variant="dots" gap={30} size={1} color="#e2e8f0" />
            <Controls className="bg-white border-zinc-200 rounded-2xl shadow-sm border-none" />
            <MiniMap className="border-zinc-200 rounded-[2rem] overflow-hidden" nodeColor="#e2e8f0" />
          </ReactFlow>
        </div>

        {/* --- INTELLIGENCE PANEL (SLIDE-OUT) --- */}
        {activePanel && (
          <div className="w-[480px] bg-white border-l border-zinc-200 z-[60] p-12 flex flex-col animate-in slide-in-from-right duration-500 shadow-[-20px_0_60px_rgba(0,0,0,0.05)]">
             <div className="flex justify-between items-center mb-16">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-xl">
                    <Layout size={20}/>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter capitalize text-zinc-900">{activePanel}</h2>
               </div>
               <button onClick={() => setActivePanel(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
                <X size={20}/>
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <IntelligenceContent activePanel={activePanel} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// WRAPPER
export default function RevealPage() {
    return (
        <ReactFlowProvider>
            <RevealContent />
        </ReactFlowProvider>
    );
}

/* --- REFINED SUB-COMPONENTS --- */

function DeckButton({ icon, onClick, active }) {
  return (
    <button 
        onClick={onClick} 
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm
        ${active ? 'bg-zinc-900 text-white scale-110 shadow-xl' : 'bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'}`}
    >
      {icon}
    </button>
  );
}

function IntelligenceContent({ activePanel }) {
    return (
        <div className="space-y-10">
            <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 relative overflow-hidden group hover:border-zinc-300 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={80} />
                </div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Logic Stream Active</p>
                <p className="text-sm font-bold text-zinc-600 leading-relaxed italic">
                    "Filtering top-level architectural DNA for the {activePanel} segment. High-fidelity entry points identified below."
                </p>
            </div>

            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-6 bg-white border border-zinc-100 rounded-2xl flex items-center justify-between group hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer">
                        <div>
                            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block mb-1">Lookup ID: 0x{i}</span>
                            <p className="font-bold text-zinc-900 uppercase tracking-tighter">Architectural Pillar {i}</p>
                        </div>
                        <ChevronRight className="text-zinc-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Simple Sparkles for the panel
function Sparkles({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
        </svg>
    )
}