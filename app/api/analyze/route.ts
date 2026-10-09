import { NextResponse } from "next/server";
import { analyzeZip } from "@/lib/zip-analysis";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a ZIP file to analyze source code." }, { status: 400 });
    }
    const analysis = await analyzeZip(file);
    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze this archive.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
