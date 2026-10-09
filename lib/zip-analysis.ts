import JSZip from "jszip";
import type { ProjectAnalysis } from "./types";

const MAX_COMPRESSED_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 500;
const MAX_TOTAL_TEXT = 120_000;
const MAX_FILE_TEXT = 12_000;

const ignoredParts = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "vendor",
  ".venv",
  "venv",
  "__pycache__",
  ".idea",
  ".vscode",
]);

const allowedExt = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".html",
  ".css",
  ".sql",
  ".json",
  ".md",
  ".yaml",
  ".yml",
  ".xml",
  ".php",
  ".go",
  ".rs",
  ".toml",
  ".prisma",
  ".sh",
  ".env.example",
]);

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\\s\\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /(?i:api[_-]?key|secret|token|password)\\s*[:=]\\s*["'][^"']{8,}["']/g,
];

function extension(path: string) {
  const name = path.split("/").pop() || "";
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function isSecretPath(path: string) {
  const p = path.toLowerCase();
  return (
    (/(^|\\/)\\.env($|\\.)/.test(p) && !p.endsWith(".env.example")) ||
    /(^|\\/)(id_rsa|id_ed25519|credentials\\.json|secrets?\\.json)$/.test(p)
  );
}

function redact(text: string) {
  let out = text;
  for (const re of secretPatterns) {
    try {
      out = out.replace(re, "[REDACTED_SECRET]");
    } catch {
      // no-op
    }
  }
  out = out.replace(/(AIza[0-9A-Za-z_-]{30,})/g, "[REDACTED_API_KEY]");
  out = out.replace(/(gh[pousr]_[A-Za-z0-9_]{20,})/g, "[REDACTED_TOKEN]");
  return out;
}

export async function analyzeZip(file: File): Promise<ProjectAnalysis> {
  if (file.size > MAX_COMPRESSED_BYTES) {
    throw new Error("ZIP is larger than the 5 MB MVP limit.");
  }
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Please upload a .zip archive.");
  }

  const zip = await JSZip.loadAsync(await file.arrayBuffer(), { checkCRC32: true });
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  if (entries.length > MAX_FILES) {
    throw new Error(`Archive contains more than ${MAX_FILES} files.`);
  }

  const fileTree: string[] = [];
  const importantFiles: string[] = [];
  const dependencySummary: string[] = [];
  const languages = new Set<string>();
  const technologies = new Set<string>();
  let sourceContext = "";
  let totalText = 0;
  let extractedBytes = 0;
  const maxExtractedBytes = 25 * 1024 * 1024;
  const warnings: string[] = [];

  for (const entry of entries) {
    const path = entry.name.replace(/\\/g, "/");

    if (
      path.startsWith("/") ||
      path.split("/").some((part) => part === "..") ||
      /^[A-Za-z]:/.test(path)
    ) {
      warnings.push(`Skipped unsafe path: ${path.slice(0, 120)}`);
      continue;
    }

    const parts = path.split("/");
    if (parts.some((part) => ignoredParts.has(part)) || isSecretPath(path)) {
      continue;
    }

    const ext = extension(path);
    if (!allowedExt.has(ext)) continue;

    const content = await entry.async("uint8array");
    extractedBytes += content.byteLength;

    if (extractedBytes > maxExtractedBytes) {
      throw new Error("Extracted content exceeds the 25 MB safety limit.");
    }

    if (content.byteLength > MAX_FILE_TEXT * 4) {
      warnings.push(`Skipped oversized source file: ${path}`);
      continue;
    }

    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(content);
    } catch {
      continue;
    }

    if (text.includes("\u0000")) continue;

    text = redact(text).slice(0, MAX_FILE_TEXT);
    fileTree.push(path);

    if (
      /package\.json$/.test(path) ||
      /requirements\.txt$/.test(path) ||
      /pyproject\.toml$/.test(path) ||
      /pom\.xml$/.test(path) ||
      /Cargo\.toml$/.test(path) ||
      /go\.mod$/.test(path)
    ) {
      importantFiles.push(path);

      if (/package\.json$/.test(path)) {
        try {
          const pkg = JSON.parse(text);
          for (const [name, version] of Object.entries({
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
          })) {
            technologies.add(name);
            dependencySummary.push(`${name}: ${String(version)}`);
          }
          if (pkg.name) dependencySummary.unshift(`Package: ${pkg.name}`);
        } catch {
          warnings.push(`Could not parse ${path}`);
        }
      } else {
        dependencySummary.push(`${path}: manifest detected`);
      }
    }

    if (
      /readme/i.test(path) ||
      /(^|\/)(src|app|pages|lib|api)\//i.test(path) ||
      /(^|\/)(main|index|server|app)\.(ts|tsx|js|jsx|py|java|c|cpp)$/.test(path)
    ) {
      if (importantFiles.length < 80 && !importantFiles.includes(path)) {
        importantFiles.push(path);
      }
    }

    const languageMap: Record<string, string> = {
      ".ts": "TypeScript",
      ".tsx": "TypeScript/React",
      ".js": "JavaScript",
      ".jsx": "JavaScript/React",
      ".py": "Python",
      ".java": "Java",
      ".c": "C",
      ".cpp": "C++",
      ".html": "HTML",
      ".css": "CSS",
      ".sql": "SQL",
      ".php": "PHP",
      ".go": "Go",
      ".rs": "Rust",
    };

    if (languageMap[ext]) languages.add(languageMap[ext]);

    if (totalText < MAX_TOTAL_TEXT && sourceContext.length < MAX_TOTAL_TEXT) {
      const chunk = `\n\n--- FILE: ${path} ---\n${text.slice(0, Math.min(text.length, MAX_TOTAL_TEXT - totalText))}`;
      sourceContext += chunk;
      totalText += chunk.length;
    }
  }

  if (!fileTree.length) {
    warnings.push(
      "No supported text source files were found. You can still generate documentation from the project description."
    );
  }

  return {
    fileCount: fileTree.length,
    fileTree: fileTree.slice(0, 250),
    languages: [...languages],
    technologies: [...technologies].slice(0, 100),
    importantFiles: [...new Set(importantFiles)].slice(0, 80),
    dependencySummary: dependencySummary.slice(0, 150),
    sourceContext,
    warnings,
  };
}
