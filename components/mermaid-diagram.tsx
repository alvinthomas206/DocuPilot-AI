"use client";

import { useEffect, useState } from "react";
import mermaid from "mermaid";
import { AlertTriangle, Network } from "lucide-react";

let initialized = false;

export default function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function render() {
      if (!chart.trim()) { setSvg(""); setError("No architecture diagram was generated."); return; }
      try {
        if (!initialized) {
          mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral", flowchart: { htmlLabels: false, curve: "linear" } });
          initialized = true;
        }
        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const result = await mermaid.render(id, chart);
        if (active) { setSvg(result.svg); setError(""); }
      } catch {
        if (active) { setSvg(""); setError("This diagram could not be rendered. Edit the Mermaid source and try again."); }
      }
    }
    render();
    return () => { active = false; };
  }, [chart]);

  if (error) return <div className="diagram-error"><AlertTriangle size={18}/><span>{error}</span></div>;
  if (!svg) return <div className="diagram-loading"><Network size={18}/> Rendering architecture diagram…</div>;
  return <div className="diagram-frame" dangerouslySetInnerHTML={{ __html: svg }} />;
}
