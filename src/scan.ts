import { execFileSync } from "child_process";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

export type SourceFile = {
  path: string;
  text: string;
  lines: string[];
  imports: string[];
};

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "vendor",
  ".git",
  "coverage",
  // Dependency trees, same idea as node_modules / vendor. Without this a
  // recursive walk of a non-repo like /tmp treats leftover virtualenvs as the codebase.
  "site-packages",
  "venv",
  ".venv",
  "__pycache__",
]);

const EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "go",
  "rs",
  "java",
  "kt",
  "rb",
  "php",
  "cs",
  "swift",
  "c",
  "h",
  "cpp",
  "vue",
  "svelte",
  "sql",
  "sh",
  "yml",
  "yaml",
  "toml",
  "json",
  "md",
  "prisma",
  "graphql",
  "proto",
  "tf",
]);

const LOCKFILES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "npm-shrinkwrap.json",
  "cargo.lock",
  "gemfile.lock",
  "composer.lock",
  "poetry.lock",
  "pipfile.lock",
  "go.sum",
]);

const MAX_BYTES = 200 * 1024;

function toPosix(rel: string): string {
  return rel.split(path.sep).join("/");
}

function isLockfile(base: string): boolean {
  const lower = base.toLowerCase();
  return LOCKFILES.has(lower) || lower.endsWith(".lock");
}

function allowedPath(rel: string): boolean {
  const parts = rel.split("/");
  if (parts.some((part) => SKIP_DIRS.has(part))) return false;
  const base = parts[parts.length - 1] ?? "";
  if (!base || base.endsWith(".min.js") || base.endsWith(".map")) return false;
  if (isLockfile(base)) return false;
  const ext = base.includes(".") ? base.slice(base.lastIndexOf(".") + 1).toLowerCase() : "";
  return EXTENSIONS.has(ext);
}

function listGit(dir: string): string[] | null {
  try {
    const out = execFileSync(
      "git",
      ["-C", dir, "ls-files", "-co", "--exclude-standard", "-z"],
      { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
    );
    return out.split("\0").filter(Boolean).map(toPosix);
  } catch {
    return null;
  }
}

function walk(dir: string, root: string, acc: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, root, acc);
    } else if (ent.isFile()) {
      acc.push(toPosix(path.relative(root, full)));
    }
  }
}

function extractImports(text: string, filePath: string): string[] {
  const found = new Set<string>();
  const grab = (re: RegExp) => {
    for (const match of text.matchAll(re)) {
      if (match[1]) found.add(match[1]);
    }
  };
  grab(/\bfrom\s+['"]([^'"]+)['"]/g);
  grab(/(?:^|[^\w.])import\s+['"]([^'"]+)['"]/g);
  grab(/\bimport\s*\(\s*['"]([^'"]+)['"]/g);
  grab(/\brequire\s*\(\s*['"]([^'"]+)['"]/g);
  if (filePath.endsWith(".py")) {
    for (const match of text.matchAll(/^\s*from\s+([\w.]+)\s+import\b/gm)) {
      if (match[1]) found.add(match[1]);
    }
    for (const match of text.matchAll(/^\s*import\s+([^\n#]+)/gm)) {
      for (const part of (match[1] ?? "").split(",")) {
        const name = part.trim().split(/\s+/)[0] ?? "";
        if (/^[\w.]+$/.test(name)) found.add(name);
      }
    }
  }
  return [...found];
}

function readSource(root: string, rel: string): SourceFile | null {
  const full = path.join(root, ...rel.split("/"));
  let size = 0;
  try {
    const st = statSync(full);
    if (!st.isFile()) return null;
    size = st.size;
  } catch {
    return null;
  }
  if (size > MAX_BYTES) return null;
  const buf = readFileSync(full);
  if (buf.includes(0)) return null;
  const text = buf.toString("utf8");
  const lines = text.split(/\r?\n/);
  if (text.endsWith("\n") || text.endsWith("\r\n")) lines.pop();
  return { path: rel, text, lines, imports: extractImports(text, rel) };
}

export function scan(dir: string): SourceFile[] {
  const root = path.resolve(dir);
  const listed = listGit(root) ?? walkCollected(root);
  const seen = new Set<string>();
  const files: SourceFile[] = [];
  for (const rel of listed) {
    if (!rel || seen.has(rel) || !allowedPath(rel)) continue;
    seen.add(rel);
    const file = readSource(root, rel);
    if (file) files.push(file);
  }
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return files;
}

function walkCollected(root: string): string[] {
  const acc: string[] = [];
  walk(root, root, acc);
  return acc;
}
