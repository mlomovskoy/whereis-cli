import "dotenv/config";
import { Command } from "commander";
import { ask } from "./ask.js";
import { scan } from "./scan.js";

const program = new Command();

program.name("whereis").description("Where is it, who knows it, and what breaks");

program
  .command("ask")
  .description("Find where to look for a plain-English question")
  .argument("<question>", "plain-English question")
  .option("-d, --dir <dir>", "repository directory", ".")
  .action(async (question: string, opts: { dir: string }) => {
    const files = scan(opts.dir);
    const answers = await ask(files, question);
    if (answers.length === 0) {
      console.log("No confident match found.");
      return;
    }
    for (const [index, answer] of answers.entries()) {
      const marker = index === 0 ? "→" : " ";
      console.log(`${marker} ${answer.file}:${answer.line}`);
      if (answer.why) console.log(`    ${answer.why}`);
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
