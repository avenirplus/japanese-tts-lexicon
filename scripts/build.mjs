import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataRoot = path.join(root, "data");
const overrideFile = path.join(dataRoot, "custom", "user-overrides.tsv");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

// 通常辞書を先に、user-overrides.tsv を必ず最後に読む。
const files = walk(dataRoot)
  .filter((p) => p.endsWith(".json") || p.endsWith(".tsv"))
  .sort((a, b) => {
    if (a === overrideFile) return 1;
    if (b === overrideFile) return -1;
    return a.localeCompare(b);
  });
const merged = {};
const sources = {};

// TTS向けの読みは、資料上の区切り記号を発音させない。
// 例: はんしん・あわじだいしんさい -> はんしんあわじだいしんさい
function normalizeReading(reading) {
  return String(reading)
    .normalize("NFKC")
    .replace(/[・･\s]+/g, "")
    .trim();
}

function add(surface, reading, file, allowOverride = false) {
  if (!surface || !reading) return;
  const normalizedReading = normalizeReading(reading);
  if (merged[surface] && merged[surface] !== normalizedReading && !allowOverride) {
    throw new Error(`conflict: ${surface}: ${merged[surface]} / ${normalizedReading} (${sources[surface]} / ${file})`);
  }
  merged[surface] = normalizedReading;
  sources[surface] = path.relative(root, file);
}

for (const file of files) {
  if (file.endsWith("contextual-readings.json")) continue;
  const allowOverride = file === overrideFile;

  if (file.endsWith(".tsv")) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const [surface, reading] = line.split("\t");
      add(surface, reading, file, allowOverride);
    }
    continue;
  }

  const obj = JSON.parse(fs.readFileSync(file, "utf8"));
  if (obj.format !== "japanese-tts-lexicon-map@1") continue;
  for (const [surface, reading] of Object.entries(obj.entries || {})) {
    add(surface, reading, file, allowOverride);
  }
}

const ordered = Object.fromEntries(
  Object.entries(merged).sort((a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0], "ja"))
);

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(
  path.join(root, "dist/lexicon.json"),
  JSON.stringify({
    format: "japanese-tts-lexicon-map@1",
    version: "1.1.0",
    count: Object.keys(ordered).length,
    entries: ordered
  }, null, 2)
);

console.log(`Built ${Object.keys(ordered).length} readings from ${files.length} dictionaries.`);
