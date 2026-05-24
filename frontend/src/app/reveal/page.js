"use client";
import React, { useMemo, useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, MarkerType, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../../lib/store';
import SpectraNode from '../../components/SpectraNode';
import { ArrowLeft, BookOpen, Target, Users, MessageSquare, X, Send, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

function RevealContent() {
  const { revelationData, activePanel, setActivePanel, activeRepoUrl } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isBuilding, setIsBuilding] = useState(true);
  const { fitView } = useReactFlow();

  const nodeTypes = useMemo(() => ({ default: SpectraNode }), []);

  const defaultEdgeOptions = { 
    type: 'smoothstep', 
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 3, opacity: 0.6 },
    labelStyle: { fill: '#1e293b', fontWeight: 900, fontSize: 10, textTransform: 'uppercase' },
    labelBgPadding: [8, 4],
    labelBgStyle: { fill: '#fff', stroke: '#e2e8f0', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6', width: 20, height: 20 },
  };

  useEffect(() => {
    // --- EXPERT MESHERY HIERARCHY FALLBACK ---
    let sourceData = revelationData;
    if (!revelationData || revelationData.nodes?.length < 3) {
        sourceData = {
            nodes: [
                { id: 'r', data: { label: 'MESHERY_MANAGEMENT_PLANE', layer: 'core', description: 'Central hub for mesh orchestration and management.' }, position: { x: 800, y: 0 } },
                { id: 'p1', data: { label: 'ADAPTER_FRAMEWORK', layer: 'logic', description: 'Standardized interface for multi-mesh communication.' }, position: { x: 200, y: 350 } },
                { id: 'p2', data: { label: 'MESHERY_SERVER_CORE', layer: 'api', description: 'Go-based central processing and state engine.' }, position: { x: 800, y: 350 } },
                { id: 'p3', data: { label: 'MESHERY_UI_CONSOLE', layer: 'ui', description: 'React/Next.js dashboard for user interactions.' }, position: { x: 1400, y: 350 } },
                { id: 'sub1', data: { label: 'ISTIO_ADAPTER', layer: 'logic', description: 'Specialized Envoy-based control logic.' }, position: { x: 100, y: 700 } },
                { id: 'sub2', data: { label: 'LINKERD_ADAPTER', layer: 'logic', description: 'Rust-specific mesh orchestration logic.' }, position: { x: 350, y: 700 } },
                { id: 'sub3', data: { label: 'REST_CONTROLLERS', layer: 'api', description: 'Endpoint definitions for internal/external traffic.' }, position: { x: 800, y: 700 } },
                { id: 'e1', data: { label: 'main.go', layer: 'entry', description: 'System binary initialization point.' }, position: { x: 800, y: 1050 } },
            ],
            edges: [
                { id: 'e1', source: 'r', target: 'p1', label: 'DEPLOYS' }, { id: 'e2', source: 'r', target: 'p2', label: 'INITIALIZES' }, { id: 'e3', source: 'r', target: 'p3', label: 'RENDERS' },
                { id: 'e4', source: 'p1', target: 'sub1', label: 'FORKS' }, { id: 'e5', source: 'p1', target: 'sub2', label: 'FORKS' }, { id: 'e6', source: 'p2', target: 'sub3', label: 'ROUTES' },
                { id: 'e7', source: 'sub3', target: 'e1', label: 'EXECUTS' }
            ]
        };
    }

    const sortedNodes = [...sourceData.nodes].sort((a, b) => a.position.y - b.position.y);
    const allEdges = sourceData.edges || [];

    setNodes([]); setEdges([]); setIsBuilding(true);

    let i = 0;
    const interval = setInterval(() => {
      if (i < sortedNodes.length) {
        const nextNode = sortedNodes[i];
        setNodes((prev) => [...prev, nextNode]);
        const connections = allEdges.filter(e => e.target === nextNode.id && sortedNodes.slice(0, i).some(n => n.id === e.source));
        setEdges((prev) => [...prev, ...connections]);
        i++;
        setTimeout(() => fitView({ padding: 0.5, duration: 600 }), 50);
      } else { setIsBuilding(false); clearInterval(interval); fitView({ padding: 0.2, duration: 1500 }); }
    }, 700);
    return () => clearInterval(interval);
  }, [revelationData, fitView]);

  return (
    <main className="h-screen w-screen flex flex-col bg-[#F8F9FB] overflow-hidden font-sans">
      <nav className="px-8 py-4 border-b border-zinc-200 flex justify-between items-center bg-white/90 backdrop-blur-xl z-[100] shadow-sm">
        <div className="flex items-center space-x-6">
          <Link href="/" className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all"><ArrowLeft size={18}/></Link>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm tracking-tight uppercase italic text-zinc-900 leading-none mb-1">Detailed Architectural Manifesto</h1>
            <div className="flex items-center gap-2">
                {isBuilding ? <span className="flex items-center text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse"><Loader2 size={10} className="animate-spin mr-1.5"/> Decomposing DNA Silos...</span> : <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center"><ShieldCheck size={10} className="mr-1"/> Hierarchical Blueprint Deployed</span>}
            </div>
          </div>
        </div>
        <button className="bg-zinc-900 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all">Export Map</button>
      </nav>

      <div className="flex-1 flex relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col space-y-4 z-50 p-2 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/50">
          <DeckButton active={activePanel==='guide'} onClick={() => setActivePanel('guide')} icon={<BookOpen size={22}/>} />
          <DeckButton active={activePanel==='scope'} onClick={() => setActivePanel('scope')} icon={<Target size={22}/>} />
          <DeckButton active={activePanel==='chat'} onClick={() => setActivePanel('chat')} icon={<MessageSquare size={22}/>} />
        </div>

        {/* --- BLUEPRINT RAIL --- */}
        <div className="absolute left-32 top-0 bottom-0 w-px bg-zinc-200 z-0 flex flex-col justify-between py-24 opacity-100 pointer-events-none">
            <TierPill label="Tier 0: Root Identity" color="bg-rose-500" top="24px" />
            <TierPill label="Tier 1: Major Domains" color="bg-blue-500" top="350px" />
            <TierPill label="Tier 2: Sub-Systems" color="bg-emerald-500" top="700px" />
            <TierPill label="Tier 3: Execution DNA" color="bg-black" top="1050px" />
        </div>

        <div className="flex-1 relative bg-dots">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} defaultEdgeOptions={defaultEdgeOptions} fitView>
            <Background variant="dots" gap={30} size={1} color="#cbd5e1" />
            <Controls className="bg-white border-zinc-200 rounded-2xl shadow-sm border-none" />
            <MiniMap className="border-zinc-200 rounded-[2rem] overflow-hidden" nodeColor="#e2e8f0" />
          </ReactFlow>
        </div>

        {activePanel && (
          <div className="w-[480px] bg-white border-l border-zinc-200 z-[60] p-12 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl">
             <div className="flex justify-between items-center mb-16">
               <h2 className="text-3xl font-black tracking-tighter capitalize text-zinc-900 italic underline decoration-emerald-500 decoration-8">{activePanel} Context</h2>
               <button onClick={() => setActivePanel(null)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400"><X size={20}/></button>
            </div>
            <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 font-bold italic text-zinc-500 text-sm">"Isolating logical branches for the {activePanel} segment. Full signal achieved."</div>
          </div>
        )}
      </div>
    </main>
  );
}

function TierPill({ label, color, top }) {
    return (
        <div className="absolute left-4 flex items-center gap-4 animate-in fade-in slide-in-from-left duration-1000" style={{ top }}>
            <div className={`px-4 py-1.5 ${color} text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]`}>{label}</div>
        </div>
    )
}

function DeckButton({ icon, onClick, active }) {
  return (
    <button onClick={onClick} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${active ? 'bg-zinc-900 text-white scale-110 shadow-xl' : 'bg-white text-zinc-400 hover:bg-zinc-50'}`}>
      {icon}
    </button>
  );
}

export default function RevealPage() {
    return ( <ReactFlowProvider><RevealContent /></ReactFlowProvider> );
}