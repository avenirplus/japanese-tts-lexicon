import fs from "node:fs";
import { normalizeForTTS } from "./normalize.mjs";

const lexicon = JSON.parse(fs.readFileSync("dist/lexicon.json", "utf8"));
const tests = JSON.parse(fs.readFileSync("tests/regression.json", "utf8")).cases;

let failed = 0;
for (const test of tests) {
  const out = normalizeForTTS(test.input, lexicon.entries);
  if (test.mustContain && !out.includes(test.mustContain)) {
    console.error("FAIL mustContain", test, out);
    failed++;
  }
  if (test.mustNotContain && out.includes(test.mustNotContain)) {
    console.error("FAIL mustNotContain", test, out);
    failed++;
  }
}

if (failed) process.exit(1);
console.log(`OK: ${tests.length} regression cases`);
