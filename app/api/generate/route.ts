import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDocumentation } from "@/lib/ai";
import type { ProjectAnalysis } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  projectTitle: z.string().trim().min(1).max(200),
  projectDescription: z.string().max(12000).default(""),
  projectType: z.string().max(100).default("Academic Mini Project"),
  technologies: z.array(z.string().max(100)).max(30).default([]),
  objectives: z.string().max(5000).default(""),
  analysis: z.object({
    fileCount: z.number().int().min(0).max(500),
    fileTree: z.array(z.string().max(500)).max(250),
    languages: z.array(z.string().max(100)).max(50),
    technologies: z.array(z.string().max(200)).max(100),
    importantFiles: z.array(z.string().max(500)).max(80),
    dependencySummary: z.array(z.string().max(500)).max(150),
    sourceContext: z.string().max(120000),
    warnings: z.array(z.string().max(500)).max(50)
  }).nullable().optional()
}).refine((data) => data.projectDescription.trim().length > 0 || (data.analysis?.fileCount ?? 0) > 0, {
  message: "Provide a project description or upload usable source code."
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });
    }
    const documentation = await generateDocumentation(parsed.data as {
      projectTitle: string; projectDescription: string; projectType: string;
      technologies: string[]; objectives: string; analysis?: ProjectAnalysis | null;
    });
    return NextResponse.json({ documentation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Documentation generation failed.";
    const status = /API key is missing/i.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
