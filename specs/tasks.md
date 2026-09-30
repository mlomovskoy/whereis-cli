# whereis — Tasks

Work top to bottom. After each task: `pnpm typecheck`, run the listed check, tick the box, commit, push. Don't start a task before the previous check passes. If a check fails twice, stop and report.

- [x] **T0 Project + GitHub repo**
  1. In this folder: create `package.json`, `tsconfig.json`, `.gitignore`, `.env.example` exactly as in design.md "Project layout".
  2. `pnpm add commander openai dotenv` and `pnpm add -D typescript tsx @types/node`.
  3. `git init -b main`, commit (specs, rules, config).
  4. Create the GitHub repo and push: `gh repo create whereis-cli --public --source=. --push --description "Where is it, who knows it, what breaks: onboarding CLI for any repo"`. If the name is taken, use `whereis-onboard`.
  Check: `gh repo view --json url` prints the URL; `pnpm typecheck` runs (an empty `src/cli.ts` is fine).
- [x] **T1 Scanner** (R1): `src/scan.ts`.
  Check: a temporary script prints ~150 files for `../demo-repos/express`, none under `node_modules`.
- [x] **T2 LLM backend** (R6): `src/llm.ts`.
  Check: `complete("Reply with exactly: ok")` returns `ok` via the grok CLI in < 10 s.
- [x] **T3 ask core** (R2.1–R2.3, R2.6): `src/ask.ts` + `ask` command in `src/cli.ts`.
  Check: acceptance tests A1 (location only), A2, A3, A5.
- [x] **T4 Owners** (R3): `src/git.ts`, printed under the top result.
  Check: A1 shows owners active in the last 2 years; the two TJ spellings are merged if TJ appears.
- [x] **T5 Tests + blast radius** (R4, R5): `src/impact.ts`, printed under the top result.
  Check: A1 shows `test/res.json.js` and `lib/express.js` as the importer; A3 shows `test/app.render.js`.
- [x] **T6 Output polish** (R7, R2.4, R2.5): colors, spinner, timing, `--open`, `--json`.
  Check: A4; `-o` opens Cursor at the line.
- [ ] **T7 Hardening:** run A1–A6 twice, fix flakiness; `pnpm build` then `node dist/cli.js ask …` works. Write README.md (one-line summary, install, 3 example commands, how it works, what's sent to the LLM).
- [ ] **T8 (stretch) map** (R8).
