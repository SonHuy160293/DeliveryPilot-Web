import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Line endings are normalized so the hash is stable across checkouts.
const css = readFileSync("src/index.css", "utf8").replace(/\r\n/g, "\n");
const approvedHash =
  "3824256309069bf996d3ee02f76a7e12f28d0ffd0a6c4c521b9a21ae12a461c3";
const failures = [];
if (createHash("sha256").update(css).digest("hex") !== approvedHash) {
  failures.push("UI-TKN-07: token source differs from the approved pack.");
}

function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      inspect(path);
      continue;
    }
    if (!path.endsWith(".tsx") || path.endsWith(".test.tsx")) continue;
    const source = readFileSync(path, "utf8");
    if (
      /style=|#[\da-f]{3,8}\b|(?:bg|text|border)-(?:red|blue|slate|gray|green|zinc|white|black)(?:-|\b)/i.test(
        source,
      )
    ) {
      failures.push(`${path}: nonsemantic color or inline style.`);
    }
    if (
      /(?:p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy])-(?:0\.5|1\.5|2\.5|3\.5|5|7|9|10|11|14)\b/.test(
        source,
      )
    ) {
      failures.push(`${path}: unsupported spacing step.`);
    }
    if (
      /(?:bg|text|border|ring|w|h|grid-cols|grid-rows|translate-x|translate-y|p|m|gap)-\[/.test(
        source,
      )
    ) {
      failures.push(`${path}: arbitrary utility value.`);
    }
    const lines = source
      .split(/\r?\n/)
      .filter(
        (line) => line.trim() && !/^\s*(?:\/\/|\/\*|\*)/.test(line),
      ).length;
    if (lines > 180)
      failures.push(
        `${path}: ${String(lines)} nonblank/noncomment lines exceeds 180.`,
      );
  }
}
inspect("src");

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((part) => {
      const value = Number.parseInt(part, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

// The theme is light-only; a mode is checked only when its block exists.
for (const mode of [":root", ".dark"]) {
  if (!css.includes(`${mode} {`)) continue;
  const block = css.slice(css.indexOf(`${mode} {`)).split("}")[0];
  const tokens = Object.fromEntries(
    [...block.matchAll(/--([\w-]+): (#[\da-f]{6});/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  const pairs = [
    ["foreground", "background", 4.5],
    ["card-foreground", "card", 4.5],
    ["popover-foreground", "popover", 4.5],
    ["muted-foreground", "muted", 4.5],
    ["muted-foreground", "card", 4.5],
    ["muted-foreground", "background", 4.5],
    ["primary-foreground", "primary", 4.5],
    ["secondary-foreground", "secondary", 4.5],
    ["accent-foreground", "accent", 4.5],
    ["destructive-foreground", "destructive", 4.5],
    ["primary", "background", 4.5],
    ["destructive", "card", 4.5],
    ["input", "card", 3],
    ["input", "background", 3],
    ["ring", "card", 3],
    ["ring", "background", 3],
  ];
  let minimum = Infinity;
  for (const [foreground, background, threshold] of pairs) {
    const a = luminance(tokens[foreground]);
    const b = luminance(tokens[background]);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    minimum = Math.min(minimum, ratio);
    if (ratio < threshold)
      failures.push(
        `${mode} ${foreground}/${background}: ${ratio.toFixed(2)} < ${String(threshold)}.`,
      );
  }
  console.log(
    `${mode}: ${String(pairs.length)} contrast pairs checked; lowest ratio ${minimum.toFixed(2)}:1.`,
  );
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    "UI source checks passed: frozen tokens, semantic colors, spacing, utility values, composition size.",
  );
}
