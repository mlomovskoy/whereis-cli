import "dotenv/config";
import { spawn } from "child_process";
import { Command } from "commander";
import path from "path";
import { ask, type Answer } from "./ask.js";
import { owners, type Owner } from "./git.js";
import { importers, relatedTests, type Blast } from "./impact.js";
import { backend, modelName } from "./llm.js";
import { scan, type SourceFile } from "./scan.js";

type Row = {
  file: string;
  line: number;
  why: string;
  owners: Owner[];
  tests: string[];
  blast: Blast;
};

type AskOpts = {
  dir: string;
  json?: boolean;
  open?: boolean;
};

const program = new Command();

program.name("whereis").description("Where is it, who knows it, and what breaks");

program
  .command("ask")
  .description("Find where to look for a plain-English question")
  .argument("<question>", "plain-English question")
  .option("-d, --dir <dir>", "repository directory", ".")
  .option("--json", "print results as JSON")
  .option("-o, --open", "open the top result in Cursor")
  .action(async (question: string, opts: AskOpts) => {
    const started = Date.now();
    const useColor = !opts.json && Boolean(process.stdout.isTTY || process.env.FORCE_COLOR);
    const files = scan(opts.dir);
    if (!opts.json) {
      console.log(`scanned ${files.length} files · asking ${modelName()} via ${backend()}…`);
    }
    const stopSpinner = startSpinner(!opts.json);
    let answers: Answer[] = [];
    try {
      answers = await ask(files, question);
    } finally {
      stopSpinner();
    }
    const rows = answers.map((answer) => enrich(opts.dir, files, answer));
    if (opts.json) {
      console.log(JSON.stringify(rows, null, 2));
    } else if (rows.length === 0) {
      console.log("No confident match found.");
    } else {
      printRows(rows, useColor);
    }
    if (!opts.json) {
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`${seconds}s`);
    }
    const top = rows[0];
    if (opts.open && top) openInCursor(opts.dir, top.file, top.line);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});

function enrich(dir: string, files: SourceFile[], answer: Answer): Row {
  return {
    file: answer.file,
    line: answer.line,
    why: answer.why,
    owners: owners(dir, answer.file),
    tests: relatedTests(files, answer),
    blast: importers(files, answer.file),
  };
}

function paint(enabled: boolean, code: string, text: string): string {
  if (!enabled) return text;
  return `\u001b[${code}m${text}\u001b[0m`;
}

function printRows(rows: Row[], useColor: boolean): void {
  for (const [index, row] of rows.entries()) {
    const top = index === 0;
    const loc = `${row.file}:${row.line}`;
    const marker = top ? "→" : " ";
    console.log(`${paint(useColor, top ? "1;36" : "2", `${marker} ${loc}`)}`);
    if (row.why) console.log(paint(useColor, top ? "36" : "2", `    ${row.why}`));
    if (!top) continue;
    if (row.owners.length > 0) {
      const text = row.owners
        .map((person) => `${person.name} (${person.commits} commit${person.commits === 1 ? "" : "s"}, ${person.last})`)
        .join(", ");
      console.log(`   👤 Ask: ${text}`);
    }
    if (row.tests.length > 0) console.log(`   🧪 Run: ${row.tests.join(", ")}`);
    const noun = row.blast.count === 1 ? "importer" : "importers";
    const listed = row.blast.paths.length > 0 ? `: ${row.blast.paths.join(", ")}` : "";
    console.log(`   ⚠️  Blast radius: ${row.blast.label} (${row.blast.count} ${noun}${listed})`);
  }
}

function startSpinner(enabled: boolean): () => void {
  if (!enabled) return () => {};
  if (!process.stderr.isTTY) {
    process.stderr.write("thinking…\n");
    return () => {};
  }
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let tick = 0;
  const timer = setInterval(() => {
    process.stderr.write(`\r${frames[tick % frames.length]} thinking…`);
    tick += 1;
  }, 80);
  return () => {
    clearInterval(timer);
    process.stderr.write("\r\u001b[2K");
  };
}

function openInCursor(dir: string, file: string, line: number): void {
  const target = `${path.resolve(dir, file)}:${line}`;
  const child = spawn("cursor", ["-g", target], { stdio: "ignore", detached: true });
  child.on("error", () => {
    console.error(`Could not open Cursor at ${target}`);
  });
  child.unref();
}
