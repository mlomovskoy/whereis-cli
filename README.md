# whereis

A CLI that tells you where a change lives, who to ask, and what you'll break.

## Install

```bash
pnpm install
pnpm build
```

You need Node 20+, pnpm, and git. LLM calls use the logged-in `grok` CLI (`grok` must already be authenticated). To use an API instead, set `XAI_API_KEY` or `OPENAI_API_KEY`. Override the model with `WHEREIS_MODEL` (default `grok-4.6`).

## Examples

```bash
pnpm dev ask "where is the response json method implemented?" -d ../demo-repos/express
pnpm dev ask "where are route params parsed?" -d ../demo-repos/express
pnpm dev ask "where is the view engine rendering done?" -d ../demo-repos/express --json
```

`node dist/cli.js ask "where is the response json method implemented?" -d ../demo-repos/express` does the same after `pnpm build`. Add `-o` to open the top hit in Cursor, or `--json` for a JSON array.

## How it works

1. List the repo with `git ls-files` (or a file walk if it is not a git repo) and keep source files, skipping dependencies, lockfiles, and large or binary files.
2. Rank files by keywords from the question and send the question, a path list, and short excerpts to the model.
3. Drop any path the model invented, then find the symbol's definition line in the real file.
4. For the top hit, add recent git authors, related tests, and how many non-test files import it.

## What is sent to the LLM

Only the question, up to 150 file paths, and about 10 excerpts of roughly 1500 characters each. The rest of the repository stays local.
