"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight, BookOpenText, BrainCircuit, Check, ChevronRight, Code2,
  Download, FileArchive, FileCheck2, FileText, FolderTree, Layers3,
  LoaderCircle, Network, RefreshCw, ShieldCheck, Sparkles, UploadCloud,
  WandSparkles, X
} from "lucide-react";
import type { ProjectAnalysis, ProjectDocumentation } from "@/lib/types";
import MermaidDiagram from "@/components/mermaid-diagram";

const sections = [
  { id: "abstract", label: "Abstract", icon: FileText },
  { id: "problemStatement", label: "Problem statement", icon: BookOpenText },
  { id: "objectives", label: "Objectives", icon: Check },
  { id: "scope", label: "Scope", icon: Layers3 },
  { id: "technologies", label: "Technology stack", icon: Code2 },
  { id: "architecture", label: "Architecture", icon: Network },
  { id: "modules", label: "Modules", icon: FolderTree },
  { id: "functionalRequirements", label: "Requirements", icon: FileCheck2 },
  { id: "testingSuggestions", label: "Testing", icon: ShieldCheck },
  { id: "limitations", label: "Limitations", icon: BookOpenText },
  { id: "futureScope", label: "Future scope", icon: Sparkles },
  { id: "conclusion", label: "Conclusion", icon: Check }
] as const;

type SectionId = typeof sections[number]["id"];

