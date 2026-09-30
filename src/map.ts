import path from "path";
import type { SourceFile } from "./scan.js";

const SUFFIXES = ["", ".js", ".ts", ".tsx", "/index.js", "/index.ts"];

function folderOf(filePath: string): string {
  const parts = filePath.split("/");
  return parts.length > 1 ? parts[0]! : "(root)";
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

export function folderEdges(files: SourceFile[]): { from: string; to: string; count: number }[] {
  const known = new Set(files.map((file) => file.path));
  const counts = new Map<string, number>();
  for (const file of files) {
    const from = folderOf(file.path);
    for (const spec of file.imports) {
      const target = resolveImport(file.path, spec, known);
      if (!target) continue;
      const to = folderOf(target);
      const key = `${from}\0${to}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [from, to] = key.split("\0");
      return { from: from ?? "", to: to ?? "", count };
    })
    .sort((a, b) => b.count - a.count || (a.from < b.from ? -1 : 1));
}

function mermaidId(index: number): string {
  return `f${index}`;
}

function mermaidLabel(label: string): string {
  return label.replace(/["[\]<>]/g, "");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderMapHtml(files: SourceFile[]): string {
  const edges = folderEdges(files);
  const folders = new Set<string>();
  for (const file of files) folders.add(folderOf(file.path));
  for (const edge of edges) {
    folders.add(edge.from);
    folders.add(edge.to);
  }
  const names = [...folders].sort();
  const ids = new Map(names.map((name, index) => [name, mermaidId(index)]));
  const lines = ["flowchart LR"];
  for (const name of names) {
    const id = ids.get(name);
    lines.push(`  ${id}["${mermaidLabel(name)}"]`);
  }
  for (const edge of edges) {
    lines.push(`  ${ids.get(edge.from)} -->|${edge.count}| ${ids.get(edge.to)}`);
  }
  const diagram = lines.join("\n");
  const legend = edges
    .map((edge) => `<li>${escapeHtml(edge.from)} → ${escapeHtml(edge.to)} (${edge.count})</li>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>whereis map</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; }
    h1 { font-size: 1.25rem; }
  </style>
</head>
<body>
  <h1>whereis map</h1>
  <p>${files.length} files · ${names.length} folders · ${edges.length} import edges</p>
  <pre class="mermaid">${diagram}</pre>
  <ul>
${legend}
  </ul>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
    mermaid.initialize({ startOnLoad: true, securityLevel: "loose" });
  </script>
</body>
</html>
`;
}
