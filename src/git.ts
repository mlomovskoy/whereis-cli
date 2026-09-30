import { execFileSync } from "child_process";

export type Owner = {
  name: string;
  commits: number;
  last: string;
};

const TWO_YEARS_SEC = 2 * 365.25 * 24 * 60 * 60;

function isBot(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("[bot]") ||
    lower.includes("dependabot") ||
    lower.includes("renovate") ||
    lower.includes("github-actions")
  );
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

export function relativeTime(unixSeconds: number, nowMs = Date.now()): string {
  const seconds = Math.max(0, Math.floor(nowMs / 1000 - unixSeconds));
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "just now";
  if (minutes < 60) return plural(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return plural(days, "day");
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return plural(weeks, "week");
  const months = Math.floor(days / 30);
  if (months < 12) return plural(months, "month");
  return plural(Math.floor(days / 365), "year");
}

type Group = {
  spells: Map<string, number>;
  times: number[];
};

function displayName(spells: Map<string, number>): string {
  let best = "";
  let bestCount = -1;
  for (const [name, count] of spells) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

function gitLog(dir: string, file: string): string | null {
  try {
    return execFileSync(
      "git",
      ["-C", dir, "log", "--use-mailmap", "--no-merges", "--format=%aN|%at", "--", file],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch {
    return null;
  }
}

export function owners(dir: string, file: string, max = 2): Owner[] {
  const raw = gitLog(dir, file);
  if (raw == null) return [];
  const groups = new Map<string, Group>();
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const sep = line.lastIndexOf("|");
    if (sep <= 0) continue;
    const name = line.slice(0, sep).trim();
    const timestamp = Number(line.slice(sep + 1));
    if (!name || !Number.isFinite(timestamp) || isBot(name)) continue;
    const key = name.toLowerCase();
    let group = groups.get(key);
    if (!group) {
      group = { spells: new Map(), times: [] };
      groups.set(key, group);
    }
    group.spells.set(name, (group.spells.get(name) ?? 0) + 1);
    group.times.push(timestamp);
  }

  const cutoff = Math.floor(Date.now() / 1000) - TWO_YEARS_SEC;
  const rank = (recentOnly: boolean) => {
    const people: { name: string; commits: number; lastTs: number }[] = [];
    for (const group of groups.values()) {
      const times = recentOnly ? group.times.filter((ts) => ts >= cutoff) : group.times;
      if (times.length === 0) continue;
      people.push({
        name: displayName(group.spells),
        commits: times.length,
        lastTs: Math.max(...times),
      });
    }
    people.sort((a, b) => b.commits - a.commits || b.lastTs - a.lastTs);
    return people;
  };

  const recent = rank(true);
  const chosen = (recent.length > 0 ? recent : rank(false)).slice(0, max);
  return chosen.map((person) => ({
    name: person.name,
    commits: person.commits,
    last: relativeTime(person.lastTs),
  }));
}
