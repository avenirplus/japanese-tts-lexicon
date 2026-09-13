import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataRoot = path.join(root, "data");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(dataRoot).filter((p) => p.endsWith(".json") || p.endsWith(".tsv"));
const merged = {};
const sources = {};

function add(surface, reading, file) {
  if (!surface || !reading) return;
  if (merged[surface] && merged[surface] !== reading) {
    throw new Error(`conflict: ${surface}: ${merged[surface]} / ${reading} (${sources[surface]} / ${file})`);
  }
  merged[surface] = reading;
  sources[surface] = path.relative(root, file);
}

for (const file of files) {
  if (file.endsWith("contextual-readings.json")) continue;

  if (file.endsWith(".tsv")) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const [surface, reading] = line.split("\t");
      add(surface, reading, file);
    }
    continue;
  }

  const obj = JSON.parse(fs.readFileSync(file, "utf8"));
  if (obj.format !== "japanese-tts-lexicon-map@1") continue;
  for (const [surface, reading] of Object.entries(obj.entries || {})) {
    add(surface, reading, file);
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
    version: "1.0.0",
    count: Object.keys(ordered).length,
    entries: ordered
  }, null, 2)
);

console.log(`Built ${Object.keys(ordered).length} readings from ${files.length} dictionaries.`);
