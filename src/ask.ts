import type { SourceFile } from "./scan.js";
import { complete, extractJson } from "./llm.js";

export type Answer = {
  file: string;
  line: number;
  symbol?: string;
  why: string;
};

const STOPWORDS = new Set(
  "the a an is are do does where which what how can i we to of in on for and or with this that it be add change find handled handle code file files".split(
    " ",
  ),
);

const DEF_RE =
  /\b(?:function|class|def|func|fn|interface|type|const|let|var|export)\b|[\w$]+\.[\w$]+\s*=\s*function\b|[\w$]+\s*=\s*\(|[\w$]+\s*:\s*\(/;

type RawAnswer = {
  file?: unknown;
  symbol?: unknown;
  line?: unknown;
  why?: unknown;
};

export function keywordsOf(question: string): string[] {
  const words = question.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (word: string) => {
    if (word.length <= 2 || STOPWORDS.has(word) || seen.has(word)) return;
    seen.add(word);
    out.push(word);
  };
  for (const word of words) {
    if (word.length <= 2 || STOPWORDS.has(word)) continue;
    add(word);
    const stemmed = word.replace(/(ing|es|ed|s)$/, "");
    if (stemmed !== word) add(stemmed);
  }
  return out;
}

function countCapped(haystack: string, needle: string, cap: number): number {
  let count = 0;
  let from = 0;
  while (count < cap) {
    const at = haystack.indexOf(needle, from);
    if (at < 0) break;
    count++;
    from = at + Math.max(needle.length, 1);
  }
  return count;
}

function downrankPath(filePath: string): boolean {
  return filePath
    .toLowerCase()
    .split("/")
    .some((part) =>
      ["test", "tests", "__tests__", "spec", "specs", "example", "examples", "doc", "docs"].includes(part),
    );
}

function scoreFile(file: SourceFile, keywords: string[]): number {
  const pathText = file.path.toLowerCase();
  const body = file.text.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (pathText.includes(keyword)) score += 10;
    score += countCapped(body, keyword, 20);
  }
  if (downrankPath(file.path)) score *= 0.3;
  if (file.path.endsWith(".md") || file.path.endsWith(".json")) score *= 0.5;
  return score;
}

function isDefinition(line: string): boolean {
  return DEF_RE.test(line);
}

function lineScore(line: string, keywords: string[]): number {
  const lower = line.toLowerCase();
  let hits = 0;
  for (const keyword of keywords) {
    if (lower.includes(keyword)) hits++;
  }
  if (hits === 0) return 0;
  return hits * (isDefinition(line) ? 3 : 1);
}

function excerpt(file: SourceFile, keywords: string[]): string {
  const total = file.lines.length;
  const chosen = new Set<number>();
  for (let i = 0; i < Math.min(5, total); i++) chosen.add(i);

  const ranked = file.lines
    .map((line, index) => ({ index, score: lineScore(line, keywords) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const render = (picked: Set<number>) => formatExcerpt(file, picked);

  for (const item of ranked) {
    const next = new Set(chosen);
    for (const index of [item.index - 1, item.index, item.index + 1, item.index + 2]) {
      if (index >= 0 && index < total) next.add(index);
    }
    if (render(next).length > 1500) break;
    for (const index of next) chosen.add(index);
  }
  return render(chosen);
}

function formatExcerpt(file: SourceFile, picked: Set<number>): string {
  const indexes = [...picked].sort((a, b) => a - b);
  const rows: string[] = [];
  let previous = -1;
  for (const index of indexes) {
    if (previous >= 0 && index > previous + 1) rows.push("...");
    const text = file.lines[index] ?? "";
    rows.push(`${index + 1}: ${text.slice(0, 200)}`);
    previous = index;
  }
  return rows.join("\n");
}

function fileList(files: SourceFile[], ranked: SourceFile[]): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();
  const push = (filePath: string) => {
    if (paths.length >= 150 || seen.has(filePath)) return;
    seen.add(filePath);
    paths.push(filePath);
  };
  for (const file of ranked) push(file.path);
  for (const file of files) push(file.path);
  return paths;
}

function buildPrompt(question: string, files: SourceFile[], ranked: SourceFile[], keywords: string[]): string {
  const excerpts = ranked
    .map((file) => `### ${file.path}\n${excerpt(file, keywords)}`)
    .join("\n");
  return `You help a developer who is new to this codebase find WHERE to look or make a change.
Question: ${question}
Repository file list:
${fileList(files, ranked).join("\n")}
Relevant excerpts (format "lineNumber: code"):
${excerpts}
Do not use any tools; everything you need is above. Answer with ONLY a JSON array (no prose), best match first, at most 5 items:
[{"file": "<path from the list>", "symbol": "<function/class/variable name at that spot, e.g. res.json>", "line": <line number from the excerpts>, "why": "<one short sentence>"}]`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolveLine(file: SourceFile, symbol: string | undefined, fallback: number): number {
  const lines = file.lines;
  const clamp = (line: number) => (line >= 1 && line <= lines.length ? line : 1);
  const safeFallback = clamp(Number.isFinite(fallback) ? fallback : 1);
  if (!symbol?.trim()) return safeFallback;
  const full = symbol.replace(/[()]/g, "").trim();
  const name = full.split(/[.#:]/).pop()?.trim() || full;
  const find = (pred: (line: string) => boolean) => {
    for (let i = 0; i < lines.length; i++) {
      if (pred(lines[i] ?? "")) return i + 1;
    }
    return 0;
  };
  const nameRe = new RegExp(`\\b${escapeRegExp(name)}\\b`);
  const hit =
    (full ? find((line) => line.includes(full) && isDefinition(line)) : 0) ||
    find((line) => nameRe.test(line) && isDefinition(line)) ||
    find((line) => nameRe.test(line)) ||
    safeFallback;
  return clamp(hit);
}

function asAnswers(files: SourceFile[], raw: string): Answer[] {
  let parsed: unknown;
  try {
    parsed = extractJson<unknown>(raw);
  } catch {
    return [];
  }
  const items = Array.isArray(parsed) ? parsed : [parsed];
  const byPath = new Map(files.map((file) => [file.path, file]));
  const answers: Answer[] = [];
  for (const item of items) {
    if (answers.length >= 5 || !item || typeof item !== "object") continue;
    const row = item as RawAnswer;
    const filePath = typeof row.file === "string" ? row.file.replace(/^\.\//, "").replaceAll("\\", "/") : "";
    const file = byPath.get(filePath);
    if (!file) continue;
    const symbol = typeof row.symbol === "string" ? row.symbol.trim() : undefined;
    const fallback = typeof row.line === "number" ? row.line : Number(row.line);
    const line = resolveLine(file, symbol, Number.isFinite(fallback) ? fallback : 1);
    const why = typeof row.why === "string" ? row.why.trim() : "";
    answers.push({ file: filePath, line, symbol, why });
  }
  return answers;
}

export async function ask(files: SourceFile[], question: string): Promise<Answer[]> {
  if (files.length === 0) return [];
  const keywords = keywordsOf(question);
  const ranked = files
    .map((file) => ({ file, score: scoreFile(file, keywords) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const generic = new Set(["method", "implement", "implemented", "done"]);
  const distinctive = keywords.filter((keyword) => !generic.has(keyword));
  const relevant = ranked.filter((item) => {
    if (/\.(md|json)$/.test(item.file.path)) return false;
    const haystack = `${item.file.path}\n${item.file.text}`.toLowerCase();
    const keys = distinctive.length > 0 ? distinctive : keywords;
    return keys.some((keyword) => haystack.includes(keyword));
  });
  if (relevant.length === 0) return [];
  const top = relevant.map((item) => item.file).slice(0, 10);
  const raw = await complete(buildPrompt(question, files, top, keywords));
  return asAnswers(files, raw);
}
