import fs from 'node:fs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/audit-text.mjs <text-file>');
  process.exit(2);
}

const text = fs.readFileSync(inputPath, 'utf8');
const lex = JSON.parse(fs.readFileSync('dist/lexicon.json', 'utf8'));
const surfaces = Object.keys(lex.entries).sort((a,b)=>b.length-a.length);

let masked = text;
for (const s of surfaces) masked = masked.split(s).join(' '.repeat(s.length));

// Unknown candidate spans containing kanji. This intentionally surfaces
// candidates for review instead of guessing a reading.
const matches = masked.match(/[一-龯々〆ヵヶ]+/g) || [];
const counts = new Map();
for (const m of matches) counts.set(m, (counts.get(m) || 0) + 1);

const rows = [...counts.entries()].sort((a,b)=>
  b[1]-a[1] || b[0].length-a[0].length || a[0].localeCompare(b[0],'ja')
);

if (!rows.length) {
  console.log('No unknown kanji candidates found.');
  process.exit(0);
}

console.log('surface\tcount');
for (const [surface,count] of rows) console.log(`${surface}\t${count}`);
