import { execFile } from "child_process";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import OpenAI from "openai";

export type Backend = "xai" | "openai" | "grok-cli";

/** Default model. `WHEREIS_MODEL` overrides this at call time. */
export const MODEL = "grok-4.6";

export function modelName(): string {
  return process.env.WHEREIS_MODEL?.trim() || MODEL;
}

export function backend(): Backend {
  if (process.env.XAI_API_KEY) return "xai";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "grok-cli";
}

function execFileText(
  cmd: string,
  args: string[],
  opts: { cwd: string; timeout: number },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { ...opts, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const detail = String(stderr ?? "").trim();
          err.message = detail ? `${err.message}\n${detail}` : err.message;
          reject(err);
          return;
        }
        resolve({ stdout: String(stdout ?? ""), stderr: String(stderr ?? "") });
      },
    );
  });
}

function stripAnsi(text: string): string {
  return text.replace(/\u001B\[[0-9;]*[A-Za-z]/g, "");
}

async function completeGrok(prompt: string): Promise<string> {
  const text = prompt.includes("Do not use any tools")
    ? prompt
    : `${prompt}\nDo not use any tools.`;
  const dir = await mkdtemp(path.join(tmpdir(), "whereis-"));
  try {
    const { stdout } = await execFileText(
      "grok",
      [
        "-p",
        text,
        "-m",
        modelName(),
        "--disable-web-search",
        "--max-turns",
        "3",
        "--reasoning-effort",
        "low",
      ],
      { cwd: dir, timeout: 180_000 },
    );
    return stripAnsi(stdout).trim();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function completeApi(prompt: string, baseURL: string | undefined, apiKey: string): Promise<string> {
  const client = new OpenAI({ apiKey, baseURL });
  const response = await client.chat.completions.create({
    model: modelName(),
    messages: [{ role: "user", content: prompt }],
  });
  return (response.choices[0]?.message?.content ?? "").trim();
}

export async function complete(prompt: string): Promise<string> {
  const which = backend();
  if (which === "xai") {
    const key = process.env.XAI_API_KEY;
    if (!key) throw new Error("XAI_API_KEY is not set");
    return completeApi(prompt, "https://api.x.ai/v1", key);
  }
  if (which === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    return completeApi(prompt, undefined, key);
  }
  return completeGrok(prompt);
}

export function extractJson<T>(text: string): T {
  const trimmed = stripAnsi(text).trim();
  const candidates: string[] = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const arrayAt = trimmed.indexOf("[");
  const objectAt = trimmed.indexOf("{");
  let start = -1;
  if (arrayAt >= 0 && (objectAt < 0 || arrayAt < objectAt)) start = arrayAt;
  else start = objectAt;
  if (start >= 0) {
    const endChar = trimmed[start] === "[" ? "]" : "}";
    const end = trimmed.lastIndexOf(endChar);
    if (end > start) candidates.push(trimmed.slice(start, end + 1));
  }
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // try the next slice
    }
  }
  throw new Error("Could not parse JSON from LLM reply");
}
