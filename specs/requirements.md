# whereis — Requirements

## Product
A CLI for a developer new to a codebase. For a plain-English question it answers:
1. **Where** is it? → exact, verified `file:line`
2. **Who** knows it? → people ranked by recent git history
3. **What breaks** if I change it? → importers (blast radius) + related tests to run

Value proposition: *"Cursor tells you where the code is. whereis tells you where it is, who knows it, and what you'll break."*

Sample repo for testing: `../demo-repos/express` (Express.js, full git history, 6k+ commits), cloned next to this project. Read-only; do not modify it.

## Priorities
A reliable, working core beats more features. R1–R4 are core; R5–R7 are important; R8 is optional.

## Functional requirements (EARS style)

### R1 Repo scan
- R1.1 WHEN the user runs any command with `-d <dir>` (default `.`), the system SHALL list files via `git ls-files -co --exclude-standard`, falling back to a recursive walk if `<dir>` is not a git repo.
- R1.2 The system SHALL skip `node_modules`, `dist`, `build`, `vendor`, `.git`, `coverage`, lockfiles, `*.min.js`, `*.map`, binary files (contain `\0`), and files > 200 KB.
- R1.3 The system SHALL keep only source/config extensions (ts, tsx, js, jsx, mjs, cjs, py, go, rs, java, kt, rb, php, cs, swift, c, h, cpp, vue, svelte, sql, sh, yml, yaml, toml, json, md, prisma, graphql, proto, tf).
- R1.4 For each file the system SHALL record its path, lines, and import/require targets.

### R2 `whereis ask "<question>"`
- R2.1 The system SHALL return at most 5 results, best first, each with `file:line` and a one-sentence reason.
- R2.2 Every returned `file` SHALL exist in the scan; results for unknown files SHALL be dropped.
- R2.3 **Line verification:** the LLM returns the *symbol* name at the location; the system SHALL resolve the line by finding the symbol's definition in the file (fall back to the LLM's line only if not found). Rationale: LLM-reported line numbers are unreliable; the code is the source of truth.
- R2.4 WHEN `-o/--open` is passed, the system SHALL open the top result in Cursor at the line (`cursor -g file:line`).
- R2.5 WHEN `--json` is passed, the system SHALL print results as JSON (no colors).
- R2.6 WHEN no result survives, the system SHALL print `No confident match found.` and exit 0.

### R3 Owners ("who to ask")
- R3.1 For the top result, the system SHALL show up to 2 people ranked by number of non-merge commits touching that file **in the last 2 years**; IF nobody committed in that window, rank by all-time commits instead.
- R3.2 Authors SHALL be merged case-insensitively by name (Express has both "TJ Holowaychuk" and "Tj Holowaychuk"); bots (`[bot]`, `dependabot`, `renovate`, `github-actions`) excluded.
- R3.3 Each owner SHALL show commit count and last-touched date in relative form (e.g. "3 months ago").
- R3.4 IF the dir is not a git repo or the file has no history, the section SHALL be omitted silently.
- Rationale: all-time ranking returns TJ Holowaychuk, who left Express ~2014. "Who to ask" must be someone still around.

### R4 Related tests
- R4.1 For the top result, the system SHALL list up to 3 test files, ranked by: (a) test file imports the result file, (b) test file name contains the result file's base name or the answer's symbol (e.g. `res.json` → `test/res.json.js`).
- R4.2 A test file is any path matching `test/`, `tests/`, `__tests__/`, `spec/`, `*.test.*`, `*.spec.*`, `test_*.py`, `*_test.go`.

### R5 Blast radius
- R5.1 For the top result, the system SHALL count non-test files whose resolved relative imports point to the result file (resolve `./x`, `./x.js`, `./x.ts`, `./x/index.js`, `./x/index.ts`).
- R5.2 Label: `low` (0–2), `medium` (3–9), `high` (≥10); show up to 3 importer paths.

### R6 LLM backend
- R6.1 IF `XAI_API_KEY` is set, use the xAI API (OpenAI SDK, `baseURL https://api.x.ai/v1`); ELSE IF `OPENAI_API_KEY`, use OpenAI; ELSE use the logged-in `grok` CLI (uses the CLI's own login; no key needed).
- R6.2 grok CLI call: `grok -p <prompt> -m <model> --disable-web-search --max-turns 3 --reasoning-effort low`, run in an empty temp dir, 180 s timeout. The prompt must say "Do not use any tools".
- R6.3 Model: `WHEREIS_MODEL` env, default `grok-4.6` (available: grok-4.6, grok-4.5).
- R6.4 The system SHALL tolerate LLM replies wrapped in prose or ```json fences.

### R7 Output
- R7.1 Default output (colors, top result highlighted):
```
scanned 153 files · asking grok-4.6 via grok-cli…

→ lib/response.js:236
    res.json serializes the body and sets Content-Type.
   👤 Ask: <recent maintainer> (N commits, 3 months ago), <second> (…)
   🧪 Run: test/res.json.js, test/res.jsonp.js
   ⚠️  Blast radius: low (1 importer: lib/express.js)
  lib/express.js:…
    …
6.1s
```
- R7.2 A spinner or "thinking…" indicator SHALL show while waiting on the LLM.

### R8 (stretch, only if time) `whereis map`
- Single self-contained HTML file: top-level folders as groups, import edges between folders (Mermaid), opened in the browser.

## Non-functional
- NF1 `ask` on Express completes in ≤ 15 s with the grok CLI backend.
- NF2 TypeScript ESM, Node ≥ 20, pnpm. Runtime deps limited to `commander`, `openai`, `dotenv`; dev deps `typescript`, `tsx`, `@types/node`. git via `child_process.execFileSync`.
- NF3 Only the file list + ~10 short excerpts are sent to the LLM, never the whole repo (privacy).

## Acceptance tests (run from the project root)
| # | Command | Expected |
|---|---|---|
| A1 | `pnpm dev ask "where is the response json method implemented?" -d ../demo-repos/express` | top = `lib/response.js:236`; tests include `test/res.json.js`; owners shown, each active in the last 2 years |
| A2 | `pnpm dev ask "where are route params parsed?" -d ../demo-repos/express` | a result in `lib/application.js` (`app.param`, ~322) or `lib/express.js` |
| A3 | `pnpm dev ask "where is the view engine rendering done?" -d ../demo-repos/express` | top = `lib/view.js:133`; tests include `test/app.render.js` |
| A4 | A1 with `--json` | valid JSON array with `file`, `line`, `why`, `owners`, `tests`, `blast` |
| A5 | A1 with `-d /tmp` | no crash; "No confident match found." |
| A6 | `pnpm typecheck` | passes |
