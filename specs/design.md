# whereis — Design

## Project layout (to be created in T0)
```
package.json      name "whereis-cli", type "module", bin {"whereis": "dist/cli.js"},
                  scripts: dev = "tsx src/cli.ts", build = "tsc", typecheck = "tsc --noEmit"
tsconfig.json     ES2022, module/moduleResolution NodeNext, strict, rootDir src, outDir dist
.gitignore        node_modules, dist, .env, .DS_Store
.env.example      XAI_API_KEY= / # OPENAI_API_KEY= / # WHEREIS_MODEL=
src/              modules below
```

## Modules (`src/`)
| File | Responsibility | Exports |
|---|---|---|
| `scan.ts` | R1: list + read files, extract imports | `scan(dir): SourceFile[]`, `type SourceFile = { path, text, lines, imports }` |
| `llm.ts` | R6: backend selection, grok CLI call, JSON extraction | `complete(prompt): Promise<string>`, `extractJson<T>(text)`, `MODEL`, `backend` |
| `ask.ts` | R2: keyword ranking, excerpts, prompt, line verification | `ask(files, question): Promise<Answer[]>`, `type Answer = { file, line, symbol?, why }` |
| `git.ts` | R3: owners from git log | `owners(dir, file, max=2): Owner[]` |
| `impact.ts` | R4 + R5: related tests, importers | `relatedTests(files, answer)`, `importers(files, file)` |
| `cli.ts` | commander wiring, output formatting (R7); first line `import "dotenv/config"` | none |

## Flow of `ask`
```
scan(dir) ──► rank files by keywords ──► top 10 files
                                           │ excerpts (numbered lines, definition lines first)
                                           ▼
                         prompt = question + file list (≤150 paths) + excerpts
                                           │ complete()
                                           ▼
                      JSON [{file, symbol, line, why}] ──► drop unknown files
                                           │ resolveLine(symbol) on the real file
                                           ▼
         top result ──► owners() · relatedTests() · importers()  ──► print
```

## Key algorithms
**Import extraction:** regex over the text for `import … from '<x>'`, `import('<x>')`, `require('<x>')`, Python `import x` / `from x import`.

**Keywords:** lowercase words from the question, length > 2, minus stopwords (the, a, an, is, are, do, does, where, which, what, how, can, i, we, to, of, in, on, for, and, or, with, this, that, it, be, add, change, find, handled, handle, code, file, files), plus a crude stem (strip `ing|es|s|ed`), deduplicated.

**File ranking score:** +10 per keyword in path; + min(occurrences in text, 20) per keyword; ×0.3 for test/example/docs paths; ×0.5 for `.md`/`.json`. Keep score > 0, top 10. If none, take the first 10 files.

**Excerpt per file (~1500 chars):** first 5 lines, then lines ranked by score = distinct keywords hit × (3 if the line looks like a definition else 1), each with 1 line before / 2 after, until the budget is spent. Print as `N: code` (line truncated to 200 chars) sorted by N, with `...` for gaps.
Definition regex: `\b(function|class|def|func|fn|interface|type|const|let|var|export)\b`, or `x.y = function`, or `x = (` / `x: (`.
*Why:* a naive "first N matching lines" excerpt can spend its budget on early mentions and miss the actual definition further down the file.

**resolveLine(file, symbol, fallback):** try in order (1) a line containing the full symbol (e.g. `res.json`, parentheses stripped) that looks like a definition; (2) `\bname\b` (last segment after `.`/`#`/`:`) + definition; (3) any `\bname\b`; (4) fallback.

**Owners:** `git -C dir log --use-mailmap --no-merges --format=%aN|%at -- file`. Group by lowercased name (display the most common spelling), count commits and max timestamp. Primary ranking: commits with timestamp within the last 2 years; if that set is empty, all-time. Filter bots. Relative time: minutes/hours/days/weeks/months/years ago.

**Import resolution (blast radius, related tests):** for each relative import `./x` / `../x` of a file, normalise `path.posix.join(dirname(importer), spec)` and try `x`, `x.js`, `x.ts`, `x.tsx`, `x/index.js`, `x/index.ts` against the scanned path set.

## Prompt (ask)
```
You help a developer who is new to this codebase find WHERE to look or make a change.
Question: <q>
Repository file list:
<paths>
Relevant excerpts (format "lineNumber: code"):
### <path>
<excerpt>
Do not use any tools; everything you need is above. Answer with ONLY a JSON array (no prose), best match first, at most 5 items:
[{"file": "<path from the list>", "symbol": "<function/class/variable name at that spot, e.g. res.json>", "line": <line number from the excerpts>, "why": "<one short sentence>"}]
```

## Environment notes and constraints
- `grok -p` is slow with default reasoning; keep `--reasoning-effort low` and the prompt small (10 files, 1500-char excerpts, ≤150 paths) to stay within NF1.
- `grok -p` runs an agent: with `--max-turns 1` a tool attempt ends in "Max turns reached", so use 3 plus "Do not use any tools".
- pnpm is v12: there is no `-s` flag; use `pnpm <script>`.
- Express 5 moved routing into the separate `router` package, so "route params" answers pointing at `app.param` / `lib/express.js` are correct.
- In Express, `res.json` is defined at `lib/response.js:236`, `app.param` at `lib/application.js:322`, `View.prototype.render` at `lib/view.js:133`; the only importer of `lib/response.js` is `lib/express.js`.
