import path from "path";
import type { SourceFile } from "./scan.js";

const SUFFIXES = ["", ".js", ".ts", ".tsx", "/index.js", "/index.ts"];

export type Blast = {
  label: "low" | "medium" | "high";
  count: number;
  paths: string[];
};

function isTest(filePath: string): boolean {
  const parts = filePath.split("/");
  const base = parts[parts.length - 1] ?? "";
  if (parts.some((part) => part === "test" || part === "tests" || part === "__tests__" || part === "spec")) {
    return true;
  }
  if (/\.(test|spec)\./.test(base)) return true;
  if (base.startsWith("test_") && base.endsWith(".py")) return true;
  if (base.endsWith("_test.go")) return true;
  return false;
}

function resolveImport(importer: string, spec: string, known: Set<string>): string | null {
  if (!spec.startsWith(".")) return null;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(importer), spec));
  for (const suffix of SUFFIXES) {
    const candidate = `${base}${suffix}`;
    if (known.has(candidate)) return candidate;
  }
  return null;
}

export function importers(files: SourceFile[], file: string): Blast {
  const known = new Set(files.map((item) => item.path));
  const hits: string[] = [];
  for (const item of files) {
    if (item.path === file || isTest(item.path)) continue;
    const points = item.imports.some((spec) => resolveImport(item.path, spec, known) === file);
    if (points) hits.push(item.path);
  }
  hits.sort();
  const count = hits.length;
  const label = count >= 10 ? "high" : count >= 3 ? "medium" : "low";
  return { label, count, paths: hits.slice(0, 3) };
}

export function relatedTests(files: SourceFile[], answer: { file: string; symbol?: string }): string[] {
  const known = new Set(files.map((item) => item.path));
  const base = answer.file.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase() ?? "";
  const symbol = (answer.symbol ?? "").replace(/[()]/g, "").trim().toLowerCase();
  const symbolName = symbol.split(/[.#:]/).pop() ?? "";
  const scored = files
    .filter((item) => isTest(item.path))
    .map((item) => {
      const name = (item.path.split("/").pop() ?? "").toLowerCase();
      let score = 0;
      if (item.imports.some((spec) => resolveImport(item.path, spec, known) === answer.file)) score += 100;
      if (base && name.includes(base)) score += 10;
      if (symbol && name.includes(symbol)) score += 10;
      if (symbolName && symbolName !== symbol && name.includes(symbolName)) score += 8;
      return { path: item.path, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return scored.slice(0, 3).map((item) => item.path);
}
