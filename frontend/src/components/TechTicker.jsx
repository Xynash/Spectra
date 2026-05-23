"use client";
export default function TechTicker() {
  const projects = [
    "Meshery", "Kubernetes", "Prometheus", "Envoy", "Istio", 
    "Docker", "Terraform", "Layer5", "CNCF", "Linkerd", "ArgoCD"
  ];
  return (
    <div className="w-full bg-black py-8 overflow-hidden border-y-4 border-black transform -rotate-1 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.1)]">
      <div className="flex animate-scroll whitespace-nowrap">
        {[...projects, ...projects, ...projects].map((name, i) => (
          <span key={i} className="text-white font-black uppercase tracking-[0.2em] text-sm mx-16 flex items-center group cursor-default">
            <span className="w-3 h-3 bg-emerald-400 rounded-full mr-6 shadow-[0_0_15px_#34d399]" />
            <span className="hover:text-emerald-400 transition-colors">{name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}