function lines(value: string[] | undefined) {
  return (value || []).join("\\n");
}
function downloadMarkdown(doc: ProjectDocumentation) {
  const content = [
    `# ${doc.projectTitle}`, "",
    "## Abstract", doc.abstract, "",
    "## Problem Statement", doc.problemStatement, "",
    "## Objectives", ...doc.objectives.map(x => `- ${x}`), "",
    "## Scope", ...doc.scope.map(x => `- ${x}`), "",
    "## Technology Stack", ...doc.technologies.map(x => `- **${x.name}:** ${x.purpose}`), "",
    "## Architecture", doc.architecture.overview, "",
    "## Modules", ...doc.modules.map(x => `### ${x.name}\\n${x.description}\\nEvidence: ${x.evidenceStatus}\\nSource files: ${x.sourceFiles.join(", ")}`), "",
    "## Functional Requirements", ...doc.functionalRequirements.map(x => `- ${x}`), "",
    "## Non-functional Requirements", ...doc.nonFunctionalRequirements.map(x => `- ${x}`), "",
    "## Testing Suggestions", ...doc.testingSuggestions.map(x => `- **${x.scenario}:** ${x.expectedResult}`), "",
    "## Limitations", ...doc.limitations.map(x => `- ${x}`), "",
    "## Assumptions", ...doc.assumptions.map(x => `- ${x}`), "",
    "## Future Scope", ...doc.futureScope.map(x => `- ${x}`), "",
    "## Conclusion", doc.conclusion, ""
  ].join("\\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${doc.projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project"}-documentation.md`;
  a.click(); URL.revokeObjectURL(url);
}

function renderPrintedSection(sectionId: SectionId, doc: ProjectDocumentation) {
  switch (sectionId) {
    case "abstract":
      return <p>{doc.abstract}</p>;
    case "problemStatement":
      return <p>{doc.problemStatement}</p>;
    case "objectives":
      return <ul>{doc.objectives.map((item, idx) => <li key={`objective-${idx}`}>{item}</li>)}</ul>;
    case "scope":
      return <ul>{doc.scope.map((item, idx) => <li key={`scope-${idx}`}>{item}</li>)}</ul>;
    case "technologies":
      return <div className="stack">{doc.technologies.map((tech, idx) => <div key={`tech-${idx}`} className="mini-card"><strong>{tech.name}</strong><p>{tech.purpose}</p><span className="hint">Evidence: {tech.evidenceFiles.join(", ") || "Not identified"}</span></div>)}</div>;
    case "architecture":
      return <div className="stack"><p>{doc.architecture.overview}</p><MermaidDiagram chart={doc.architecture.diagram}/>{doc.architecture.components.map((component, idx) => <div key={`component-${idx}`} className="mini-card"><strong>{component.name}</strong><p>{component.responsibility}</p><span className="hint">Files: {component.sourceFiles.join(", ") || "Not identified"}</span></div>)}</div>;
    case "modules":
      return <div className="stack">{doc.modules.map((module, idx) => <div key={`module-${idx}`} className="mini-card"><strong>{module.name}</strong><p>{module.description}</p><p><b>Responsibilities:</b> {module.responsibilities.join("; ") || "Not specified"}</p><span className="hint">Files: {module.sourceFiles.join(", ") || "Not identified"}</span></div>)}</div>;
    case "functionalRequirements":
      return <div className="stack"><ul>{doc.functionalRequirements.map((item, idx) => <li key={`functional-${idx}`}>{item}</li>)}</ul><ul>{doc.nonFunctionalRequirements.map((item, idx) => <li key={`non-functional-${idx}`}>{item}</li>)}</ul><p>{doc.dataFlow}</p></div>;
    case "testingSuggestions":
      return <div className="stack">{doc.testingSuggestions.map((test, idx) => <div key={`test-${idx}`} className="mini-card"><strong>{test.scenario}</strong><p>{test.expectedResult}</p></div>)}</div>;
    case "limitations":
      return <div className="stack"><ul>{doc.limitations.map((item, idx) => <li key={`limit-${idx}`}>{item}</li>)}</ul><ul>{doc.assumptions.map((item, idx) => <li key={`assumption-${idx}`}>{item}</li>)}</ul></div>;
    case "futureScope":
      return <ul>{doc.futureScope.map((item, idx) => <li key={`future-${idx}`}>{item}</li>)}</ul>;
    case "conclusion":
      return <p>{doc.conclusion}</p>;
    default:
      return null;
  }
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("Academic Mini Project");
  const [techText, setTechText] = useState("");
  const [objectives, setObjectives] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [doc, setDoc] = useState<ProjectDocumentation | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("abstract");
  const [busy, setBusy] = useState<"analyze" | "generate" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const progress = useMemo(() => doc ? 100 : analysis ? 45 : file ? 20 : 0, [doc, analysis, file]);

  async function analyzeFile() {
    if (!file) return;
    setBusy("analyze"); setError(""); setNotice("");
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Source analysis failed.");
      setAnalysis(data.analysis);
      setNotice("Source code analyzed. Review the detected project details and generate documentation.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not analyze the uploaded ZIP.");
    } finally { setBusy(null); }
  }

  async function generate() {
    if (!title.trim()) { setError("Enter a project title to continue."); return; }
    if (!description.trim() && !analysis) { setError("Add a project description or analyze a ZIP source-code archive."); return; }
    setBusy("generate"); setError(""); setNotice("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: title, projectDescription: description, projectType,
          technologies: techText.split(",").map(x => x.trim()).filter(Boolean),
          objectives, analysis
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setDoc(data.documentation);
      setActiveSection("abstract");
      setNotice("Documentation generated. Review each section, edit it, and export your report.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Documentation generation failed.");
    } finally { setBusy(null); }
  }

  function updateDoc<K extends keyof ProjectDocumentation>(key: K, value: ProjectDocumentation[K]) {
    if (!doc) return;
    setDoc({ ...doc, [key]: value });
  }

  function sectionEditor() {
    if (!doc) return null;
    const textarea = (key: "abstract" | "problemStatement" | "dataFlow" | "conclusion", label: string) => (
      <label className="field-label">{label}
        <textarea className="editor-textarea" value={doc[key]} onChange={e => updateDoc(key, e.target.value)} rows={key === "abstract" ? 9 : 6}/>
      </label>
    );
    const listEditor = (key: "objectives" | "scope" | "functionalRequirements" | "nonFunctionalRequirements" | "limitations" | "assumptions" | "futureScope", label: string) => (
      <label className="field-label">{label}
        <span className="hint">One item per line</span>
        <textarea className="editor-textarea" value={lines(doc[key])} onChange={e => updateDoc(key, e.target.value.split("\\n").map(x => x.trim()).filter(Boolean))} rows={8}/>
      </label>
    );

    switch (activeSection) {
      case "abstract": return textarea("abstract", "Project abstract");
      case "problemStatement": return textarea("problemStatement", "Problem statement");
      case "objectives": return listEditor("objectives", "Project objectives");
      case "scope": return listEditor("scope", "Project scope");
      case "technologies": return <div className="stack">{doc.technologies.map((t, i) => <div className="mini-card" key={`${t.name}-${i}`}><strong>{t.name}</strong><p>{t.purpose}</p><span className="hint">{t.evidenceFiles.join(", ") || "No file evidence supplied"}</span></div>)}<p className="hint">Technologies are displayed from the generated structured report.</p></div>;
      case "architecture": return <div className="stack"><p className="body-copy">{doc.architecture.overview}</p><MermaidDiagram chart={doc.architecture.diagram}/><label className="field-label">Mermaid diagram source<textarea className="editor-textarea code-area" value={doc.architecture.diagram} onChange={e => updateDoc("architecture", { ...doc.architecture, diagram: e.target.value })} rows={7}/></label><h3 className="subheading">Architecture components</h3>{doc.architecture.components.map((c, i) => <div className="mini-card" key={`${c.name}-${i}`}><div className="row-between"><strong>{c.name}</strong><span className={`status status-${c.evidenceStatus}`}>{c.evidenceStatus}</span></div><p>{c.responsibility}</p><span className="hint">Files: {c.sourceFiles.join(", ") || "Not identified"}</span></div>)}</div>;
      case "modules": return <div className="stack">{doc.modules.map((m, i) => <div className="mini-card" key={`${m.name}-${i}`}><div className="row-between"><strong>{m.name}</strong><span className={`status status-${m.evidenceStatus}`}>{m.evidenceStatus}</span></div><p>{m.description}</p><p><b>Responsibilities:</b> {m.responsibilities.join("; ") || "Not specified"}</p><p><b>Inputs:</b> {m.inputs.join(", ") || "Not specified"}</p><p><b>Outputs:</b> {m.outputs.join(", ") || "Not specified"}</p><span className="hint">Files: {m.sourceFiles.join(", ") || "Not identified"}</span></div>)}</div>;
      case "functionalRequirements": return <div className="stack">{listEditor("functionalRequirements", "Functional requirements")}{listEditor("nonFunctionalRequirements", "Non-functional requirements")}{textarea("dataFlow", "Data flow description")}</div>;
      case "testingSuggestions": return <div className="stack">{doc.testingSuggestions.map((t, i) => <div className="mini-card" key={i}><strong>{t.scenario}</strong><p>{t.expectedResult}</p></div>)}</div>;
      case "limitations": return <div className="stack">{listEditor("limitations", "Limitations")}{listEditor("assumptions", "Assumptions")}</div>;
      case "futureScope": return listEditor("futureScope", "Future scope");
      case "conclusion": return textarea("conclusion", "Conclusion");
    }
  }

  const currentSection = sections.find(s => s.id === activeSection)!;

  return (
    <main className="app-shell">
      <header className="topbar no-print">
        <a className="brand" href="#" aria-label="DocuPilot AI home">
          <span className="brand-mark"><BookOpenText size={22}/></span>
          <span><strong>DocuPilot <span>AI</span></strong><small>PROJECT DOCUMENTATION STUDIO</small></span>
        </a>
        <div className="top-actions">
          {doc && <button className="button button-quiet" onClick={() => window.print()}><Download size={16}/> Export PDF</button>}
          <a className="avatar" href="#workspace" title="Workspace">DP</a>
        </div>
      </header>

      {!doc ? (
        <div className="main-content">
          <section className="hero">
            <div className="eyebrow"><Sparkles size={15}/> HACKATHON PROBLEM 27</div>
            <h1>Great projects deserve<br/><span>great documentation.</span></h1>
            <p>Turn your project idea and source code into clear, structured documentation — ready to review, refine, and export.</p>
            <div className="hero-points"><span><Check size={15}/> Code-aware analysis</span><span><Check size={15}/> Editable report</span><span><Check size={15}/> Architecture diagrams</span></div>
          </section>

          <section className="creation-grid">
            <div className="panel form-panel">
              <div className="panel-heading"><div><span className="step-label">STEP 01</span><h2>Tell us about your project</h2><p>Start with a description, upload source code, or use both.</p></div><div className="heading-icon"><WandSparkles size={20}/></div></div>
              <div className="form-stack">
                <label className="field-label">Project title <span className="required">*</span>
                  <input className="text-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Smart Campus Management System" maxLength={200}/>
                </label>
                <label className="field-label">Project type
                  <select className="text-input" value={projectType} onChange={e => setProjectType(e.target.value)}>
                    <option>Academic Mini Project</option><option>Hackathon Project</option><option>Technical Software Documentation</option><option>Final-Year Project</option>
                  </select>
                </label>
                <label className="field-label">Project description <span className="hint">Optional if source code is uploaded</span>
                  <textarea className="text-input description-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="What problem does your project solve? Who will use it? What does it do?" rows={5} maxLength={12000}/>
                </label>
                <label className="field-label">Technologies you know <span className="hint">Comma separated · optional</span>
                  <input className="text-input" value={techText} onChange={e => setTechText(e.target.value)} placeholder="Next.js, Firebase, Python"/>
                </label>
                <label className="field-label">Project objectives <span className="hint">Optional</span>
                  <textarea className="text-input" value={objectives} onChange={e => setObjectives(e.target.value)} placeholder="List the main objectives…" rows={2} maxLength={5000}/>
                </label>
              </div>
            </div>

            <div className="side-column">
              <div className="panel upload-panel">
                <div className="panel-heading compact"><div><span className="step-label">STEP 02</span><h2>Bring your source code</h2><p>Upload a ZIP archive for deeper analysis.</p></div><div className="heading-icon"><Code2 size={20}/></div></div>
                <label className={`dropzone ${file ? "has-file" : ""}`}>
                  <input type="file" accept=".zip,application/zip" onChange={e => {setFile(e.target.files?.[0] || null); setAnalysis(null); setError("");}}/>
                  {file ? <><span className="upload-icon"><FileArchive size={24}/></span><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · selected</span></> : <><span className="upload-icon"><UploadCloud size={25}/></span><strong>Drop your ZIP here</strong><span>or click to browse · maximum 5 MB</span></>}
                </label>
                {file && <div className="file-row"><span><FileArchive size={16}/>{file.name}</span><button className="icon-button" aria-label="Remove file" onClick={() => {setFile(null);setAnalysis(null);}}><X size={16}/></button></div>}
                <button className="button button-secondary full-width" onClick={analyzeFile} disabled={!file || busy !== null}>{busy === "analyze" ? <><LoaderCircle className="spin" size={17}/> Analyzing files…</> : <><FolderTree size={17}/> Analyze source code</>}</button>
                {analysis && <div className="analysis-summary"><div className="summary-title"><Check size={16}/> Analysis ready</div><div className="stat-row"><div><strong>{analysis.fileCount}</strong><span>source files</span></div><div><strong>{analysis.languages.length}</strong><span>languages</span></div><div><strong>{analysis.technologies.length}</strong><span>dependencies</span></div></div><p>{analysis.languages.join(", ") || "Languages not detected"}</p>{analysis.warnings.length > 0 && <p className="warning-text">{analysis.warnings[0]}</p>}</div>}
                <div className="privacy-note"><ShieldCheck size={16}/><span>Source files are processed for this request and are not saved to a project database by this MVP. Selected context may be sent to the configured AI provider.</span></div>
              </div>
              <div className="info-card"><div className="info-icon"><BrainCircuit size={19}/></div><div><strong>Evidence over guesswork</strong><p>We label findings as verified, inferred, or proposed so you can tell code evidence from AI suggestions.</p></div></div>
            </div>
          </section>

          <section className="bottom-cta panel">
            <div className="cta-icon"><Sparkles size={21}/></div><div className="cta-copy"><strong>Ready to build your report?</strong><span>Generate a structured first draft that you can edit before exporting.</span></div>
            <button className="button button-primary" onClick={generate} disabled={busy !== null}>{busy === "generate" ? <><LoaderCircle className="spin" size={17}/> Generating…</> : <>Generate documentation <ArrowRight size={17}/></>}</button>
          </section>
          {error && <div className="alert alert-error"><X size={18}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={15}/></button></div>}
          {notice && <div className="alert alert-success"><Check size={18}/>{notice}</div>}
        </div>
      ) : (
        <div className="workspace" id="workspace">
          <div className="workspace-heading no-print">
            <div><button className="back-link" onClick={() => setDoc(null)}>← Back to project setup</button><h1>{doc.projectTitle}</h1><p>Documentation workspace <span className="dot-separator">·</span> {doc.projectType}</p></div>
            <div className="workspace-actions"><button className="button button-secondary" onClick={() => downloadMarkdown(doc)}><Download size={16}/> Markdown</button><button className="button button-primary" onClick={() => window.print()}><Download size={16}/> Export PDF</button></div>
          </div>
          <div className="progress-wrap no-print"><div className="progress-label"><span><Check size={15}/> Draft generated</span><span>{progress}% complete</span></div><div className="progress-track"><div style={{width: `${progress}%`}}/></div></div>
          <div className="editor-layout">
            <aside className={`section-nav no-print ${mobileNav ? "nav-open" : ""}`}><div className="nav-heading">REPORT CONTENT <button className="icon-button mobile-close" onClick={() => setMobileNav(false)}><X size={16}/></button></div>{sections.map(s => {const Icon = s.icon;return <button key={s.id} className={`nav-item ${activeSection === s.id ? "active" : ""}`} onClick={() => {setActiveSection(s.id);setMobileNav(false);}}><Icon size={17}/><span>{s.label}</span><ChevronRight className="nav-chevron" size={15}/></button>})}<div className="nav-footer"><ShieldCheck size={15}/> Review all content before submission.</div></aside>
            {mobileNav && <button className="nav-backdrop no-print" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
            <section className="editor-main">
              <div className="editor-topline no-print"><span className="section-count">SECTION {sections.findIndex(s => s.id === activeSection) + 1} OF {sections.length}</span><button className="button button-quiet" onClick={() => setNotice("Edit the section below. Full regeneration is not enabled in this MVP to avoid overwriting your changes.")}><RefreshCw size={15}/> Regeneration guidance</button></div>
              <div className="document-paper" id="print-report">
                <div className="paper-header"><span className="paper-kicker">PROJECT DOCUMENTATION</span><span className="paper-badge">{doc.projectType}</span></div>
                <h2 className="paper-title">{doc.projectTitle}</h2>
                <div className="paper-meta">Generated with DocuPilot AI <span>•</span> Review and edit before submission</div>
                <div className="paper-rule"/>
                <div className="active-editor"><div className="active-title"><div><span className="step-label">EDIT SECTION</span><h3>{currentSection.label}</h3></div><span className="edit-pill"><span/> Editable draft</span></div>{sectionEditor()}</div>
                <div className="paper-footnote"><ShieldCheck size={14}/> AI-generated draft · Verify factual claims and institutional formatting before submission.</div>
              </div>

              <div className="document-paper print-document" aria-label="Full project report for printing">
                <div className="paper-header"><span className="paper-kicker">PROJECT DOCUMENTATION</span><span className="paper-badge">{doc.projectType}</span></div>
                <h2 className="paper-title">{doc.projectTitle}</h2>
                <div className="paper-meta">Generated with DocuPilot AI <span>•</span> Complete report</div>
                <div className="paper-rule"/>
                {sections.map((section) => (
                  <section key={section.id} className="print-section">
                    <h3 className="print-section-title">{section.label}</h3>
                    {renderPrintedSection(section.id, doc)}
                  </section>
                ))}
              </div>

              <div className="section-pagination no-print"><button className="button button-secondary" disabled={sections.findIndex(s => s.id === activeSection) === 0} onClick={() => setActiveSection(sections[Math.max(0, sections.findIndex(s => s.id === activeSection)-1)].id)}>Previous section</button><span>{sections.findIndex(s => s.id === activeSection)+1} / {sections.length}</span><button className="button button-primary" disabled={sections.findIndex(s => s.id === activeSection) === sections.length-1} onClick={() => setActiveSection(sections[Math.min(sections.length-1, sections.findIndex(s => s.id === activeSection)+1)].id)}>Next section <ArrowRight size={16}/></button></div>
            </section>
          </div>
        </div>
      )}

      <footer className="footer no-print"><span>DocuPilot AI <span className="dot-separator">·</span> Hackathon Problem 27</span><span>Built for clear, evidence-aware documentation</span></footer>
    </main>
  );
}
